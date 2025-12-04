const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema({
  fileId: { type: String, required: true },
  name: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: false }
});

const ProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },

    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    college: { type: String, required: true },
    branch: { type: String, required: true },
    year: { type: String, required: true },

    resumes: {
      type: [ResumeSchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", ProfileSchema);
