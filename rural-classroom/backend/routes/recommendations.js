const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

router.get('/:studentId', protect, getRecommendations);

module.exports = router;
