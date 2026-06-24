const express = require('express');
const router = express.Router();
const {
  registerUser,
  verifyEmail,
  resendOTP,
  loginUser,
} = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/verify', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);

module.exports = router;
