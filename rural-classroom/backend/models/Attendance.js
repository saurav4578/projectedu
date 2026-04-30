const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  courseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course',      required: true },
  sessionId:  { type: mongoose.Schema.Types.ObjectId, ref: 'LiveSession', default: null  },
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',        required: true },
  status:     { type: String, enum: ['present','absent','late'], default: 'absent' },
  date:       { type: Date, default: Date.now },
  markedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ── Live session duration tracking ──────────────────────────────────────
  joinedAt:      { type: Date, default: null },   // when student joined live
  leftAt:        { type: Date, default: null },   // when student left / session ended
  durationMins:  { type: Number, default: 0 },    // total minutes in session
  sessionDurationMins: { type: Number, default: 0 }, // total session length
  attendancePct: { type: Number, default: 0 },    // durationMins / sessionDurationMins * 100
  isLive:        { type: Boolean, default: false },// true = auto-marked via socket
}, { timestamps: true });

// Unique per student per session
attendanceSchema.index({ studentId: 1, sessionId: 1 }, { unique: true, sparse: true });
// Unique per student per course per date (for manual attendance)
attendanceSchema.index({ studentId: 1, courseId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
