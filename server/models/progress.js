import mongoose from 'mongoose';

// ─── Progress Schema ─────────────────────────────────────────────────────────
// One document per (user, question) pair. Upserted on toggle.

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: '',
    },
    picture: {
      type: String,
      default: '',
    },
    college: {
      type: String,
      default: '',
    },
    questionId: {
      type: String,   // e.g. "arrays-001" or q.id from questions.js
      required: true,
    },
    questionName: {
      type: String,
      default: '',
    },
    topic: {
      type: String,   // e.g. "Arrays"
      required: true,
    },
    diff: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    lists: {
      type: [String], // e.g. ["nc", "lc75"]
      default: [],
    },
    starred: {
      type: Boolean,
      default: false,
    },
    solved: {
      type: Boolean,
      default: false,
    },
    solvedAt: {
      type: Date,
      default: null,
    },
    // streak tracking — updated server-side
    lastActivityDate: {
      type: String, // YYYY-MM-DD
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Compound unique index — one record per user per question
progressSchema.index({ userId: true, questionId: true }, { unique: true });

// For leaderboard aggregation queries
progressSchema.index({ userId: true, solved: true });
progressSchema.index({ userId: true, topic: true, solved: true });

const Progress = mongoose.models.Progress || mongoose.model('Progress', progressSchema);

export default Progress;