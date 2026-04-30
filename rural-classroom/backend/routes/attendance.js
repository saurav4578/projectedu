const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.post('/',                                    authorize('admin','expert','local'), ctrl.markAttendance);
router.get('/',                                     ctrl.getAttendance);
router.get('/session/:sessionId',                   ctrl.getSessionReport);
router.get('/student/:studentId/summary',           ctrl.getStudentSummary);
router.get('/stats/:studentId/:courseId',           ctrl.getStudentAttendanceStats);

module.exports = router;
