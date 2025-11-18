const express = require("express");
const passport = require("../config/passport");
const router = express.Router();

// -------------------------------------
// GOOGLE LOGIN
// -------------------------------------
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// -------------------------------------
// GOOGLE CALLBACK
// -------------------------------------
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "https://jobflow-black.vercel.app/signin",
    session: true,
  }),
  (req, res) => {
    console.log("✅ Google login success");
    console.log("User:", req.user);
    console.log("Session:", req.session);

    res.redirect("https://jobflow-black.vercel.app/dashboard");
  }
);

// -------------------------------------
// CHECK LOGIN STATUS
// -------------------------------------
router.get("/status", (req, res) => {
  if (req.isAuthenticated()) {
    return res.json({
      authenticated: true,
      user: {
        id: req.user._id,         // FIX
        email: req.user.email,
        name: req.user.name,
        googleId: req.user.googleId
      }
    });
  }

  res.json({ authenticated: false });
});

// -------------------------------------
// LOGOUT
// -------------------------------------
router.post("/logout", (req, res) => {
  req.logout(err => {
    if (err) return res.status(500).json({ error: "Logout failed" });

    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

module.exports = router;
