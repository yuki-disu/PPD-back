const { where } = require('sequelize');
const Estates = require('../models/estatesModel');
const Transaction = require('../models/transactionModel');
const transactionSchema = require('../validators/transactionValidator');
const AppError = require('../utilities/appError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('../utilities/catchAsync');





exports.rentEstate = catchAsync(async (req, res, next) => {
  if (req.body.startDate && req.body.endDate) {
    if (new Date(req.body.startDate) >= new Date(req.body.endDate)) {
      return next(new AppError('Start date must be before end date', 400));
    }
  } else if (!req.body.startDate && !req.body.endDate) {
    return next(new AppError('Start date and end date are required', 400));
  }

  const { error } = transactionSchema.validate(req.body, { abortEarly: false });
  const estate = await Estates.findByPk(req.body.estate_id);
  if (!estate) {
    return next(new AppError('No estate with this ID', 400));
  }

  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (!req.body.estate_id) {
    return next(new AppError('Estate ID is required', 400));
  }

  console.log(estate.owner_id);

  const transaction = await Transaction.createTransaction({
    id: crypto.randomUUID(),
    buyer_id: decoded.id,
    seller_id: estate.owner_id,
    estate_id: req.body.estate_id,
    transaction_type: 'rent',
    transaction_date: new Date(),
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    amount: req.body.amount,
  });

  console.log(transaction);

  // if (error) {
  //     return next(new AppError( 'Validation Error', error.details.map(err => err.message).join(', '),400));
  // }
  // if (!transaction) {
  //     return next(new AppError('Failed to create transaction',500));
  // }
  res.status(201).json({
    status: 'success',
    data: transaction,
  });
});

exports.rentDays = catchAsync(async (req, res, next) => {
  if(!req.params.id){
    return next(new AppError('House ID is required', 400));
  }

  const transactions = await Transaction.findAll({
    where: {
      estate_id: req.params.id,
      transaction_type: 'rent',
    },
    attributes: ['startDate', 'endDate'],
    raw: true,
  });


  // Format date as YYYY/MM/DD and remove time part
  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formattedTransactions = transactions.map(t => ({
    startDate: formatDate(t.startDate),
    endDate: formatDate(t.endDate),
  }));

  res.status(200).json({
    status: 'success',
    transaction: formattedTransactions,
  });
});

