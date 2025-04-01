const User = require('../models/userModel');
const APIFeatures = require('../utilities/apiFeatures');
const appError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const sendEmail = require('../utilities/email');
const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require("../config/db");


exports.signToken = (id) => {
    return jwt.sign(
      { id, iat: Math.floor(Date.now() / 1000) }, // Explicitly set `iat`
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );
  };
  

exports.createSendToken = (user, statusCode, res) => {
    const token = this.signToken(user.id); // Use `user.id` instead of `user._id`
  
    const cookieOptions = {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRESIN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    };
  
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  
    res.cookie('jwt', token, cookieOptions);
  
    // Remove sensitive fields from output
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
  

exports.signup = catchAsync(async (req,res,next) => {
    const newUser = await User.save(req.body);
    this.createSendToken(newUser, 200, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new appError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email }, ['+password']);
    if (!user) return next(new appError('Incorrect email or password', 401));

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return next(new appError('Incorrect email or password', 401));

    this.createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1️⃣ Get token
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new appError('You are not logged in! Please log in to get access.', 401));
  }

  // 2️⃣ Verify token
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new appError('Invalid or expired token. Please log in again.', 401));
  }

  // 3️⃣ Check if user still exists
  console.log('Decoded ID:', decoded.id); // 🔍 Debugging
  const userRows = await User.findById(String(decoded.id));
  console.log('User Found:', userRows); // 🔍 Debugging

  const currentUser = userRows ? userRows : null;
  if (!currentUser) {
    return next(new appError('The user belonging to this token does not exist.', 401));
  }

  // 4️⃣ Check if user changed password after token was issued
  if (currentUser.passwordChangedAt) {
    const changedTimestamp = Math.floor(new Date(currentUser.passwordChangedAt).getTime() / 1000);
    if (decoded.iat < changedTimestamp) {
      return next(new appError('User recently changed password! Please log in again.', 401));
    }
  }

  // 5️⃣ Grant access to protected route
  req.user = currentUser;
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
    // 1️⃣ Get user based on email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new appError('There is no user with that email address.', 404));
    }
  
    // 2️⃣ Generate reset token & save hashed token
    const resetToken = user.createPasswordResetToken(); // ✅ Now this works
    await User.findByIdAndUpdate(user.id, {
      passwordResetToken: user.passwordResetToken,
      passwordResetExpires: user.passwordResetExpires,
    });
  
    // 3️⃣ Send token to user's email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't request this, please ignore this email.`;
  
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
      // ❌ If email fails, remove reset token
      await User.findByIdAndUpdate(user.id, {
        passwordResetToken: user.passwordResetToken || null,
        passwordResetExpires: user.passwordResetExpires || null,
      });
      
  
      return next(new appError('There was an error sending the email:'+err, 500));
    }
  });
  

  
exports.resetPassword = catchAsync(async (req, res, next) => {
    // Get user based on hashed token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  
    const sql = `SELECT * FROM users WHERE passwordResetToken = ? AND passwordResetExpires > NOW() LIMIT 1`;
    const [users] = await db.execute(sql, [hashedToken]);
    const user = users.length > 0 ? users[0] : null;
  
    if (!user) {
      return next(new appError('Token is invalid or expired', 400));
    }
  
    // Update user password
    const hashedPassword = await bcrypt.hash(req.body.password, 12);
    await User.findByIdAndUpdate(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
    });
  
    // Log user in & send new JWT
    this.createSendToken(user, 200, res);
  });


  
  