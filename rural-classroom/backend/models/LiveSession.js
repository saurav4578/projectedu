const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: String,
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
  recordingUrl: String,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('LiveSession', liveSessionSchema);
