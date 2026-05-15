const crypto = require('crypto');

const CSRF_COOKIE = 'csrf-token';
const CSRF_HEADER = 'x-csrf-token';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

const csrfProtection = (req, res, next) => {
  if (SAFE_METHODS.includes(req.method)) {
    if (!req.cookies[CSRF_COOKIE]) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie(CSRF_COOKIE, token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }
    return next();
  }

  const cookieToken = req.cookies[CSRF_COOKIE];
  const headerToken = req.headers[CSRF_HEADER];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing',
      code: 'CSRF_ERROR',
    });
  }

  if (cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token mismatch',
      code: 'CSRF_ERROR',
    });
  }

  next();
};

module.exports = { csrfProtection };
