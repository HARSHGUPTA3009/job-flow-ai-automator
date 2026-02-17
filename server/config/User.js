const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  // ── Existing fields (unchanged) ───────────────────────────────────────────
  googleId:     { type: String, unique: true },
  name:         String,
  email:        String,
  picture:      String,
  accessToken:  String,
  refreshToken: String,

  // ── NEW: Job Monitoring Preferences ──────────────────────────────────────
  jobKeywords: {
    type: [String],
    default: ["intern", "internship", "software engineer", "summer", "backend", "sde"],
  },
  emailNotifications: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("User", UserSchema);