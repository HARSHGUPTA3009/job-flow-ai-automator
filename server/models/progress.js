const mongoose = require('mongoose');

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
      type: String,
      required: true,
    },
    questionName: {
      type: String,
      default: '',
    },
    topic: {
      type: String,
      required: true,
    },
    diff: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    lists: {
      type: [String],
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
    lastActivityDate: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

progressSchema.index(
  { userId: true, questionId: true },
  { unique: true }
);

progressSchema.index({ userId: true, solved: true });
progressSchema.index({ userId: true, topic: true, solved: true });

module.exports =
  mongoose.models.Progress ||
  mongoose.model('Progress', progressSchema);