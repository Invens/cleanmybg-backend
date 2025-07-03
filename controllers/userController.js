const { User } = require('../models');

// GET /api/user/me
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'name', 'email', 'credits', 'subscriptionPlan'],
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
};

// GET /api/user/credits
const getUserCredits = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ credits: user.credits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch credits', error: err.message });
  }
};

module.exports = {
  getUserProfile,
  getUserCredits,
};
