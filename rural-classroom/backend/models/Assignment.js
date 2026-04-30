const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileUrl: String,
  text: String,
  submittedAt: { type: Date, default: Date.now },
  grade: Number,
  feedback: String,
});

const assignmentSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  description: String,
  dueDate: Date,
  maxScore: { type: Number, default: 100 },
  submissions: [submissionSchema],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Assignment', assignmentSchema);
