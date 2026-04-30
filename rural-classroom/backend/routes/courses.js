const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(protect);
router.get('/', ctrl.getCourses);
router.post('/', authorize('expert', 'admin'), ctrl.createCourse);
router.get('/:id', ctrl.getCourseById);
router.put('/:id', authorize('expert', 'admin'), ctrl.updateCourse);
router.delete('/:id', authorize('expert', 'admin'), ctrl.deleteCourse);
router.post('/:id/materials', authorize('expert', 'admin'), upload.single('file'), ctrl.addMaterial);
router.post('/:id/enroll', authorize('student'), ctrl.enrollStudent);

module.exports = router;
