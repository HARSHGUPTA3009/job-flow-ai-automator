const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const users = new Map(); // 🧠 TEMP in-memory user store

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.API_URL}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  const user = {
    googleId: profile.id,
    name: profile.displayName,
    email: profile.emails[0].value,
    picture: profile.photos[0].value
  };

  users.set(user.googleId, user); // ✅ store temporarily
  return done(null, user);
}));

// ✅ only store user ID in session
passport.serializeUser((user, done) => {
  done(null, user.googleId);
});

// ✅ retrieve full user from memory
passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user || null);
});

module.exports = passport;
