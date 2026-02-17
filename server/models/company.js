// models/Company.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    careersUrl: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional per-company keyword overrides; falls back to global filter
    keywords: {
      type: [String],
      default: ['intern', 'internship', 'software engineer', 'summer', 'backend', 'sde'],
    },
    lastChecked: {
      type: Date,
      default: null,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate companies by URL
companySchema.index({ careersUrl: 1 }, { unique: true });

module.exports = mongoose.model('Company', companySchema);