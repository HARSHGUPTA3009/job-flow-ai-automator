// server/cron/keepalive.js
// Prevents Render free tier from spinning down by self-pinging every 10 minutes.
// Also pings an external uptime monitor (UptimeRobot / BetterUptime) endpoint.

const cron = require('node-cron');
const https = require('https');
const http  = require('http');

const SELF_URL     = process.env.VITE_API_URL || process.env.SELF_URL || 'http://localhost:3001';
const HEALTH_PATH  = '/health';
const PING_INTERVAL = '*/10 * * * *'; // every 10 minutes

// ─── Simple HTTP/HTTPS GET helper ────────────────────────────────────────────

function ping(url) {
  return new Promise((resolve, reject) => {
    const lib      = url.startsWith('https') ? https : http;
    const start    = Date.now();

    const req = lib.get(url, { timeout: 8000 }, (res) => {
      res.resume(); // drain response
      const ms = Date.now() - start;
      resolve({ status: res.statusCode, ms });
    });

    req.on('error',   reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ─── Start keepalive cron ─────────────────────────────────────────────────────

function initKeepalive() {
  console.log(`🔄 Keepalive cron started — pinging ${SELF_URL}${HEALTH_PATH} every 10 min`);

  cron.schedule(PING_INTERVAL, async () => {
    const timestamp = new Date().toISOString();
    try {
      const { status, ms } = await ping(`${SELF_URL}${HEALTH_PATH}`);
      console.log(`✅ [${timestamp}] Keepalive ping → ${status} (${ms}ms)`);
    } catch (err) {
      console.warn(`⚠️  [${timestamp}] Keepalive ping failed: ${err.message}`);
    }
  });
}

module.exports = { initKeepalive };