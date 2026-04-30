const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' },
  score: { type: Number, required: true },
  maxScore: { type: Number, default: 100 },
  remarks: String,
  type: { type: String, enum: ['assignment', 'quiz', 'exam'], default: 'assignment' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Performance', performanceSchema);
