const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const PASSWORD_REGEX = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&]).{8,}$/;

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

  // Check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    isVerified: false,
    verificationToken,
  });

  const verificationUrl = `http://localhost:3000/api/users/verify/${verificationToken}`;

  await sendEmail({
    email: user.email,
    subject: 'Verify your Plant Scan AI account',
    message: `
      <h2>Welcome to Plant Scan AI, ${user.name}!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" target="_blank">${verificationUrl}</a>
      <p>If you did not create this account, you can ignore this email.</p>
    `,
  });

  res.status(201).json({
    message: 'Registration successful. Please check your email to verify your account before logging in.',
  });
});

// @desc    Verify user email
// @route   GET /api/users/verify/:token
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const user = await User.findOne({ verificationToken: req.params.token });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification token');
  }

  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  res.status(200).json({
    message: 'Email verified successfully. You can now log in.',
  });
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

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

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
};
