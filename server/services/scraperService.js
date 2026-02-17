// services/scraperService.js
// ── Core scraping logic ───────────────────────────────────────────────────────
// Uses axios (HTTP) + cheerio (HTML parsing). No Puppeteer.
// Platform-aware: auto-detects Greenhouse, Lever, Workday, generic HTML.
// Sequential scraping with 2-3 second delays to be polite to servers.

const axios   = require('axios');
const cheerio = require('cheerio');
const Job     = require('../models/job');
const Company = require('../models/company');

// ── Config ───────────────────────────────────────────────────────────────────
const AXIOS_TIMEOUT_MS = 15_000;
const DELAY_MIN_MS     = 2_000;
const DELAY_MAX_MS     = 3_500;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DEFAULT_KEYWORDS = ['intern', 'internship', 'software engineer', 'summer', 'backend', 'sde'];

// ── Helpers ──────────────────────────────────────────────────────────────────

function randomDelay(min = DELAY_MIN_MS, max = DELAY_MAX_MS) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function titleMatchesKeywords(title, keywords) {
  const lower = title.toLowerCase();
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

function resolveUrl(href, baseUrl) {
  if (!href) return baseUrl;
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

// ── Platform Detection ────────────────────────────────────────────────────────

function detectPlatform(url) {
  if (/greenhouse\.io/i.test(url))      return 'greenhouse';
  if (/lever\.co/i.test(url))           return 'lever';
  if (/myworkdayjobs\.com/i.test(url))  return 'workday';
  if (/smartrecruiters\.com/i.test(url))return 'smartrecruiters';
  if (/ashbyhq\.com/i.test(url))        return 'ashby';
  return 'generic';
}

// ── Platform Scrapers ─────────────────────────────────────────────────────────

/**
 * Greenhouse: public JSON API — no HTML scraping needed.
 * URL format: https://boards.greenhouse.io/<token>
 */
async function scrapeGreenhouse(company) {
  // Extract board token from URL
  // e.g. https://boards.greenhouse.io/stripe  →  "stripe"
  const match = company.careersUrl.match(/greenhouse\.io\/([^/?#]+)/i);
  if (!match) {
    console.warn(`[Scraper] ⚠ Greenhouse: could not extract token from ${company.careersUrl}`);
    return [];
  }
  const token = match[1];

  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`;
  console.log(`[Scraper] 🌿 Greenhouse API: ${apiUrl}`);

  const res = await axios.get(apiUrl, {
    timeout: AXIOS_TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });

  return (res.data.jobs || []).map((j) => ({
    title:    j.title || 'Untitled',
    url:      j.absolute_url || company.careersUrl,
    location: j.location?.name || 'Not specified',
  }));
}

/**
 * Lever: public JSON API — no HTML scraping needed.
 * URL format: https://jobs.lever.co/<token>
 */
async function scrapeLever(company) {
  // Extract company token from URL
  // e.g. https://jobs.lever.co/vercel  →  "vercel"
  const match = company.careersUrl.match(/lever\.co\/([^/?#]+)/i);
  if (!match) {
    console.warn(`[Scraper] ⚠ Lever: could not extract token from ${company.careersUrl}`);
    return [];
  }
  const token = match[1];

  const apiUrl = `https://api.lever.co/v0/postings/${token}?mode=json`;
  console.log(`[Scraper] 🎯 Lever API: ${apiUrl}`);

  const res = await axios.get(apiUrl, {
    timeout: AXIOS_TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });

  return (res.data || []).map((j) => ({
    title:    j.text || 'Untitled',
    url:      j.hostedUrl || company.careersUrl,
    location: j.categories?.location || j.categories?.allLocations?.[0] || 'Not specified',
  }));
}

/**
 * Workday: scrapes the REST API that Workday career pages use internally.
 * URL format: https://<company>.wd5.myworkdayjobs.com/<siteName>
 * Falls back to generic HTML if the API call fails.
 */
async function scrapeWorkday(company) {
  // Workday internal API pattern
  // e.g. https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite
  //   → POST https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs
  const match = company.careersUrl.match(
    /https?:\/\/([^.]+)\.([^/]+)\.myworkdayjobs\.com\/([^/?#]+)/i
  );
  if (!match) {
    console.warn(`[Scraper] ⚠ Workday: could not parse URL ${company.careersUrl}`);
    return [];
  }

  const [, subdomain, wdInstance, siteName] = match;
  const apiUrl = `https://${subdomain}.${wdInstance}.myworkdayjobs.com/wday/cxs/${subdomain}/${siteName}/jobs`;

  console.log(`[Scraper] 🏢 Workday API: ${apiUrl}`);

  const res = await axios.post(
    apiUrl,
    { limit: 100, offset: 0, searchText: 'intern' },
    {
      timeout: AXIOS_TIMEOUT_MS,
      headers: {
        'User-Agent':   USER_AGENT,
        'Content-Type': 'application/json',
        Accept:         'application/json',
      },
    }
  );

  const jobs = res.data?.jobPostings || [];
  return jobs.map((j) => ({
    title:    j.title || 'Untitled',
    url:      resolveUrl(j.externalPath, company.careersUrl),
    location: j.locationsText || 'Not specified',
  }));
}

/**
 * Ashby: public JSON API.
 * URL format: https://jobs.ashbyhq.com/<token>
 */
async function scrapeAshby(company) {
  const match = company.careersUrl.match(/ashbyhq\.com\/([^/?#]+)/i);
  if (!match) return [];
  const token = match[1];

  const apiUrl = `https://api.ashbyhq.com/posting-api/job-board/${token}`;
  console.log(`[Scraper] 🔷 Ashby API: ${apiUrl}`);

  const res = await axios.get(apiUrl, {
    timeout: AXIOS_TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });

  return (res.data?.jobs || []).map((j) => ({
    title:    j.title || 'Untitled',
    url:      j.jobUrl || company.careersUrl,
    location: j.location || 'Not specified',
  }));
}

/**
 * SmartRecruiters: public JSON API.
 * URL format: https://careers.smartrecruiters.com/<token>
 */
async function scrapeSmartRecruiters(company) {
  const match = company.careersUrl.match(/smartrecruiters\.com\/([^/?#]+)/i);
  if (!match) return [];
  const token = match[1];

  const apiUrl = `https://api.smartrecruiters.com/v1/companies/${token}/postings?limit=100`;
  console.log(`[Scraper] 🟢 SmartRecruiters API: ${apiUrl}`);

  const res = await axios.get(apiUrl, {
    timeout: AXIOS_TIMEOUT_MS,
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });

  return (res.data?.content || []).map((j) => ({
    title:    j.name || 'Untitled',
    url:      j.ref  || company.careersUrl,
    location: j.location?.city || j.location?.country || 'Not specified',
  }));
}

// ── HTML Heuristic Extraction (Generic Fallback) ──────────────────────────────

function extractJobsFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  const rawJobs = [];

  // Strategy 1: anchor tags that look like job postings
  $('a').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href') || '';

    const jobPathPattern = /job|career|position|opening|role|intern/i;
    if (text.length > 5 && text.length < 120 && jobPathPattern.test(href)) {
      const parentText = $(el).parent().text().trim();
      const locationMatch = parentText.match(
        /\b(remote|new york|san francisco|seattle|austin|boston|chicago|los angeles|london|bangalore|hyderabad|pune|mumbai|multiple)\b/i
      );
      rawJobs.push({
        title:    text,
        url:      resolveUrl(href, baseUrl),
        location: locationMatch ? locationMatch[0] : 'Not specified',
      });
    }
  });

  // Strategy 2: list items / divs with semantic job classes
  if (rawJobs.length === 0) {
    const candidates = $(
      'li, [role="listitem"], .job-title, .position-title, .opening-title, .job-listing, .career-listing'
    );
    candidates.each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 5 && text.length < 120) {
        const anchor = $(el).find('a').first();
        const href   = anchor.attr('href') || '';
        rawJobs.push({
          title:    text.split('\n')[0].trim(),
          url:      resolveUrl(href, baseUrl),
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

async function scrapeCompany(company) {
  const result = { inserted: [], errors: [] };

  console.log(`[Scraper] ▶ Scraping: ${company.name} (${company.careersUrl})`);

  // ── Detect platform and fetch jobs ───────────────────────────────────────
  let rawJobs = [];
  const platform = detectPlatform(company.careersUrl);
  console.log(`[Scraper] 🔍 Platform detected: ${platform}`);

  try {
    switch (platform) {
      case 'greenhouse':
        rawJobs = await scrapeGreenhouse(company);
        break;
      case 'lever':
        rawJobs = await scrapeLever(company);
        break;
      case 'workday':
        rawJobs = await scrapeWorkday(company);
        break;
      case 'ashby':
        rawJobs = await scrapeAshby(company);
        break;
      case 'smartrecruiters':
        rawJobs = await scrapeSmartRecruiters(company);
        break;
      default: {
        // Generic HTML fallback
        const response = await axios.get(company.careersUrl, {
          timeout: AXIOS_TIMEOUT_MS,
          headers: {
            'User-Agent':      USER_AGENT,
            Accept:            'text/html,application/xhtml+xml',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          maxRedirects: 5,
        });
        rawJobs = extractJobsFromHtml(response.data, company.careersUrl);
      }
    }
  } catch (err) {
    const msg = `[Scraper] ✗ Fetch failed for ${company.name} [${platform}]: ${err.message}`;
    console.error(msg);
    result.errors.push(msg);

    // Update lastChecked even on failure so we don't hammer broken endpoints
    await Company.findByIdAndUpdate(company._id, { lastChecked: new Date() }).catch(() => {});
    return result;
  }

  console.log(`[Scraper] ℹ Found ${rawJobs.length} raw listings for ${company.name}`);

  // ── Filter by keywords ────────────────────────────────────────────────────
  const keywords = company.keywords?.length ? company.keywords : DEFAULT_KEYWORDS;
  const filtered = rawJobs.filter((j) => titleMatchesKeywords(j.title, keywords));
  console.log(`[Scraper] ✓ ${filtered.length} jobs match keywords for ${company.name}`);

  // ── Persist new jobs (URL-based dedup — title alone is NOT unique) ────────
  for (const job of filtered) {
    // Skip if URL is just the careers page itself (extraction produced no real link)
    if (job.url === company.careersUrl) continue;

    try {
      const doc = await Job.findOneAndUpdate(
        { url: job.url },                        // ← KEY FIX: dedup by URL not title
        {
          $setOnInsert: {
            company:     company.name,
            title:       job.title,
            location:    job.location,
            url:         job.url,
            sourceUrl:   company.careersUrl,
            firstSeenAt: new Date(),
          },
          $set: { lastSeenAt: new Date(), isActive: true },  // always refresh
        },
        {
          upsert: true,
          new:    false,   // null = was just inserted (new job!)
        }
      );

      if (doc === null) {
        // null → upsert created a brand new document
        const inserted = await Job.findOne({ url: job.url }).lean();
        if (inserted) {
          result.inserted.push(inserted);
          console.log(`[Scraper] ➕ New job: "${job.title}" @ ${company.name}`);
        }
      }
    } catch (err) {
      if (err.code === 11000) {
        // E11000 duplicate key — race condition on concurrent runs, safe to ignore
        continue;
      }
      console.error(`[Scraper] ✗ DB error for "${job.title}": ${err.message}`);
      result.errors.push(err.message);
    }
  }

  // ── Mark jobs not seen recently as inactive ───────────────────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await Job.updateMany(
    { company: company.name, lastSeenAt: { $lt: thirtyDaysAgo }, isActive: true },
    { $set: { isActive: false } }
  ).catch(() => {});

  // ── Update lastChecked on company ─────────────────────────────────────────
  await Company.findByIdAndUpdate(company._id, { lastChecked: new Date() }).catch(() => {});

  return result;
}

// ── Batch Runner ──────────────────────────────────────────────────────────────

async function runAllScrapers() {
  const companies = await Company.find({ active: true }).lean();
  console.log(`[Scraper] 🚀 Starting batch run for ${companies.length} companies`);

  const summary = {
    total:      companies.length,
    newJobs:    [],
    errors:     [],
    startedAt:  new Date(),
    finishedAt: null,
  };

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    const { inserted, errors } = await scrapeCompany(company);

    summary.newJobs.push(...inserted);
    summary.errors.push(...errors);

    // Polite delay between requests (skip after last one)
    if (i < companies.length - 1) {
      await randomDelay();
    }
  }

  summary.finishedAt = new Date();
  const duration = ((summary.finishedAt - summary.startedAt) / 1000).toFixed(1);
  console.log(`[Scraper] ✅ Batch complete. ${summary.newJobs.length} new jobs in ${duration}s`);

  return summary;
}

module.exports = { scrapeCompany, runAllScrapers };