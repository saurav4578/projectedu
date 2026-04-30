const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', authorize('admin'), ctrl.getAllUsers);
router.get('/analytics', authorize('admin'), ctrl.getAnalytics);
router.get('/:id', ctrl.getUserById);
router.put('/profile', ctrl.updateProfile);
router.put('/:id/approve', authorize('admin'), ctrl.approveUser);
router.delete('/:id', authorize('admin'), ctrl.deleteUser);

module.exports = router;
