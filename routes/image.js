const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { removeBackground } = require('../controllers/imageController');
const optionalAuth= require('../middleware/optionalAuth');
const rateLimit = require('../middleware/rateLimit');

const upload = multer({ dest: path.join(__dirname, '../temp') });

router.post('/remove',optionalAuth, rateLimit,  upload.single('image'), removeBackground);

module.exports = router;
