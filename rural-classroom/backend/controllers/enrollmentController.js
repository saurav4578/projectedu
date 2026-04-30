const Enrollment = require('../models/Enrollment');
const Course     = require('../models/Course');
const User       = require('../models/User');

// ── Check if student is enrolled ────────────────────────────────────────────
exports.checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      courseId,
      status: 'active',
    });
    res.json({ success: true, enrolled: !!enrollment, enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Free enrollment (price = 0) ──────────────────────────────────────────────
exports.enrollFree = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Idempotent — don't error if already enrolled
    const existing = await Enrollment.findOne({ studentId: req.user._id, courseId });
    if (existing) return res.json({ success: true, message: 'Already enrolled', enrollment: existing });

    const enrollment = await Enrollment.create({
      studentId: req.user._id,
      courseId,
      isPaid: false,
      amount: 0,
      status: 'active',
    });

    // Keep Course.enrolledStudents in sync
    await Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: courseId } });

    res.status(201).json({ success: true, message: 'Enrolled successfully!', enrollment });
  } catch (err) {
    if (err.code === 11000) return res.json({ success: true, message: 'Already enrolled' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Create Razorpay order (paid course) ─────────────────────────────────────
// Requires: npm install razorpay  +  RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in .env
exports.createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // If razorpay keys not set, fall back to free enrollment
    if (!process.env.RAZORPAY_KEY_ID) {
      return exports.enrollFree({ ...req, body: { courseId } }, res);
    }

    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const amountPaise = (course.price || 0) * 100;
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${req.user._id}_${courseId}`.slice(0, 40),
      notes: { courseId, studentId: req.user._id.toString() },
    });

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
      courseName: course.title,
      amount: amountPaise,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Verify Razorpay payment & activate enrollment ───────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { courseId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Signature verification
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '');
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = hmac.digest('hex');

    if (digest !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const course = await Course.findById(courseId);
    const enrollment = await Enrollment.create({
      studentId:  req.user._id,
      courseId,
      isPaid:     true,
      amount:     course?.price || 0,
      paymentId:  razorpay_payment_id,
      orderId:    razorpay_order_id,
      status:     'active',
    });

    await Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: req.user._id } });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: courseId } });

    res.json({ success: true, message: 'Payment verified! Enrolled.', enrollment });
  } catch (err) {
    if (err.code === 11000) return res.json({ success: true, message: 'Already enrolled' });
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Get student's enrolled courses ─────────────────────────────────────────
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user._id, status: 'active' })
      .populate({
        path: 'courseId',
        populate: { path: 'facultyId', select: 'name avatar' },
      });
    res.json({ success: true, enrollments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Mark a material as completed (progress tracking) ───────────────────────
exports.markComplete = async (req, res) => {
  try {
    const { courseId, materialId } = req.body;
    const enrollment = await Enrollment.findOneAndUpdate(
      { studentId: req.user._id, courseId },
      { $addToSet: { completedMaterials: materialId }, lastAccessedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
