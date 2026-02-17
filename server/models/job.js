// models/Job.js
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
      default: 'Not specified',
    },
    url: {
      type: String,
      trim: true,
      default: '',
    },
    postedDate: {
      type: Date,
      default: null,
    },
    sourceUrl: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// ── Duplicate detection ──────────────────────────────────────────────────────
// Same title + same company = duplicate. Case-insensitive via collation on query,
// but we store normalised lowercase copies for the unique index.
jobSchema.index(
  { company: 1, title: 1 },
  {
    unique: true,
    // Collation makes the unique index case-insensitive in MongoDB 3.4+
    collation: { locale: 'en', strength: 2 },
  }
);

// Fast lookup: jobs by creation date (newest first)
jobSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);