const crypto = require('crypto');
const razorpay = require('../utils/razorpay');
const { Transaction, User } = require('../models');

const PLAN_DETAILS = {
  premium: { price: 149, credits: 100, durationDays: 30 },
  business: { price: 399, credits: 500, durationDays: 30 },
};

const createOrder = async (req, res) => {
  try {
    const { amount, credits, planType } = req.body;
    const userId = req.userId;

    console.log('createOrder received:', { amount, credits, planType, userId });

    // Validate planType
    if (planType && !['premium', 'business', 'payg'].includes(planType)) {
      console.error('Invalid planType:', planType);
      return res.status(400).json({ message: 'Invalid planType' });
    }

    // Validate amount and credits for PAYG
    if (planType === 'payg') {
      if (!Number.isInteger(credits) || credits < 1) {
        console.error('Invalid credits for PAYG:', credits);
        return res.status(400).json({ message: 'Credits must be a positive integer' });
      }
      if (amount !== credits * 10) {
        console.error('Invalid amount for PAYG:', { amount, expected: credits * 10 });
        return res.status(400).json({ message: 'Invalid amount for credits (₹10 per credit)' });
      }
    }

    // Validate amount for subscription plans
    if (planType && PLAN_DETAILS[planType] && amount !== PLAN_DETAILS[planType].price) {
      console.error('Invalid amount for plan:', { planType, amount, expected: PLAN_DETAILS[planType].price });
      return res.status(400).json({ message: `Invalid amount for ${planType} plan` });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100, // Convert rupees to paise
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: { planType, credits, userId: userId.toString() }, // Ensure userId is string
    });

    // Prepare transaction data
    const transactionData = {
      userId,
      amount, // Store amount in rupees
      creditsAdded: credits || 0,
      subscriptionPlan: planType || null, // Use JavaScript field name
      razorpay_order_id: order.id,
      payment_status: 'pending',
    };
    console.log('Creating transaction with:', transactionData);

    // Save to DB with query logging
    const transaction = await Transaction.create(transactionData, {
      logging: (sql) => console.log('SQL Query:', sql), // Log raw SQL
    });

    // Log created transaction
    console.log('Transaction created:', {
      id: transaction.id,
      subscriptionPlan: transaction.subscriptionPlan,
      creditsAdded: transaction.creditsAdded,
      razorpay_order_id: transaction.razorpay_order_id,
    });

    // Warn if subscriptionPlan doesn't match
    if (transaction.subscriptionPlan !== planType) {
      console.warn('Transaction subscriptionPlan mismatch:', {
        expected: planType,
        saved: transaction.subscriptionPlan,
      });
    }

    console.log('Order created:', { orderId: order.id, amount: order.amount, currency: order.currency, transactionId: transaction.id });

    res.json({
      orderId: order.id,
      amount: order.amount, // Amount in paise for Razorpay
      currency: order.currency,
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
};

const verifyWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const payment = req.body.payload.payment.entity;
    const orderId = payment.order_id;
    const paymentId = payment.id;

    const transaction = await Transaction.findOne({ where: { razorpay_order_id: orderId } });
    if (!transaction) {
      console.error('Transaction not found for orderId:', orderId);
      return res.status(404).json({ message: 'Transaction not found' });
    }

    console.log('Transaction found:', {
      id: transaction.id,
      subscriptionPlan: transaction.subscriptionPlan,
      creditsAdded: transaction.creditsAdded,
      razorpay_order_id: transaction.razorpay_order_id,
    });

    // Prevent double processing
    if (transaction.payment_status === 'success') {
      console.log('Transaction already processed:', orderId);
      return res.status(200).json({ message: 'Transaction already processed' });
    }

    transaction.payment_status = 'success';
    transaction.razorpay_payment_id = paymentId;

    let planType = transaction.subscriptionPlan;

    // Fallback to notes.planType if subscriptionPlan is undefined
    if (!planType && payment.notes && payment.notes.planType) {
      console.warn('Falling back to notes.planType:', payment.notes.planType);
      planType = payment.notes.planType;
      // Update transaction to fix subscriptionPlan
      transaction.subscriptionPlan = planType;
    }

    await transaction.save();
    console.log('Transaction updated:', {
      id: transaction.id,
      subscriptionPlan: transaction.subscriptionPlan,
      payment_status: transaction.payment_status,
    });

    console.log('Processing webhook for:', { planType, creditsAdded: transaction.creditsAdded });

    const user = await User.findByPk(transaction.userId);
    if (planType && PLAN_DETAILS[planType]) {
      const { credits, durationDays } = PLAN_DETAILS[planType];

      // Calculate expiry date
      const currentExpiry = user.planExpiresAt && new Date(user.planExpiresAt) > new Date()
        ? new Date(user.planExpiresAt)
        : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);

      user.credits += credits;
      user.subscriptionPlan = planType;
      user.planExpiresAt = newExpiry;
    } else {
      // Handle PAYG
      user.credits += transaction.creditsAdded;
      user.subscriptionPlan = planType || 'payg';
      user.planExpiresAt = null;
    }

    await user.save();

    console.log('✅ User updated:', {
      id: user.id,
      plan: user.subscriptionPlan,
      credits: user.credits,
      expiresAt: user.planExpiresAt,
    });

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (err) {
    console.error('Webhook failed:', err);
    res.status(500).json({ message: 'Webhook failed', error: err.message });
  }
};

const getTransactions = async (req, res) => {
  try {
    const userId = req.userId;
    const txns = await Transaction.findAll({
      where: { userId, payment_status: 'success' },
      order: [['createdAt', 'DESC']],
    });
    res.json(txns);
  } catch (err) {
    console.error('Failed to fetch transactions:', err);
    res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
  }
};

module.exports = {
  createOrder,
  verifyWebhook,
  getTransactions,
};