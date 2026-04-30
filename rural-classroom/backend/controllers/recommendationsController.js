const Performance = require('../models/Performance');
const Course = require('../models/Course');
const Attendance = require('../models/Attendance');
const User = require('../models/User');

// ============================================================
// AI RECOMMENDATION ENGINE (Rule-Based, ML-Ready Structure)
// ============================================================

/**
 * Rule-Based Recommendation Logic:
 * - score < 40       → Recommend beginner/foundational materials
 * - attendance < 60% → Recommend revision sessions
 * - score 40–70      → Recommend practice assignments
 * - score > 70       → Recommend advanced materials
 */

const generateRecommendations = (performanceData) => {
  const recommendations = [];

  for (const perf of performanceData) {
    const { score, attendancePercentage, courseId } = perf;
    const courseName = courseId?.title || 'Unknown Course';
    const subject = courseId?.subject || 'General';

    const rec = {
      courseId: perf.courseId?._id,
      courseName,
      subject,
      score,
      attendancePercentage,
      suggestions: [],
      priority: 'low',
    };

    // Low attendance
    if (attendancePercentage < 60) {
      rec.suggestions.push({
        type: 'revision_session',
        title: `Attend More ${courseName} Classes`,
        description: `Your attendance is ${attendancePercentage.toFixed(1)}%. Aim for 75%+ to avoid eligibility issues.`,
        resources: [
          { title: 'Review recorded lectures', type: 'video' },
          { title: 'Self-study guide for missed topics', type: 'pdf' },
        ],
        action: 'Watch recorded sessions and attend upcoming live classes',
      });
      rec.priority = 'high';
    }

    // Very low score - needs foundational help
    if (score < 40) {
      rec.suggestions.push({
        type: 'beginner_materials',
        title: `Master Basics in ${subject}`,
        description: `Your score is ${score}/100. Start with foundational concepts.`,
        resources: [
          { title: `${subject} Fundamentals`, type: 'pdf' },
          { title: 'Beginner Practice Problems', type: 'assignment' },
          { title: 'Introduction Video Series', type: 'video' },
        ],
        action: 'Complete the beginner module before attempting advanced topics',
      });
      rec.priority = 'critical';
    }

    // Moderate score - needs practice
    else if (score >= 40 && score <= 70) {
      rec.suggestions.push({
        type: 'practice_assignments',
        title: `Practice More ${subject} Problems`,
        description: `Your score is ${score}/100. More practice will push you to the next level.`,
        resources: [
          { title: `${subject} Practice Set`, type: 'assignment' },
          { title: 'Mock Tests & Quizzes', type: 'quiz' },
          { title: 'Peer Study Group', type: 'collaboration' },
        ],
        action: 'Complete at least 2 practice assignments per week',
      });
      if (rec.priority !== 'high') rec.priority = 'medium';
    }

    // High score - can advance
    else if (score > 70) {
      rec.suggestions.push({
        type: 'advanced_materials',
        title: `Explore Advanced ${subject} Topics`,
        description: `Excellent! Your score is ${score}/100. Ready for advanced challenges.`,
        resources: [
          { title: `Advanced ${subject} Module`, type: 'pdf' },
          { title: 'Research Papers & Case Studies', type: 'doc' },
          { title: 'Competitive Problem Sets', type: 'assignment' },
        ],
        action: 'Enroll in advanced track or help peer students',
      });
    }

    if (rec.suggestions.length > 0) {
      recommendations.push(rec);
    }
  }

  // Sort by priority: critical > high > medium > low
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
};

// @desc    Get AI recommendations for a student
// @route   GET /api/recommendations/:studentId
exports.getRecommendations = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Security: student can only see own recommendations
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const student = await User.findById(studentId).select('name email');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Get performance across all courses
    const performances = await Performance.find({ studentId })
      .populate('courseId', 'title subject level');

    if (performances.length === 0) {
      return res.json({
        success: true,
        student: student.name,
        message: 'No performance data yet. Enroll in courses to get personalized recommendations.',
        recommendations: [],
        summary: { totalCourses: 0, averageScore: 0, averageAttendance: 0 },
      });
    }

    const recommendations = generateRecommendations(performances);

    // Summary statistics
    const avgScore = performances.reduce((acc, p) => acc + (p.score || 0), 0) / performances.length;
    const avgAttendance = performances.reduce((acc, p) => acc + (p.attendancePercentage || 0), 0) / performances.length;

    // Overall learning health status
    let healthStatus = 'excellent';
    if (avgScore < 40 || avgAttendance < 60) healthStatus = 'needs_attention';
    else if (avgScore < 70 || avgAttendance < 75) healthStatus = 'good';

    res.json({
      success: true,
      student: student.name,
      summary: {
        totalCourses: performances.length,
        averageScore: avgScore.toFixed(1),
        averageAttendance: avgAttendance.toFixed(1),
        healthStatus,
        criticalCount: recommendations.filter((r) => r.priority === 'critical').length,
        highPriorityCount: recommendations.filter((r) => r.priority === 'high').length,
      },
      recommendations,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get performance data
// @route   GET /api/recommendations/performance/:studentId
exports.getPerformanceData = async (req, res) => {
  try {
    const performances = await Performance.find({ studentId: req.params.studentId })
      .populate('courseId', 'title subject')
      .populate('assignmentScores.assignmentId', 'title');

    res.json({ success: true, performances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
