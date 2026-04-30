const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const Performance = require('../models/Performance');

// @desc    Admin dashboard analytics
// @route   GET /api/analytics/admin
exports.getAdminAnalytics = async (req, res) => {
  try {
    const [
      totalUsers, totalStudents, totalExpert, totalLocal,
      totalCourses, totalAssignments,
      pendingApprovals, recentUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'expert' }),
      User.countDocuments({ role: 'local' }),
      Course.countDocuments(),
      Assignment.countDocuments(),
      User.countDocuments({ isApproved: false, role: { $in: ['expert', 'local'] } }),
      User.find().select('name role createdAt').sort({ createdAt: -1 }).limit(5),
    ]);

    // Monthly registrations (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRegs = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers, totalStudents, totalExpert, totalLocal,
        totalCourses, totalAssignments, pendingApprovals,
      },
      recentUsers,
      monthlyRegistrations: monthlyRegs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Faculty dashboard analytics
// @route   GET /api/analytics/faculty
exports.getFacultyAnalytics = async (req, res) => {
  try {
    const facultyId = req.user._id;

    const courses = await Course.find({ facultyId }).select('title enrolledStudents');
    const courseIds = courses.map((c) => c._id);

    const totalStudents = courses.reduce((acc, c) => acc + c.enrolledStudents.length, 0);
    const totalAssignments = await Assignment.countDocuments({ facultyId });

    const performances = await Performance.find({ courseId: { $in: courseIds } });
    const avgScore = performances.length
      ? (performances.reduce((acc, p) => acc + (p.score || 0), 0) / performances.length).toFixed(1)
      : 0;

    // Score distribution
    const scoreDistribution = {
      below40: performances.filter((p) => p.score < 40).length,
      between40_70: performances.filter((p) => p.score >= 40 && p.score <= 70).length,
      above70: performances.filter((p) => p.score > 70).length,
    };

    res.json({
      success: true,
      stats: {
        totalCourses: courses.length,
        totalStudents,
        totalAssignments,
        averageScore: avgScore,
        scoreDistribution,
      },
      courses: courses.map((c) => ({ _id: c._id, title: c.title, students: c.enrolledStudents.length })),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Student analytics
// @route   GET /api/analytics/student
exports.getStudentAnalytics = async (req, res) => {
  try {
    const studentId = req.user._id;

    const performances = await Performance.find({ studentId }).populate('courseId', 'title subject');
    const enrolledCount = req.user.enrolledCourses?.length || 0;
    const submittedAssignments = await Assignment.countDocuments({ 'submissions.studentId': studentId });

    const avgScore = performances.length
      ? (performances.reduce((acc, p) => acc + (p.score || 0), 0) / performances.length).toFixed(1)
      : 0;

    const avgAttendance = performances.length
      ? (performances.reduce((acc, p) => acc + (p.attendancePercentage || 0), 0) / performances.length).toFixed(1)
      : 0;

    res.json({
      success: true,
      stats: { enrolledCourses: enrolledCount, submittedAssignments, averageScore: avgScore, averageAttendance: avgAttendance },
      performances,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
