const express = require('express');
const router = express.Router();
const { getAdminAnalytics, getFacultyAnalytics, getStudentAnalytics } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/admin', authorize('admin'), getAdminAnalytics);
router.get('/faculty', authorize('expert', 'local'), getFacultyAnalytics);
router.get('/student', authorize('student'), getStudentAnalytics);

module.exports = router;
