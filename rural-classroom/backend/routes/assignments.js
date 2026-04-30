const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);
router.get('/', ctrl.getAssignments);
router.post('/', authorize('expert', 'admin'), ctrl.createAssignment);
router.post('/:id/submit', authorize('student'), upload.single('file'), ctrl.submitAssignment);
router.post('/:id/grade', authorize('expert', 'admin'), ctrl.gradeSubmission);

module.exports = router;
