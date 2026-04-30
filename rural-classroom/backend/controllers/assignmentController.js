const Assignment = require('../models/Assignment');
const Performance = require('../models/Performance');

exports.createAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.create(req.body);
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = courseId ? { courseId } : {};
    const assignments = await Assignment.find(query).populate('courseId', 'title').sort({ dueDate: 1 });
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { text } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          submissions: { studentId: req.user._id, text, fileUrl, submittedAt: new Date() },
        },
      },
      { new: true }
    );
    res.json({ success: true, message: 'Submitted successfully', assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { studentId, grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    const submission = assignment.submissions.find((s) => s.studentId.toString() === studentId);
    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });

    submission.grade = grade;
    submission.feedback = feedback;
    await assignment.save();

    await Performance.create({
      studentId,
      courseId: assignment.courseId,
      assignmentId: assignment._id,
      score: grade,
      maxScore: assignment.maxScore,
      remarks: feedback,
    });

    res.json({ success: true, message: 'Graded successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
