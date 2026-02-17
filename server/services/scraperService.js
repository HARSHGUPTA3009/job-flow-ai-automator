// services/scraperService.js
// ── Core scraping logic ───────────────────────────────────────────────────────
// Uses axios (HTTP) + cheerio (HTML parsing). No Puppeteer.
// Sequential scraping with 2-3 second delays to be polite to servers.

const axios = require('axios');
const cheerio = require('cheerio');
const Job = require('../models/job');
const Company = require('../models/company');

// ── Config ───────────────────────────────────────────────────────────────────
const AXIOS_TIMEOUT_MS = 15_000;
const DELAY_MIN_MS = 2_000;
const DELAY_MAX_MS = 3_500;

// Common User-Agent to avoid trivial bot blocks
const USER_AGENT =
  'Mozilla/5.0 (compatible; AutoJobFlow/1.0; +https://autojobflow.app/bot)';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Sleep for a random duration between [min, max] ms.
 */
function randomDelay(min = DELAY_MIN_MS, max = DELAY_MAX_MS) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Returns true when a job title matches at least one keyword.
 * Case-insensitive.
 */
function titleMatchesKeywords(title, keywords) {
  const lower = title.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

/**
 * Resolve a possibly-relative href against the company base URL.
 */
function resolveUrl(href, baseUrl) {
  if (!href) return baseUrl;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

// ── HTML Heuristic Extraction ─────────────────────────────────────────────────
/**
 * Attempt to pull job listings from a static career page.
 *
 * Strategy: look for <a> or <li> / <div> elements whose text looks like a job
 * title. This is inherently fragile for dynamic (JS-rendered) pages, but works
 * well for the majority of simple career listing pages.
 *
 * Returns an array of { title, url, location } objects.
 */
function extractJobsFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  const rawJobs = [];

  // ── Strategy 1: anchor tags that look like job postings ──────────────────
  $('a').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href') || '';

    // Heuristic: the link text is between 5 and 120 chars AND
    // the href contains job-related path segments
    const jobPathPattern = /job|career|position|opening|role|intern/i;
    if (
      text.length > 5 &&
      text.length < 120 &&
      jobPathPattern.test(href)
    ) {
      // Try to find a sibling/nearby location string
      const parentText = $(el).parent().text().trim();
      const locationMatch = parentText.match(
        /\b(remote|new york|san francisco|seattle|austin|boston|chicago|los angeles|london|bangalore|hyderabad|multiple)\b/i
      );
      rawJobs.push({
        title: text,
        url: resolveUrl(href, baseUrl),
        location: locationMatch ? locationMatch[0] : 'Not specified',
      });
    }
  });

  // ── Strategy 2: list items / divs with role="listitem" ───────────────────
  if (rawJobs.length === 0) {
    const candidates = $('li, [role="listitem"], .job-title, .position-title, .opening-title');
    candidates.each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 5 && text.length < 120) {
        const anchor = $(el).find('a').first();
        const href = anchor.attr('href') || '';
        rawJobs.push({
          title: text.split('\n')[0].trim(), // take first line only
          url: resolveUrl(href, baseUrl),
          location: 'Not specified',
        });
      }
    });
  }

  // Dedupe by title within this page parse
  const seen = new Set();
  return rawJobs.filter((j) => {
    const key = j.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Single-Company Scraper ────────────────────────────────────────────────────
/**
 * Scrape one company's careers page.
 * Returns { inserted: Job[], errors: string[] }
 */
async function scrapeCompany(company) {
  const result = { inserted: [], errors: [] };

  console.log(`[Scraper] ▶ Scraping: ${company.name} (${company.careersUrl})`);

  // ── Fetch page ────────────────────────────────────────────────────────────
  let html;
  try {
    const response = await axios.get(company.careersUrl, {
      timeout: AXIOS_TIMEOUT_MS,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // Follow redirects (default), max 5
      maxRedirects: 5,
    });
    html = response.data;
  } catch (err) {
    const msg = `[Scraper] ✗ Fetch failed for ${company.name}: ${err.message}`;
    console.error(msg);
    result.errors.push(msg);
    return result;
  }

  // ── Parse HTML ────────────────────────────────────────────────────────────
  let rawJobs;
  try {
    rawJobs = extractJobsFromHtml(html, company.careersUrl);
  } catch (err) {
    const msg = `[Scraper] ✗ Parse failed for ${company.name}: ${err.message}`;
    console.error(msg);
    result.errors.push(msg);
    return result;
  }

  console.log(`[Scraper] ℹ Found ${rawJobs.length} raw listings for ${company.name}`);

  // ── Filter by keywords ────────────────────────────────────────────────────
  const keywords = company.keywords && company.keywords.length
    ? company.keywords
    : ['intern', 'internship', 'software engineer', 'summer', 'backend', 'sde'];

  const filtered = rawJobs.filter((j) => titleMatchesKeywords(j.title, keywords));
  console.log(`[Scraper] ✓ ${filtered.length} jobs match keywords for ${company.name}`);

  // ── Persist new jobs (duplicate-safe) ─────────────────────────────────────
  for (const job of filtered) {
    try {
      const doc = await Job.findOneAndUpdate(
        { company: company.name, title: job.title },
        {
          $setOnInsert: {
            company: company.name,
            title: job.title,
            location: job.location,
            url: job.url,
            sourceUrl: company.careersUrl,
            postedDate: new Date(),
          },
        },
        {
          upsert: true,
          new: false, // returns the OLD doc — null means it was just inserted
          collation: { locale: 'en', strength: 2 }, // case-insensitive match
        }
      );

      if (doc === null) {
        // null means upsert created a new document
        const inserted = await Job.findOne({ company: company.name, title: job.title });
        result.inserted.push(inserted);
        console.log(`[Scraper] ➕ New job inserted: "${job.title}" @ ${company.name}`);
      }
    } catch (err) {
      // E11000 duplicate key = race condition, safe to ignore
      if (err.code !== 11000) {
        console.error(`[Scraper] ✗ DB error for "${job.title}": ${err.message}`);
        result.errors.push(err.message);
      }
    }
  }

  // ── Update lastChecked ────────────────────────────────────────────────────
  await Company.findByIdAndUpdate(company._id, { lastChecked: new Date() });

  return result;
}

// ── Batch Runner ──────────────────────────────────────────────────────────────
/**
 * Run scraper across ALL active companies, sequentially with polite delays.
 * Returns a summary object.
 */
async function runAllScrapers() {
  const companies = await Company.find({ active: true }).lean();
  console.log(`[Scraper] 🚀 Starting batch run for ${companies.length} companies`);

  const summary = {
    total: companies.length,
    newJobs: [],
    errors: [],
    startedAt: new Date(),
    finishedAt: null,
  };

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];

    const { inserted, errors } = await scrapeCompany(company);
    summary.newJobs.push(...inserted);
    summary.errors.push(...errors);

    // Polite delay between companies (skip after last one)
    if (i < companies.length - 1) {
      await randomDelay();
    }
  }

  summary.finishedAt = new Date();
  const duration = ((summary.finishedAt - summary.startedAt) / 1000).toFixed(1);
  console.log(
    `[Scraper] ✅ Batch complete. ${summary.newJobs.length} new jobs found in ${duration}s`
  );

  return summary;
}

module.exports = { scrapeCompany, runAllScrapers };