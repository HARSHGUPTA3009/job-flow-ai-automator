// services/emailService.js
// ── Email notifications for new job listings ──────────────────────────────────
// Uses nodemailer with Gmail (App Password). Swap transporter config for
// SendGrid / Mailgun in production by setting EMAIL_PROVIDER env var.

const nodemailer = require('nodemailer');
const User = require('../config/User');

// ── Transporter ──────────────────────────────────────────────────────────────
// Gmail App Password setup:
//   1. Enable 2FA on your Google account
//   2. Go to myaccount.google.com > Security > App Passwords
//   3. Generate a password for "Mail" and set it as EMAIL_PASS env var
let transporter;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,  // e.g. yourapp@gmail.com
      pass: process.env.EMAIL_PASS,  // App Password (16 chars, no spaces)
    },
  });

  return transporter;
}

// ── HTML Email Template ───────────────────────────────────────────────────────
function buildEmailHtml(jobs) {
  const jobCards = jobs
    .map(
      (job) => `
    <tr>
      <td style="padding:16px;border-bottom:1px solid #e5e7eb;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <p style="margin:0;font-size:16px;font-weight:700;color:#111827;">
                ${escapeHtml(job.title)}
              </p>
              <p style="margin:4px 0 0;font-size:14px;color:#6b7280;">
                ${escapeHtml(job.company)} &nbsp;•&nbsp; ${escapeHtml(job.location)}
              </p>
            </td>
            <td align="right" valign="middle">
              <a href="${job.url || job.sourceUrl}"
                 style="display:inline-block;padding:8px 16px;background:#4f46e5;
                        color:#fff;text-decoration:none;border-radius:6px;font-size:13px;">
                View Job →
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1);">

          <!-- Header -->
          <tr>
            <td style="background:#4f46e5;padding:28px 32px;">
              <h1 style="margin:0;color:#fff;font-size:22px;">🎯 AutoJobFlow</h1>
              <p style="margin:6px 0 0;color:#c7d2fe;font-size:14px;">
                ${jobs.length} new job${jobs.length !== 1 ? 's' : ''} matching your preferences
              </p>
            </td>
          </tr>

          <!-- Job cards -->
          <tr><td><table width="100%" cellpadding="0" cellspacing="0">${jobCards}</table></td></tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                You're receiving this because you opted in to job alerts on AutoJobFlow.<br>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard"
                   style="color:#4f46e5;">Manage preferences</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Core notify function ──────────────────────────────────────────────────────
/**
 * Send notification emails to all users who:
 *  1. have emailNotifications: true
 *  2. have at least one keyword matching a new job's title
 *
 * @param {Array} newJobs  - Array of Job documents just inserted
 */
async function notifyUsersOfNewJobs(newJobs) {
  if (!newJobs || newJobs.length === 0) {
    console.log('[Email] No new jobs to notify about.');
    return;
  }

  // Fetch users who want email notifications
  const users = await User.find({ emailNotifications: true, email: { $exists: true, $ne: '' } });
  console.log(`[Email] Checking ${users.length} subscribed users for matches`);

  const transport = getTransporter();

  for (const user of users) {
    const keywords = user.jobKeywords || [];

    // Filter new jobs that match THIS user's keywords
    const relevantJobs = newJobs.filter((job) => {
      const titleLower = job.title.toLowerCase();
      return keywords.some((kw) => titleLower.includes(kw.toLowerCase()));
    });

    if (relevantJobs.length === 0) continue;

    const subject =
      relevantJobs.length === 1
        ? `🎯 New Job Alert: ${relevantJobs[0].title} at ${relevantJobs[0].company}`
        : `🎯 ${relevantJobs.length} New Job Alerts – AutoJobFlow`;

    try {
      await transport.sendMail({
        from: `"AutoJobFlow" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject,
        html: buildEmailHtml(relevantJobs),
      });
      console.log(`[Email] ✉ Sent ${relevantJobs.length} job alert(s) to ${user.email}`);
    } catch (err) {
      console.error(`[Email] ✗ Failed to send to ${user.email}: ${err.message}`);
    }
  }
}

module.exports = { notifyUsersOfNewJobs };