const rateLimit = require('express-rate-limit');

const adminAuth = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { adminAuth, publicRateLimit };
