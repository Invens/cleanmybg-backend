const RATE_LIMIT = 10; // guests only
const WINDOW_SIZE = 10 * 60 * 1000; // 10 minutes in ms

// Store guest usage in memory (for production use Redis!)
const guestRequests = new Map();

function getClientIp(req) {
  // Try to get real client IP behind proxies
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip
  );
}

function rateLimit(req, res, next) {
  // If logged in, unlimited
  if (req.userId) return next();

  const key = getClientIp(req);
  const now = Date.now();

  if (!guestRequests.has(key)) guestRequests.set(key, []);
  let timestamps = guestRequests.get(key).filter(ts => now - ts < WINDOW_SIZE);

  if (timestamps.length >= RATE_LIMIT) {
    const timeToReset = WINDOW_SIZE - (now - timestamps[0]);
    const waitMinutes = Math.ceil(timeToReset / 60000);
    return res.status(429).json({
      message: `Free usage limit reached. Please wait ${waitMinutes} minute(s) or log in for unlimited removals.`,
      waitMinutes,
      limit: RATE_LIMIT,
      used: timestamps.length,
      isLimited: true,
    });
  }

  timestamps.push(now);
  guestRequests.set(key, timestamps);

  // Expose rate limit info for frontend (optional)
  res.locals.rateLimitInfo = {
    limit: RATE_LIMIT,
    used: timestamps.length,
    waitMinutes: 0,
    isLimited: false,
  };

  next();
}

module.exports = rateLimit;
