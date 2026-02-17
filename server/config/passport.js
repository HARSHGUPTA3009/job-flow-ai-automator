const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("./User.js");  // <-- DB model

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Create new user
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value || "",
            picture: profile.photos?.[0]?.value || "",
            accessToken,
            refreshToken,
          });
        } else {
          // Update tokens if needed
          user.accessToken = accessToken;
          user.refreshToken = refreshToken;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);  // store MongoDB ID in session
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean(); // fetch user from DB
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
