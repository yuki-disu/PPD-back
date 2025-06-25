// estateController.js
const { where } = require('sequelize');
const Estates = require('../models/estatesModel');
const Transaction = require('../models/transactionModel');
const transactionSchema = require('../validators/transactionValidator');
const APIFeatures = require('../utilities/apiFeatures');
const AppError = require('../utilities/appError');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('../utilities/catchAsync');
const { CLIENT_RENEG_LIMIT } = require('tls');
const cloudinary = require('../config/cloudinary');





exports.getAllEstates = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const estates = await features.execute(Estates);

  res.status(200).json({
    status: 'success',
    results: estates.length,
    data: {
      estates,
    },
  });
});

exports.getEstate = catchAsync(async (req, res, next) => {
  const estate = await Estates.findByPk(req.params.id);
  if (!estate) {
    return next(new AppError('No estate with this ID', 400));
  }

  res.status(200).json({
    status: 'success',
    data: estate,
  });
});

exports.createNewEstate = catchAsync(async (req, res, next) => {
  if (!req.body.owner_id && req.user) {
    req.body.owner_id = req.user.id;
  }

  const result = await Estates.create(req.body);

  if (!result || typeof result !== 'object') {
    return next(
      new AppError(
        'Failed to save estate. Invalid response from database.',
        500,
      ),
    );
  }

  res.status(201).json({
    status: 'success',
    data: result,
  });
});


exports.deleteEstate = catchAsync(async (req, res, next) => {
  const estate = await Estates.destroy({
    where: { id: req.params.id },
  });

  if (estate) {
    next(new AppError('No estate with this id', 400));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.UpdateEstate = catchAsync(async (req, res, next) => {
  const { id, createdAt, ...updateData } = req.body;

  const affectedRows = await Estates.update(updateData, {
    where: { id: req.params.id },
    individualHooks: true,
  });

  if (affectedRows) next(new AppError('No estate with this ID', 400));

  res.status(200).json({
    status: 'success',
    data: affectedRows,
  });
});


