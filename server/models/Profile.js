const mongoose = require("mongoose");

// URL validator - more lenient
const urlRegex = /^https?:\/\/.+/i;

// Phone validator (simple international E.164)
const phoneRegex = /^\+?[0-9]{8,15}$/;

// Name validator (simple)
const nameRegex = /^[a-zA-Z\s'.-]+$/;

// College/branch validator (allow words + spaces)
const textRegex = /^[a-zA-Z0-9\s&().,'-]+$/;

// Resume Schema
const ResumeSchema = new mongoose.Schema({
  fileId: { type: String, required: true },
  name: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: false },
});

// Main Profile Schema
const ProfileSchema = new mongoose.Schema(
  {
    // USER IDENTIFIER
    userId: {
      type: String,
      required: [true, "User ID is required"],
      unique: true,
      trim: true,
    },

    // BASIC INFO
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      validate: {
        validator: (v) => nameRegex.test(v),
        message: "Invalid name format",
      },
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => /^\S+@\S+\.\S+$/.test(v),
        message: "Invalid email format",
      },
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: (v) => phoneRegex.test(v),
        message: "Invalid phone number format. Use +123456789 or 10–15 digits.",
      },
    },

    college: {
      type: String,
      required: [true, "College is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
      validate: {
        validator: (v) => textRegex.test(v),
        message: "College contains invalid characters",
      },
    },

    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
      validate: {
        validator: (v) => textRegex.test(v),
        message: "Branch contains invalid characters",
      },
    },

    // NUMERIC FIELDS
    year: {
      type: Number,
      required: [true, "Year is required"],
      min: [1, "Year must be at least 1"],
      max: [5, "Year must be at most 5"],
    },

    cgpa: {
      type: Number,
      required: [true, "CGPA is required"],
      min: [0, "CGPA cannot be below 0"],
      max: [10, "CGPA cannot be above 10"],
    },

    // OPTIONAL URL FIELDS - More lenient validation
    linkedIn: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function(v) {
          // Allow empty strings
          if (!v || v === "") return true;
          // Must start with http:// or https://
          return urlRegex.test(v);
        },
        message: "Invalid LinkedIn URL. Must start with http:// or https://",
      },
    },

    github: {
      type: String,
      default: "",
      trim: true,
      validate: {
        validator: function(v) {
          // Allow empty strings
          if (!v || v === "") return true;
          // Must start with http:// or https://
          return urlRegex.test(v);
        },
        message: "Invalid GitHub URL. Must start with http:// or https://",
      },
    },

    // ARRAYS
    skills: {
      type: [String],
      default: [],
    },

    preferredRoles: {
      type: [String],
      default: [],
    },

    preferredLocations: {
      type: [String],
      default: [],
    },

    // RESUMES
    resumes: {
      type: [ResumeSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", ProfileSchema);