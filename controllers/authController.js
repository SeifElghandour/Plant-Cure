const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { buildOtpEmailHtml } = require('../utils/sendEmail');

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&]).{8,}$/;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function assignAndSendOtp(user) {
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
  await user.save();

  await sendEmail({
    email: user.email,
    subject: 'Your Plant Cure verification code',
    message: buildOtpEmailHtml(user.name, otp),
  });
}

// @desc    Register new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  if (!PASSWORD_REGEX.test(password)) {
    res.status(400);
    throw new Error(
      'Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&).'
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const userExists = await User.findOne({ email: normalizedEmail });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    isVerified: false,
  });

  await assignAndSendOtp(user);

  res.status(201).json({
    message: 'Registration successful. Enter the 6-digit code sent to your email.',
    email: user.email,
  });
});

// @desc    Verify user email with OTP
// @route   POST /api/users/verify
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400);
    throw new Error('Email and verification code are required');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    res.status(400);
    throw new Error('Invalid verification request');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('This account is already verified. You can log in.');
  }

  if (!user.otp || !user.otpExpires) {
    res.status(400);
    throw new Error('No active verification code. Please request a new one.');
  }

  if (user.otpExpires.getTime() < Date.now()) {
    res.status(400);
    throw new Error('Verification code has expired. Please request a new one.');
  }

  if (String(user.otp) !== String(otp).trim()) {
    res.status(400);
    throw new Error('Invalid verification code. Please try again.');
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  res.status(200).json({
    message: 'Email verified successfully. You can now log in.',
  });
});

// @desc    Resend OTP verification code
// @route   POST /api/users/resend-otp
// @access  Public
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });

  if (!user) {
    res.status(400);
    throw new Error('No account found with that email address');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('This account is already verified. You can log in.');
  }

  await assignAndSendOtp(user);

  res.status(200).json({
    message: 'A new verification code has been sent to your email.',
  });
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user && (await bcrypt.compare(password, user.password))) {
    if (!user.isVerified) {
      res.status(401);
      throw new Error('Please verify your email before logging in.');
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid credentials');
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  registerUser,
  verifyEmail,
  resendOTP,
  loginUser,
};
