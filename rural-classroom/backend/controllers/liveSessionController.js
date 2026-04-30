const LiveSession = require('../models/LiveSession');

exports.createSession = async (req, res) => {
  try {
    const { courseId, title, scheduledAt } = req.body;
    const session = await LiveSession.create({ courseId, title, scheduledAt, facultyId: req.user._id });
    res.status(201).json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const { courseId, status } = req.query;
    const query = {};
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;
    const sessions = await LiveSession.find(query)
      .populate('courseId', 'title')
      .populate('facultyId', 'name')
      .sort({ scheduledAt: -1 });
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.startSession = async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndUpdate(
      req.params.id,
      { status: 'live', startedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndUpdate(
      req.params.id,
      { status: 'ended', endedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
