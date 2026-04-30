const Performance = require('../models/Performance');
const Attendance = require('../models/Attendance');
const Course = require('../models/Course');

/**
 * AI Recommendation Engine (Rule-Based, ML-Ready Structure)
 * Rules:
 * - score < 40        → Beginner materials, remedial content
 * - score 40-70       → Practice assignments, intermediate content
 * - score > 70        → Advanced materials, challenge content
 * - attendance < 60%  → Revision sessions, recorded lectures
 */

const generateRecommendations = (scorePercentage, attendancePercentage, courseName) => {
  const recommendations = [];

  if (attendancePercentage < 60) {
    recommendations.push({
      type: 'attendance',
      priority: 'high',
      message: `Your attendance in ${courseName} is ${attendancePercentage}%. Watch recorded lectures to catch up.`,
      action: 'Watch Recorded Lectures',
      icon: '📹',
    });
  }

  if (scorePercentage < 40) {
    recommendations.push({
      type: 'beginner',
      priority: 'high',
      message: `Score is ${scorePercentage}% in ${courseName}. Start with beginner materials and fundamentals.`,
      action: 'Start Beginner Path',
      icon: '📚',
    });
    recommendations.push({
      type: 'remedial',
      priority: 'medium',
      message: `Consider joining revision sessions for ${courseName} to strengthen your basics.`,
      action: 'Join Revision Session',
      icon: '🔄',
    });
  } else if (scorePercentage >= 40 && scorePercentage <= 70) {
    recommendations.push({
      type: 'practice',
      priority: 'medium',
      message: `Good progress in ${courseName}! Practice assignments will help you reach the next level.`,
      action: 'View Practice Assignments',
      icon: '✏️',
    });
    recommendations.push({
      type: 'intermediate',
      priority: 'low',
      message: `Explore intermediate resources for ${courseName} to boost your score above 70%.`,
      action: 'Browse Intermediate Content',
      icon: '📈',
    });
  } else if (scorePercentage > 70) {
    recommendations.push({
      type: 'advanced',
      priority: 'low',
      message: `Excellent work in ${courseName}! Challenge yourself with advanced materials.`,
      action: 'Explore Advanced Content',
      icon: '🚀',
    });
    recommendations.push({
      type: 'challenge',
      priority: 'low',
      message: `You're excelling in ${courseName}. Try competitive assignments or peer teaching.`,
      action: 'View Challenge Problems',
      icon: '🏆',
    });
  }

  return recommendations;
};

exports.getRecommendations = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get all performances grouped by course
    const performances = await Performance.find({ studentId }).populate('courseId', 'title');
    
    // Get attendance data
    const attendanceData = await Attendance.find({ studentId });

    if (performances.length === 0) {
      return res.json({
        success: true,
        recommendations: [{
          type: 'onboarding',
          priority: 'high',
          message: 'Welcome! Enroll in courses and submit assignments to get personalized recommendations.',
          action: 'Browse Courses',
          icon: '🎓',
        }],
        summary: { avgScore: 0, avgAttendance: 0, totalCourses: 0 },
      });
    }

    // Group by course
    const courseMap = {};
    performances.forEach((p) => {
      const cid = p.courseId?._id?.toString();
      if (!cid) return;
      if (!courseMap[cid]) {
        courseMap[cid] = {
          courseName: p.courseId?.title || 'Unknown',
          scores: [],
          courseId: cid,
        };
      }
      courseMap[cid].scores.push((p.score / p.maxScore) * 100);
    });

    // Build attendance map
    const attMap = {};
    attendanceData.forEach((a) => {
      const cid = a.courseId?.toString();
      if (!attMap[cid]) attMap[cid] = { total: 0, present: 0 };
      attMap[cid].total++;
      if (a.status === 'present') attMap[cid].present++;
    });

    const allRecommendations = [];
    let totalScore = 0;
    let totalAttendance = 0;
    let count = 0;

    Object.values(courseMap).forEach(({ courseName, scores, courseId }) => {
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const att = attMap[courseId] || { total: 10, present: 10 };
      const attPct = att.total > 0 ? Math.round((att.present / att.total) * 100) : 100;

      totalScore += avgScore;
      totalAttendance += attPct;
      count++;

      const recs = generateRecommendations(Math.round(avgScore), attPct, courseName);
      allRecommendations.push(...recs);
    });

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    allRecommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    res.json({
      success: true,
      recommendations: allRecommendations.slice(0, 10),
      summary: {
        avgScore: count > 0 ? Math.round(totalScore / count) : 0,
        avgAttendance: count > 0 ? Math.round(totalAttendance / count) : 0,
        totalCourses: count,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
