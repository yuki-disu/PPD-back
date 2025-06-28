const User = require('../models/userModel');
const AppError = require('../utilities/appError');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const Transaction = require('../models/transactionModel');
const Estate = require('../models/estatesModel');
const catchAsync = require('../utilities/catchAsync');
const { Op } = require('sequelize');


const { User: UserWithAssociations, 
    Estates: EstatesWithAssociations, 
    Transactions: TransactionsWithAssociations } = require('../models/modelsAssociation');

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const { count, rows: users } = await User.findAndCountAll({
        attributes: { exclude: ['password', 'passwordChangedAt', 'passwordResetToken', 'passwordResetExpires'] },
        where: { active: true },
    });

    res.status(200).json({
        status: 'success',
        results: count,
        data: {
            users
        }
    });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get user data.', 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return next(new AppError('Invalid token. Please log in again.', 401));
  }

  const user = await User.findByPk(decoded.id, {
    attributes: { exclude: ['password', 'passwordChangedAt', 'passwordResetToken', 'passwordResetExpires'] },
  });

  if (!user) {
    return next(new AppError('No user found with that id.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.getUserThings = catchAsync(async (req, res, next) => {
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
    //all the transactions that the user is involved in


    const estatesTransacted = await TransactionsWithAssociations.findAll({
        where: {
            [Op.or]: [
                { buyer_id: user.id },
                { seller_id: user.id }
            ]
        },
        include: {
            model: EstatesWithAssociations,
            as: 'estate',
            attributes: ['id', 'location', 'price'],
        },
    });


    res.status(200).json({
        status: 'success',
        data: {
            estatesTransacted,
        },
    });
})


exports.updateMe = catchAsync(async (req, res, next) => {
  // 1️ Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new appError(
        'This route is not for password updates. Please use /updateMyPassword.',
        400,
      ),
    );
  }

  // 2️ Filter out unwanted fields names that are not allowed to be updated
  const allowedFields = [
    'username',
    'email',
    'role',
    'phone',
    'firstname',
    'lastname',
  ]; // Add other fields you want to allow
  const filteredBody = {};
  Object.keys(req.body).forEach((key) => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // 3️ Prevent role change to admin
  if (filteredBody.role === 'admin') {
    return next(new appError('You cannot change your role', 400));
  }

  // 4️ Update user document
  const updatedUser = await User.findByPk(req.user.id);
  if (!updatedUser) {
    return next(new appError('User not found', 404));
  }

  await updatedUser.update(filteredBody);

  // 5️ Send response
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {

  if (!req.body.password || !req.body.passwordConfirm) {
    return next(new appError('Please provide a password and a password confirmation', 400));
  }

  const isPasswordCorrect = await req.user.correctPassword(
    req.body.password,
    req.user.password,
  );
  if (!isPasswordCorrect) {
    return next(new appError('Incorrect password', 401));
  }
  

  if(req.body.password !== req.body.passwordConfirm) {
    return next(new appError('Passwords do not match', 400));
  }


  await User.update(
    { active: false },
    {
      where: {
        id: req.user.id,
      },
    },
  );

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

