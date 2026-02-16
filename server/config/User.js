const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  googleId: { type: String, unique: true },
  name: String,
  email: String,
  picture: String,
  accessToken: String,
  refreshToken: String,
});

module.exports = mongoose.model("User", UserSchema);
