const User = require('../models/userModel');
const PasswordReset = require('../models/passwordResetModel'); // Add this import
const userController = require('../Controllers/userController');
const appError = require('../utilities/appError');
const Estate = require('../models/estatesModel');
const catchAsync = require('../utilities/catchAsync');
const sendEmail = require('../utilities/email');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../config/db');


const { Op } = require('sequelize');

exports.signToken = (id) => {
  return jwt.sign(
    { id, iat: Math.floor(Date.now() / 1000) },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN,
    },
  );
};

exports.createSendToken = (user, statusCode, res) => {
  // Generate token
  const token = this.signToken(user.id);

  // Set up cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRESIN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;
  user.passwordChangedAt = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  if(req.body.role === 'admin') {
    return next(new appError('You cannot create an admin account', 400));
  }
  
  if (await User.findOne({ 
    where: { 
      [Op.or]: [
        { email: req.body.email },
        { username: req.body.username }
      ]
    } 
  })) {
    return next(new appError('Email or username already exists', 400));
  }
  

  // Check if the user already exists
  const newUser = await User.createUser(req.body);

  console.log(newUser);

  if (!newUser) {
    return next(new appError('User creation failed', 400));
  }

  this.createSendToken(newUser, 200, res); // Send the token response
});

exports.sendConfirmationEmail = catchAsync(async (user, res) => {
  
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new appError('Please provide email and password', 400));
  }

  let user = await User.findOne({
    where: { email: email },
  });
  console.log(user);

  if (!user) {
    user = await User.findOne({
      where: { username: email },
    });
    if (!user) {
      return next(new appError('Incorrect email or password', 401));
    }
  }

  const isPasswordCorrect = await user.correctPassword(password);

  if (!isPasswordCorrect)
    return next(new appError('Incorrect email or password', 401));

  this.createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1️ Get token
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new appError('You are not logged in! Please log in to get access.', 401));
  }

  // 2️ Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new appError('Invalid or expired token. Please log in again.', 401));
  }
  // 3️ Check if user still exists
  const currentUser = await User.findByPk(decoded.id);
  if (!currentUser) {
    return next(new appError('The user belonging to this token no longer exists.', 401));
  }

  // 4️ Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new appError('User recently changed password! Please log in again.', 401));
  }

  // Grant access to protected route
  req.user = currentUser;
  console.log("Authenticated user ID:", req.user.id); // Safe logging
  next();
});

// IS OWNER MIDDLEWARE
exports.isOwner = catchAsync(async (req, res, next) => {
  const estateId = req.params.id;
  const userId = req.user.id;
  const userRole = req.user.role;

  // Admins can bypass ownership check
  if (userRole === 'admin') {
    console.log("Admin access granted for user ID:", userId);
    return next();
  }

  // First, find the estate by its ID only
  const estate = await Estate.findByPk(estateId);

  if (!estate) {
    return next(new appError('Estate not found.', 404));
  }

  // Then, check if the logged-in user is the owner
  if (estate.ownerId !== userId) {
    return next(new appError('You do not have permission to perform this action', 403));
  }

  console.log(`User ID ${userId} is confirmed as owner of Estate ID ${estateId}`);
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles ['admin','company']
    if (!roles.includes(req.user.role)) {
      return next(
        new appError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    where: {
      [Op.or]: [
        { email: req.body.email || null },
        { username: req.body.username || null },
      ],
    },
    attributes: {
      exclude: ['password', 'passwordChangedAt'],
    },
  });

  if (!user) {
    return next(new appError('There is no user with that email address or username.', 404));
  }

  // Generate OTP using the new method
  const OTP = await user.createOTP();
  // Note: No need to call user.save() because createOTP handles the PasswordReset table

  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 32px 24px; background: #fafbfc;">
      <h2 style="color: #2d3748; text-align: center;">Password Reset Request</h2>
      <p style="font-size: 16px; color: #4a5568; text-align: center;">
        You requested to reset your password. Use the OTP below to proceed. This code is valid for <strong>10 minutes</strong>.
      </p>
      <div style="margin: 32px 0; text-align: center;">
        <span style="display: inline-block; background: #edf2f7; color: #2b6cb0; font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 16px 32px; border-radius: 6px; border: 1px solid #cbd5e0;">
          ${OTP}
        </span>
      </div>
      <p style="font-size: 14px; color: #718096; text-align: center;">
        If you did not request this, please ignore this email.
      </p>
      <p style="font-size: 13px; color: #a0aec0; text-align: center; margin-top: 32px;">
        &copy; ${new Date().getFullYear()} Your Company Name
      </p>
    </div>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    // If email fails, clean up the reset token
    await user.clearPasswordResetToken();

    return next(
      new appError('There was an error sending the email: ' + err.message, 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const OTP = req.body.otp;
  
  if (!OTP) {
    return next(new appError('Please provide the OTP', 400));
  }

  if (!req.body.password || !req.body.passwordConfirm) {
    return next(new appError('Please provide a password and a password confirmation', 400));
  }
  
  if (req.body.password !== req.body.passwordConfirm) {
    return next(new appError('Passwords do not match', 400));
  }

  // Hash the OTP to compare with the stored hashed token
  const hashedToken = crypto.createHash('sha256').update(OTP).digest('hex');

  // Find the password reset record
  const resetRecord = await PasswordReset.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { [Op.gt]: new Date() }, // Check if not expired
    },
    include: [{
      model: User,
      as: 'user'
    }]
  });

  if (!resetRecord) {
    return next(new appError('Token is invalid or has expired', 400));
  }

  const user = resetRecord.user;

  // Update password
  user.password = req.body.password;
  user.passwordChangedAt = new Date();
  await user.save({ validate: false });

  // Clean up the password reset token
  await user.clearPasswordResetToken();

  this.createSendToken(user, 200, res); // Automatic login after password reset
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1️ Validate input
  if (!req.body.passwordCurrent)
    return next(new appError('Please provide a your current password', 400));
  if (!req.body.password)
    return next(new appError('Please provide a password', 400));
  if (!req.body.passwordConfirm)
    return next(new appError('Please provide a password confirmation', 400));
  if (req.body.password !== req.body.passwordConfirm)
    return next(new appError('Passwords do not match', 400));

  // 2️ Get user from collection
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return next(
      new appError(
        'You are not logged in! Please log in to update your password.',
        401,
      ),
    );
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findByPk(decoded.id);

  if (!user) {
    return next(new appError('User not found', 404));
  }

  // 3️ Check if password is correct
  const isPasswordCorrect = await user.correctPassword(
    req.body.passwordCurrent,
    user.password,
  );
  if (!isPasswordCorrect) {
    return next(new appError('Incorrect password', 401));
  }

  //4 ️ Update password
  user.password = req.body.password;
  user.passwordConfirm = null; // Clear passwordConfirm field

  user.passwordChangedAt = new Date(Date.now() + 1000); // Set passwordChangedAt to now
  await user.save({ validate: false }); // Save the user without validation

  // 5️ Log user in & send JWT
  this.createSendToken(user, 200, res);
});