const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const users = new Map();

passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.API_URL}/auth/google/callback`,
    scope: [
      "profile",
      "email",
      "https://www.googleapis.com/auth/gmail.send" 
    ],
    accessType: "offline",
    prompt: "consent",    
  },
  async (accessToken, refreshToken, profile, done) => {
    const user = {
      googleId: profile.id,
      name: profile.displayName,
      email: profile.emails?.[0]?.value || "",
      picture: profile.photos?.[0]?.value || "",
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
    users.set(user.googleId, user);
    return done(null, user);
  }
));


passport.serializeUser((user, done) => {
  done(null, user.googleId);
});

passport.deserializeUser((id, done) => {
  const user = users.get(id);
  done(null, user || null);
});

module.exports = passport;
module.exports.users = users;
