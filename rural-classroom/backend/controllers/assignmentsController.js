const Assignment = require('../models/Assignment');
const Performance = require('../models/Performance');

// @desc    Create assignment
// @route   POST /api/assignments
exports.createAssignment = async (req, res) => {
  try {
    const { courseId, title, description, dueDate, maxScore } = req.body;

    const assignment = await Assignment.create({
      courseId, title, description,
      dueDate: new Date(dueDate),
      maxScore: maxScore || 100,
      facultyId: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Assignment created', assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get assignments
// @route   GET /api/assignments
exports.getAssignments = async (req, res) => {
  try {
    const { courseId, page = 1, limit = 10 } = req.query;
    const query = {};
    if (courseId) query.courseId = courseId;

    const total = await Assignment.countDocuments(query);
    const assignments = await Assignment.find(query)
      .populate('courseId', 'title subject')
      .populate('facultyId', 'name')
      .sort({ dueDate: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, count: assignments.length, total, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Submit assignment (student)
// @route   POST /api/assignments/:id/submit
exports.submitAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const alreadySubmitted = assignment.submissions.find(
      (s) => s.studentId.toString() === req.user._id.toString()
    );
    if (alreadySubmitted) {
      return res.status(400).json({ success: false, message: 'Already submitted' });
    }

    const submission = {
      studentId: req.user._id,
      text: req.body.text || '',
      fileUrl: req.file ? `/uploads/misc/${req.file.filename}` : '',
    };

    assignment.submissions.push(submission);
    await assignment.save();

    res.json({ success: true, message: 'Assignment submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Grade submission (faculty)
// @route   PUT /api/assignments/:id/grade/:studentId
exports.gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const submission = assignment.submissions.find(
      (s) => s.studentId.toString() === req.params.studentId
    );
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

    submission.grade = grade;
    submission.feedback = feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = req.user._id;
    await assignment.save();

    // Update performance
    await Performance.findOneAndUpdate(
      { studentId: req.params.studentId, courseId: assignment.courseId },
      {
        $push: {
          assignmentScores: {
            assignmentId: assignment._id,
            score: grade,
            maxScore: assignment.maxScore,
          },
        },
        lastUpdated: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Submission graded', submission });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
