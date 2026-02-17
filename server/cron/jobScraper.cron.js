// cron/jobScraper.cron.js
// ── Daily cron job: scrape companies, notify users ────────────────────────────
// Uses node-cron. Import and call initCron() once at server startup.

const cron = require('node-cron');
const { runAllScrapers } = require('../services/scraperService');
const { notifyUsersOfNewJobs } = require('../services/emailService');

/**
 * Run the full pipeline: scrape → notify.
 * Exported separately so the manual-trigger route can call it directly.
 */
async function runJobPipeline() {
  console.log('[Cron] ⏰ Job pipeline started at', new Date().toISOString());

  try {
    const summary = await runAllScrapers();

    if (summary.newJobs.length > 0) {
      console.log(`[Cron] 📬 Triggering email notifications for ${summary.newJobs.length} new jobs`);
      await notifyUsersOfNewJobs(summary.newJobs);
    } else {
      console.log('[Cron] ℹ No new jobs found this run — no emails sent');
    }

    console.log('[Cron] ✅ Pipeline complete:', {
      companies: summary.total,
      newJobs: summary.newJobs.length,
      errors: summary.errors.length,
      duration: `${((summary.finishedAt - summary.startedAt) / 1000).toFixed(1)}s`,
    });

    return summary;
  } catch (err) {
    console.error('[Cron] ✗ Pipeline failed:', err.message);
    throw err;
  }
}

/**
 * Register the cron schedule. Call once at app startup.
 * Schedule: every day at 08:00 AM server time.
 *
 * Override via env: SCRAPER_CRON_SCHEDULE (standard cron syntax)
 * e.g. "0 8 * * *"  = daily 8 AM
 *      "0 * * * *"  = every hour (useful for testing)
 */
function initCron() {
  const schedule = process.env.SCRAPER_CRON_SCHEDULE || '0 8 * * *';

  if (!cron.validate(schedule)) {
    console.error(`[Cron] ✗ Invalid cron schedule "${schedule}" — cron NOT started`);
    return;
  }

  const task = cron.schedule(schedule, runJobPipeline, {
    scheduled: true,
    timezone: process.env.CRON_TIMEZONE || 'America/New_York',
  });

  console.log(`[Cron] ✅ Job scraper scheduled: "${schedule}" (${process.env.CRON_TIMEZONE || 'America/New_York'})`);
  return task;
}

module.exports = { initCron, runJobPipeline };