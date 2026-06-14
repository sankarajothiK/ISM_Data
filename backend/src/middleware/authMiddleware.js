const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from format: Bearer <token>
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'ism_data_tech_recruitment_secret_key'
      );

      // Find user and attach to request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user account not found',
        });
      }

      next();
    } catch (error) {
      console.error(`JWT Auth Middleware Error: ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token verification failed',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token was provided',
    });
  }
};

module.exports = { protect };
