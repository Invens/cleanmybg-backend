const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { removeBackground } = require('../controllers/imageController');
const auth = require('../middleware/authMiddleware');

const upload = multer({ dest: path.join(__dirname, '../temp') });

router.post('/remove',auth, upload.single('image'), removeBackground);

module.exports = router;
