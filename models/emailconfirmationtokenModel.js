const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { userSchema } = require('../Validators/userValidator');

const emailconfirmationTokenSchema = {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true,
    },
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
};



module.exports = emailconfirmationTokenSchema; 
