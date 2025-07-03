const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { getUserProfile, getUserCredits } = require('../controllers/userController');

router.get('/me', auth, getUserProfile);
router.get('/credits', auth, getUserCredits);

module.exports = router;
