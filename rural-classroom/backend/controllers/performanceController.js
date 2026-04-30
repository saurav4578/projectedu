const Performance = require('../models/Performance');

// @desc    Get or create performance record
// @route   GET /api/performance/:studentId/:courseId
exports.getPerformance = async (req, res) => {
  try {
    let perf = await Performance.findOne({
      studentId: req.params.studentId,
      courseId: req.params.courseId,
    }).populate('courseId', 'title subject');

    if (!perf) {
      perf = await Performance.create({
        studentId: req.params.studentId,
        courseId: req.params.courseId,
      });
    }

    res.json({ success: true, performance: perf });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update performance score (faculty)
// @route   PUT /api/performance/:studentId/:courseId
exports.updatePerformance = async (req, res) => {
  try {
    const { score, remarks } = req.body;

    const perf = await Performance.findOneAndUpdate(
      { studentId: req.params.studentId, courseId: req.params.courseId },
      { score, remarks, lastUpdated: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, performance: perf });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all performances for a course (faculty)
// @route   GET /api/performance/course/:courseId
exports.getCoursePerformances = async (req, res) => {
  try {
    const performances = await Performance.find({ courseId: req.params.courseId })
      .populate('studentId', 'name email avatar');

    res.json({ success: true, count: performances.length, performances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
