const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log('Received auth header:', authHeader); // 🪵 debug

  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Missing or invalid token' });

  const token = authHeader.split(' ')[1];
  // console.log('Extracted token:', token); // 🪵 debug

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    console.error('JWT Error:', err.message); // 🪵 debug
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};


module.exports = authMiddleware;
