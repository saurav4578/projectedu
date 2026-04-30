const Attendance  = require('../models/Attendance');
const LiveSession = require('../models/LiveSession');

// ── Manual attendance mark ───────────────────────────────────────────────────
exports.markAttendance = async (req, res) => {
  try {
    const { courseId, studentId, status, date } = req.body;
    const att = await Attendance.findOneAndUpdate(
      { courseId, studentId, date: date ? new Date(date) : { $gte: startOfDay() } },
      { courseId, studentId, status, date: date || new Date(), markedBy: req.user._id },
      { upsert: true, new: true }
    );
    res.json({ success: true, attendance: att });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Auto mark when student joins live session ────────────────────────────────
// Called by server.js socket handler (not an HTTP route)
exports.autoMarkJoin = async ({ sessionId, studentId, courseId }) => {
  try {
    const now = new Date();
    const session = await LiveSession.findById(sessionId);
    const sessionStart = session?.startedAt || now;
    const lateThresholdMins = 10; // > 10 min after start = "late"

    const diffMins = (now - sessionStart) / 60000;
    const status   = diffMins <= lateThresholdMins ? 'present' : 'late';

    const att = await Attendance.findOneAndUpdate(
      { studentId, sessionId },
      {
        $setOnInsert: {
          courseId,
          studentId,
          sessionId,
          joinedAt: now,
          status,
          date:     now,
          isLive:   true,
        },
      },
      { upsert: true, new: true }
    );
    return att;
  } catch (err) {
    console.error('autoMarkJoin error:', err.message);
  }
};

// ── Auto update when student leaves live session ──────────────────────────────
exports.autoMarkLeave = async ({ sessionId, studentId }) => {
  try {
    const att = await Attendance.findOne({ studentId, sessionId });
    if (!att || !att.joinedAt) return;

    const now          = new Date();
    const durationMins = Math.round((now - att.joinedAt) / 60000);

    // Get session total duration
    const session = await LiveSession.findById(sessionId);
    const sessionDur = session?.endedAt
      ? Math.round((session.endedAt - (session.startedAt || session.createdAt)) / 60000)
      : Math.round((now - (session?.startedAt || att.joinedAt)) / 60000) || 1;

    const pct = Math.min(100, Math.round((durationMins / sessionDur) * 100));

    await Attendance.findOneAndUpdate(
      { studentId, sessionId },
      {
        leftAt:              now,
        durationMins,
        sessionDurationMins: sessionDur,
        attendancePct:       pct,
        // If stayed < 50% of class → mark late, < 10min → absent
        status: durationMins < 10 ? 'absent' : durationMins / sessionDur < 0.5 ? 'late' : att.status,
      }
    );
  } catch (err) {
    console.error('autoMarkLeave error:', err.message);
  }
};

// ── Finalize all attendance when session ends ────────────────────────────────
exports.finalizeSession = async (sessionId) => {
  try {
    const now = new Date();
    // Mark students still "in room" as left now
    await Attendance.updateMany(
      { sessionId, leftAt: null, joinedAt: { $ne: null } },
      [
        {
          $set: {
            leftAt:        now,
            durationMins:  { $round: [{ $divide: [{ $subtract: [now, '$joinedAt'] }, 60000] }, 0] },
          }
        }
      ]
    );
    // Re-calculate pct after updating
    const session = await LiveSession.findById(sessionId);
    const sessionDur = session
      ? Math.max(1, Math.round((now - (session.startedAt || session.createdAt)) / 60000))
      : 1;

    const records = await Attendance.find({ sessionId, durationMins: { $gt: 0 } });
    for (const r of records) {
      const pct = Math.min(100, Math.round((r.durationMins / sessionDur) * 100));
      r.sessionDurationMins = sessionDur;
      r.attendancePct       = pct;
      if (r.durationMins < 10)                     r.status = 'absent';
      else if (r.durationMins / sessionDur < 0.5)  r.status = 'late';
      await r.save();
    }

    console.log(`✅ Finalized attendance for session ${sessionId}`);
  } catch (err) {
    console.error('finalizeSession error:', err.message);
  }
};

// ── GET /api/attendance — list with filters ──────────────────────────────────
exports.getAttendance = async (req, res) => {
  try {
    const { courseId, sessionId, studentId, date } = req.query;
    const query = {};
    if (courseId)  query.courseId  = courseId;
    if (sessionId) query.sessionId = sessionId;
    if (studentId) query.studentId = studentId;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: startOfDay(d), $lt: endOfDay(d) };
    }

    const records = await Attendance.find(query)
      .populate('studentId', 'name email college')
      .populate('courseId',  'title')
      .populate('sessionId', 'title startedAt endedAt')
      .sort({ date: -1 })
      .limit(200);

    res.json({ success: true, attendance: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/attendance/session/:sessionId — full session report ─────────────
exports.getSessionReport = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const records = await Attendance.find({ sessionId })
      .populate('studentId', 'name email college')
      .sort({ status: 1, durationMins: -1 });

    const session = await LiveSession.findById(sessionId)
      .populate('courseId', 'title')
      .populate('facultyId', 'name');

    const stats = {
      total:     records.length,
      present:   records.filter(r => r.status === 'present').length,
      late:      records.filter(r => r.status === 'late').length,
      absent:    records.filter(r => r.status === 'absent').length,
      avgDurationMins: records.length
        ? Math.round(records.reduce((s,r) => s + (r.durationMins||0), 0) / records.length)
        : 0,
      avgAttendancePct: records.length
        ? Math.round(records.reduce((s,r) => s + (r.attendancePct||0), 0) / records.length)
        : 0,
    };

    res.json({ success: true, session, records, stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/attendance/student/:studentId/summary ───────────────────────────
exports.getStudentSummary = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId }  = req.query;
    const query = { studentId };
    if (courseId) query.courseId = courseId;

    const records = await Attendance.find(query)
      .populate('sessionId', 'title startedAt')
      .populate('courseId',  'title')
      .sort({ date: -1 });

    const total   = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late    = records.filter(r => r.status === 'late').length;
    const absent  = records.filter(r => r.status === 'absent').length;
    const totalMins = records.reduce((s,r) => s + (r.durationMins||0), 0);

    res.json({
      success: true,
      summary: { total, present, late, absent, totalMins, attendancePct: total ? Math.round(((present+late)/total)*100) : 0 },
      records,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/attendance/stats/:studentId/:courseId ───────────────────────────
exports.getStudentAttendanceStats = async (req, res) => {
  try {
    const { studentId, courseId } = req.params;
    const records = await Attendance.find({ studentId, courseId });
    const total   = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late    = records.filter(r => r.status === 'late').length;
    res.json({ success: true, total, present, late, absent: total - present - late,
      percentage: total ? Math.round(((present+late)/total)*100) : 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// helpers
function startOfDay(d = new Date()) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function endOfDay(d = new Date())   { const x = new Date(d); x.setHours(23,59,59,999); return x; }
