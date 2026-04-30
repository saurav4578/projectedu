const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/my',                        ctrl.getMyEnrollments);
router.get('/check/:courseId',           ctrl.checkEnrollment);
router.post('/free',                     authorize('student'), ctrl.enrollFree);
router.post('/create-order',             authorize('student'), ctrl.createOrder);
router.post('/verify-payment',           authorize('student'), ctrl.verifyPayment);
router.post('/mark-complete',            authorize('student'), ctrl.markComplete);

module.exports = router;
