const express = require('express');
const passport = require('../config/passport');
const router = express.Router();

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/signin' }),
  (req, res) => {
    console.log("✅ Google login success");
    console.log("User:", req.user);
    console.log("Session:", req.session);

    // ✅ Redirect to frontend dashboard
    res.redirect(`${process.env.CLIENT_URL}/dashboard`);
  }
);

router.get('/status', (req, res) => {
  console.log("🔍 /auth/status checked");
  console.log("User:", req.user);
  res.json({
    authenticated: req.isAuthenticated(),
    user: req.user || null
  });
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
