const { DataTypes, fn } = require('sequelize');
const transactionSchema = require('../validators/transactionValidator');
const sequelize = require('../config/db');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const User = require('./userModel');

// Create the Transactions model
const Transactions = sequelize.define('Transactions', {
  id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
  },
  estate_id: {
      type: DataTypes.UUID,
      allowNull: false,
  },
  buyer_id: {
      type: DataTypes.UUID,
      allowNull: false,
  },
  seller_id: {
      type: DataTypes.UUID,
      allowNull: false,
  },
  transaction_type: {
      type: DataTypes.ENUM('rent', 'buy'),
      allowNull: false,
  },
  amount: {
      type: DataTypes.FLOAT,
      allowNull: false,
  },
  transaction_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
  },
  startDate: {
      type: DataTypes.DATE,
      allowNull: true,
  },
  endDate: {
      type: DataTypes.DATE,
      allowNull: true,
  },
}, {
  tableName: 'transactions',
  timestamps: false,
});

Transactions.createTransaction = async function (data) {
    const { error } = transactionSchema.validate(data, { abortEarly: false });
    if (error) {
        throw new AppError(error.details.map(err => err.message).join(', '), 400);
    }

    if (data.transaction_type !== 'rent') {
        throw new AppError('This operation is only valid for rent transactions.', 400);
    }

    const existingTransactions = await Transactions.findAll({
        where: {
            estate_id: data.estate_id,
            transaction_type: 'rent',
        },
    });

    const isOverlapping = existingTransactions.some(transaction => {
        const existingStart = new Date(transaction.startDate);
        const existingEnd = new Date(transaction.endDate);
        const newStart = new Date(data.startDate);
        const newEnd = new Date(data.endDate);

        return (
            (newStart >= existingStart && newStart <= existingEnd) ||
            (newEnd >= existingStart && newEnd <= existingEnd) ||
            (newStart <= existingStart && newEnd >= existingEnd)
        );
    });

    if (isOverlapping) {
        throw new AppError('The selected dates overlap with an existing rental period.', 400);
    }

    const transaction = await Transactions.create(data);
    return transaction;
};

// We'll set up the associations in a separate file
// to avoid circular dependencies

module.exports = Transactions;