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
    res.redirect('https://jobflow-black.vercel.app/dashboard');
  }
);
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,        // ← Make sure this exists
        email: req.user.email,
        name: req.user.name
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
