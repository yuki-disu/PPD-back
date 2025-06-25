const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { userSchema } = require('../Validators/userValidator');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Please provide your name',
        },
      },
      unique: {
        msg: 'This UserName is already in use',
      },
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    firstname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'User',
    },
    lastname: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'User',
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        msg: 'This email is already in use',
      },
      validate: {
        isEmail: {
          msg: 'Please provide a valid email address',
        },
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: {
          args: [8, 255],
          msg: 'Password must be at least 8 characters long',
        },
      },
    },
    passwordConfirm: {
      type: DataTypes.VIRTUAL,
      validate: {
        isMatch(value) {
          if (value !== this.password) {
            throw new Error('Passwords do not match');
          }
        },
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: {
        msg: 'This phone number is already in use',
      },
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    passwordChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: false,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
          user.passwordChangedAt = new Date();
          user.passwordConfirm = undefined;
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
          user.passwordChangedAt = new Date();
          user.passwordConfirm = undefined;
        }
      },
      beforeFind: async (options) => {
        if (!options.where) {
          options.where = {};
        }
        options.where.active = true;
      },
    },
  },
);

// Instance method to check password
User.prototype.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method to check if password was changed after a timestamp
User.prototype.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Updated method to create OTP using PasswordReset model
User.prototype.createOTP = async function () {
  const PasswordReset = require('./passwordResetModel'); // Import here to avoid circular dependency
  
  const otp = crypto.randomBytes(3).toString('hex'); // Generate a 6-character OTP


  const hashedOTP = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex'); // Hash the OTP
  // Create or update password reset record
  await PasswordReset.destroy({ where: { user_id: this.id } }); // Remove any existing reset tokens
  
  await PasswordReset.create({
    user_id: this.id,
    passwordResetToken: hashedOTP, // Fixed field name
    passwordResetExpires: new Date(Date.now() + 10 * 60 * 1000), // Expires in 10 minutes
  });

  return otp; // Return the plain OTP for sending to user
};

// Method to verify OTP
User.prototype.verifyOTP = async function (candidateOTP) {
  const PasswordReset = require('./passwordResetModel');
  
  const hashedOTP = crypto
    .createHash('sha256')
    .update(candidateOTP)
    .digest('hex');

  const resetRecord = await PasswordReset.findOne({
    where: { 
      user_id: this.id,
      passwordResetToken: hashedOTP, // Fixed field name
    }
  });

  if (!resetRecord) {
    return false; // Invalid OTP
  }

  if (resetRecord.passwordResetExpires < new Date()) {
    await PasswordReset.destroy({ where: { user_id: this.id } }); // Clean up expired token
    return false; // Expired OTP
  }

  return true; // Valid OTP
};

// Method to clear password reset token after successful reset
User.prototype.clearPasswordResetToken = async function () {
  const PasswordReset = require('./passwordResetModel');
  await PasswordReset.destroy({ where: { user_id: this.id } });
};

// Static method to create user
User.createUser = async function (data) {
  const { error, value: userData } = userSchema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new AppError(error.details.map((err) => err.message).join(', '), 400);
  }

  try {
    const newUser = await User.create(userData);

    newUser.password = undefined;
    newUser.passwordChangedAt = undefined;

    return newUser;
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      const duplicateField = err.errors[0].path;
      throw new AppError(
        `Duplicate field value: ${duplicateField}. Please use another value.`,
        400,
      );
    }
    throw err;
  }
};

module.exports = User;