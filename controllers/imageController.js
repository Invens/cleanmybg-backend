const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const { User } = require('../models');

const PYTHON_SERVICE_URL = 'https://remove.cleanmybg.com/remove-bg/';

const removeBackground = async (req, res) => {
  const tempPath = req.file?.path;
  try {
    let userId = req.userId;
    let resolution = 'low';
    let deductCredit = false;
    let creditsRemaining = 0;
    let user = null;

    // Fetch user if authenticated
    if (userId) {
      user = await User.findByPk(userId);
      if (user) {
        creditsRemaining = user.credits;
        if (user.credits > 0) {
          resolution = 'hd';
          deductCredit = true;
        }
      } else {
        console.warn("User not found in DB:", userId);
      }
    }

    if (!tempPath) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    // Prepare and send image to Python service
    const form = new FormData();
    form.append('file', fs.createReadStream(tempPath));
    form.append('resolution', resolution);

    const pyRes = await axios.post(PYTHON_SERVICE_URL, form, {
      headers: form.getHeaders(),
    });

    // Deduct credit if required
    if (deductCredit && user) {
      user.credits -= 1;
      await user.save();
      creditsRemaining = user.credits;
      console.log(`Credit deducted. User ${userId} now has ${creditsRemaining} credits`);
    }

    const processedUrl = `https://remove.cleanmybg.com${pyRes.data.url}`;

    res.json({
      status: 'success',
      processedUrl,
      resolution,
      creditsRemaining: userId ? creditsRemaining : null,
    });

  } catch (err) {
    console.error('removeBackground error:', err);
    res.status(500).json({
      message: 'Background removal failed',
      error: err.message,
    });
  } finally {
    // Always delete temp file
    if (tempPath && fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
};

module.exports = {
  removeBackground,
};
