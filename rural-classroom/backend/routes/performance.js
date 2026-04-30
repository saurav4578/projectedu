const express = require('express');
const router = express.Router();
const { getPerformance, updatePerformance, getCoursePerformances } = require('../controllers/performanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/course/:courseId', authorize('expert', 'local', 'admin'), getCoursePerformances);
router.get('/:studentId/:courseId', getPerformance);
router.put('/:studentId/:courseId', authorize('expert', 'admin'), updatePerformance);

module.exports = router;
