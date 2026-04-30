const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/liveSessionController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', ctrl.getSessions);
router.post('/', authorize('expert', 'admin'), ctrl.createSession);
router.put('/:id/start', authorize('expert', 'admin'), ctrl.startSession);
router.put('/:id/end', authorize('expert', 'admin'), ctrl.endSession);

module.exports = router;
