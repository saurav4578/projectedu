const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
  title: String,
  type: { type: String, enum: ['pdf', 'video', 'link', 'doc'] },
  url: String,
  uploadedAt: { type: Date, default: Date.now },
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: String, default: '' },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  localFacultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  materials: [materialSchema],
  thumbnail: { type: String, default: '' },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
  price: { type: Number, default: 0 },  // 0 = free
  tags: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Course', courseSchema);
