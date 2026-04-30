const mongoose = require('mongoose');

// Tracks course enrollment with optional payment info
const enrollmentSchema = new mongoose.Schema({
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  status:     { type: String, enum: ['active', 'expired', 'pending'], default: 'active' },
  // Payment fields (Razorpay or free)
  isPaid:     { type: Boolean, default: false },
  amount:     { type: Number, default: 0 },        // in paise (₹1 = 100 paise)
  currency:   { type: String, default: 'INR' },
  paymentId:  { type: String, default: '' },        // Razorpay payment_id
  orderId:    { type: String, default: '' },         // Razorpay order_id
  // Progress tracking
  completedMaterials: [{ type: String }],           // material _id strings
  lastAccessedAt: { type: Date },
  enrolledAt:     { type: Date, default: Date.now },
});

enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
