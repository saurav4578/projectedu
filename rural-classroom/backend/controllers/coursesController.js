const Course = require('../models/Course');
const User = require('../models/User');
const path = require('path');

// @desc    Create course
// @route   POST /api/courses
exports.createCourse = async (req, res) => {
  try {
    const { title, description, subject, level, college, tags, schedule } = req.body;
    let thumbnail = '';
    if (req.file) thumbnail = `/uploads/images/${req.file.filename}`;

    const course = await Course.create({
      title, description, subject, level, college, tags: tags ? JSON.parse(tags) : [],
      schedule: schedule ? JSON.parse(schedule) : {},
      thumbnail,
      facultyId: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Course created', course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all courses
// @route   GET /api/courses
exports.getCourses = async (req, res) => {
  try {
    const { subject, level, page = 1, limit = 12, search, facultyId } = req.query;
    const query = { isActive: true };

    if (subject) query.subject = { $regex: subject, $options: 'i' };
    if (level) query.level = level;
    if (facultyId) query.facultyId = facultyId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Students see only enrolled or all; filter for student
    if (req.user?.role === 'student' && req.query.enrolled === 'true') {
      query._id = { $in: req.user.enrolledCourses };
    }

    const total = await Course.countDocuments(query);
    const courses = await Course.find(query)
      .populate('facultyId', 'name email avatar')
      .populate('localFacultyId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, count: courses.length, total, pages: Math.ceil(total / limit), courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('facultyId', 'name email avatar bio')
      .populate('enrolledStudents', 'name email avatar');

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (course.facultyId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, course: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Upload material to course
// @route   POST /api/courses/:id/materials
exports.uploadMaterial = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const { title } = req.body;
    let type = 'doc';
    if (req.file.mimetype === 'application/pdf') type = 'pdf';
    else if (req.file.mimetype.startsWith('image/')) type = 'image';
    else if (req.file.mimetype.startsWith('video/')) type = 'video';

    const material = {
      title: title || req.file.originalname,
      type,
      url: `/uploads/${type === 'pdf' ? 'pdfs' : type === 'image' ? 'images' : type === 'video' ? 'videos' : 'misc'}/${req.file.filename}`,
      size: req.file.size,
    };

    course.materials.push(material);
    await course.save();

    res.json({ success: true, message: 'Material uploaded', material });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Enroll in course
// @route   POST /api/courses/:id/enroll
exports.enrollCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const alreadyEnrolled = course.enrolledStudents.includes(req.user._id);
    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'Already enrolled' });
    }

    course.enrolledStudents.push(req.user._id);
    await course.save();

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: course._id } });

    res.json({ success: true, message: 'Enrolled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Start live session
// @route   POST /api/courses/:id/live
exports.startLiveSession = async (req, res) => {
  try {
    const sessionId = `session-${req.params.id}-${Date.now()}`;
    await Course.findByIdAndUpdate(req.params.id, { liveSessionId: sessionId });

    const io = req.app.get('io');
    io.emit('live-session-started', { courseId: req.params.id, sessionId });

    res.json({ success: true, sessionId, message: 'Live session started' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
