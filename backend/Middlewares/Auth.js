const jwt = require('jsonwebtoken');

const ensureAuthenticated = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: JWT token is required',
      });
    }

    // Allow both 'Bearer <token>' and raw token formats
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: JWT token is missing',
      });
    }

    // Decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);

    return res.status(403).json({
      success: false,
      message: 'Unauthorized: JWT token is invalid or expired',
    });
  }
};

module.exports = ensureAuthenticated;
