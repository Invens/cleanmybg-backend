const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  syncGoogleUser,
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.post('/sync-user', syncGoogleUser); // Used by frontend after Google login

module.exports = router;
