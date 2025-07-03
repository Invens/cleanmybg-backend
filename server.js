const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const paymentRoutes = require('./routes/payment');
const imageROutes = require('./routes/image');

const app = express();

// Allow only cleanmybg.com and www.cleanmybg.com
app.use(cors({
  origin: ['https://cleanmybg.com', 'https://www.cleanmybg.com']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/image', imageROutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
