const Course = require('../models/Course');
const User = require('../models/User');

exports.createCourse = async (req, res) => {
  try {
    const { title, description, subject, tags } = req.body;
    const course = await Course.create({
      title, description, subject, tags,
      facultyId: req.user._id,
    });
    res.status(201).json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = { isActive: true };
    if (search) query.title = new RegExp(search, 'i');

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('facultyId', 'name email')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    res.json({ success: true, total, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('facultyId', 'name email avatar')
      .populate('enrolledStudents', 'name email');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    await Course.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMaterial = async (req, res) => {
  try {
    const { title, type, url } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : url;
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $push: { materials: { title, type, url: fileUrl } } },
      { new: true }
    );
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.enrollStudent = async (req, res) => {
  try {
    const courseId = req.params.id;
    const studentId = req.user._id;
    await Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: studentId } });
    await User.findByIdAndUpdate(studentId, { $addToSet: { enrolledCourses: courseId } });
    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
