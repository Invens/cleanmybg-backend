const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyWebhook,
  getTransactions,
} = require('../controllers/paymentController');
const auth = require('../middleware/authMiddleware');

router.post('/order', auth, createOrder);
router.post('/webhook', verifyWebhook); // Do NOT use auth middleware
router.get('/history', auth, getTransactions);

module.exports = router;
