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
  // Big Tech / FAANG
{ name: 'Google', careersUrl: 'https://careers.google.com/jobs/results/?q=intern' },
{ name: 'Microsoft', careersUrl: 'https://jobs.careers.microsoft.com/global/en/search?q=intern' },
{ name: 'Amazon', careersUrl: 'https://www.amazon.jobs/en/search?base_query=intern' },
{ name: 'Apple', careersUrl: 'https://jobs.apple.com/en-in/search?search=intern' },
{ name: 'Meta', careersUrl: 'https://www.metacareers.com/jobs/?q=intern' },

// Unicorns / Product Companies
{ name: 'Uber', careersUrl: 'https://www.uber.com/global/en/careers/list/?query=intern' },
{ name: 'Airbnb', careersUrl: 'https://careers.airbnb.com/positions/?search=intern' },
{ name: 'Netflix', careersUrl: 'https://jobs.netflix.com/search?q=intern' },
{ name: 'Salesforce', careersUrl: 'https://salesforce.wd1.myworkdayjobs.com/External_Career_Site?locations=All&keyword=intern' },
{ name: 'Adobe', careersUrl: 'https://careers.adobe.com/us/en/search-results?keywords=intern' },
{ name: 'Nvidia', careersUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite?q=intern' },

// Trading / Quant
{ name: 'Jane Street', careersUrl: 'https://www.janestreet.com/join-jane-street/positions/?type=internship' },
{ name: 'Tower Research', careersUrl: 'https://www.tower-research.com/open-positions/' },
{ name: 'Optiver', careersUrl: 'https://optiver.com/working-at-optiver/career-opportunities/' },

// Indian Product Companies
{ name: 'Flipkart', careersUrl: 'https://www.flipkartcareers.com/#!/joblist' },
{ name: 'Swiggy', careersUrl: 'https://careers.swiggy.com/#/jobs' },
{ name: 'Zomato', careersUrl: 'https://www.zomato.com/careers' },
{ name: 'Razorpay', careersUrl: 'https://razorpay.com/jobs/' },
{ name: 'Meesho', careersUrl: 'https://meesho.io/jobs' },
{ name: 'PhonePe', careersUrl: 'https://www.phonepe.com/careers/' },
{ name: 'CRED', careersUrl: 'https://careers.cred.club/' },

// Consulting / Finance
{ name: 'Goldman Sachs', careersUrl: 'https://www.goldmansachs.com/careers/students/programs/' },
{ name: 'JPMorgan', careersUrl: 'https://careers.jpmorgan.com/in/en/students/programs' },
{ name: 'Morgan Stanley', careersUrl: 'https://www.morganstanley.com/careers/students-graduates' },
{ name: 'EY', careersUrl: 'https://careers.ey.com/ey/search/?search=intern' },
{ name: 'Deloitte', careersUrl: 'https://apply.deloitte.com/careers/SearchJobs?3_5_3=intern' },

// Semiconductor / Core
{ name: 'Texas Instruments', careersUrl: 'https://careers.ti.com/search/?q=intern' },
{ name: 'Qualcomm', careersUrl: 'https://careers.qualcomm.com/careers?query=intern' },
{ name: 'Broadcom', careersUrl: 'https://jobs.broadcom.com/' }

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