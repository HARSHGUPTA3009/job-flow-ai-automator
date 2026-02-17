// scripts/seedCompanies.js
// ── Pre-load companies to monitor ─────────────────────────────────────────────
// Run once:  node scripts/seedCompanies.js
// Safe to re-run: uses upsert so no duplicates.

require('dotenv').config();
const mongoose = require('mongoose');
const Company  = require('../models/Company');

// 30 companies with static/semi-static career pages (no JS required)
const SEED_COMPANIES = [
  { name: 'Stripe',       careersUrl: 'https://stripe.com/jobs/search?query=intern' },
  { name: 'Cloudflare',   careersUrl: 'https://www.cloudflare.com/careers/jobs/?keywords=intern' },
  { name: 'Notion',       careersUrl: 'https://www.notion.so/careers' },
  { name: 'Figma',        careersUrl: 'https://www.figma.com/careers/' },
  { name: 'Vercel',       careersUrl: 'https://vercel.com/careers' },
  { name: 'Linear',       careersUrl: 'https://linear.app/careers' },
  { name: 'Retool',       careersUrl: 'https://retool.com/careers' },
  { name: 'Fly.io',       careersUrl: 'https://fly.io/jobs' },
  { name: 'PlanetScale',  careersUrl: 'https://planetscale.com/careers' },
  { name: 'Supabase',     careersUrl: 'https://supabase.com/careers' },
  { name: 'Railway',      careersUrl: 'https://railway.app/careers' },
  { name: 'Render',       careersUrl: 'https://render.com/careers' },
  { name: 'Twilio',       careersUrl: 'https://www.twilio.com/en-us/company/jobs?keywords=intern' },
  { name: 'MongoDB',      careersUrl: 'https://www.mongodb.com/careers' },
  { name: 'Elastic',      careersUrl: 'https://www.elastic.co/about/careers' },
  { name: 'HubSpot',      careersUrl: 'https://www.hubspot.com/careers/jobs?page=1' },
  { name: 'Atlassian',    careersUrl: 'https://www.atlassian.com/company/careers/all-jobs' },
  { name: 'Datadog',      careersUrl: 'https://careers.datadoghq.com/all-jobs/' },
  { name: 'Snowflake',    careersUrl: 'https://careers.snowflake.com/us/en/search-results' },
  { name: 'Databricks',   careersUrl: 'https://www.databricks.com/company/careers/open-positions' },
  { name: 'HashiCorp',    careersUrl: 'https://www.hashicorp.com/careers' },
  { name: 'Confluent',    careersUrl: 'https://www.confluent.io/careers/#open-roles' },
  { name: 'dbt Labs',     careersUrl: 'https://www.getdbt.com/dbt-labs/open-roles' },
  { name: 'Airbyte',      careersUrl: 'https://airbyte.com/company/careers' },
  { name: 'Temporal',     careersUrl: 'https://temporal.io/careers' },
  { name: 'Prisma',       careersUrl: 'https://www.prisma.io/careers' },
  { name: 'Loom',         careersUrl: 'https://www.loom.com/careers' },
  { name: 'Airtable',     careersUrl: 'https://airtable.com/careers' },
  { name: 'Asana',        careersUrl: 'https://asana.com/jobs' },
  { name: 'Calendly',     careersUrl: 'https://careers.calendly.com' },
];

const DEFAULT_KEYWORDS = ['intern', 'internship', 'software engineer', 'summer', 'backend', 'sde'];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[Seed] Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const c of SEED_COMPANIES) {
    const result = await Company.findOneAndUpdate(
      { careersUrl: c.careersUrl },
      {
        $setOnInsert: {
          name: c.name,
          careersUrl: c.careersUrl,
          keywords: DEFAULT_KEYWORDS,
          active: true,
        },
      },
      { upsert: true, new: false }
    );

    if (result === null) {
      console.log(`[Seed] ✅ Added: ${c.name}`);
      created++;
    } else {
      skipped++;
    }
  }

  console.log(`\n[Seed] Done. Created: ${created}, Already existed: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed] ✗ Error:', err.message);
  process.exit(1);
});