const Estates = require('../models/estatesModel');
const APIFeatures = require('../utilities/apiFeatures');
const appError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');

exports.getAllEstates = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate(); // Pass only req.query
  const estates = await features.execute(); // Call execute() to run the SQL query

  res.status(200).json({
    status: 'success',
    count: estates.length,
    data: estates,
  });
});

exports.createEstate = catchAsync(async (req, res, next) => {
    const result = await Estates.save(req.body);

    if (!result || typeof result !== 'object') {
        return next(new appError('Failed to save estate. Invalid response from database.', 500));
    }

    const { success, estateId, errors } = result;

    if (!success) {
        console.error('Errors:', errors);
        return res.status(400).json({
            status: 'fail',
            errors,
        });
    }

    res.status(201).json({
        status: 'success',
        data: { id: estateId },
    });
});

exports.getAnEstate = catchAsync(async (req, res, next) => {
  let [estate, _] = await Estates.findById(req.params.id);
  if(estate) throw new appError('No estate with this id found',404);

  res.status(200).json({
    status: 'success',
    data: estate,
  });
});

exports.deleteAnEstate = catchAsync(async (req, res, next) => {
  const estate = await Estates.findByIdAndDelete(req.params.id);
  if (estate) {
    next(new appError('No estate wit this id', 400));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateEstate = catchAsync(async (req,res,next) => {
    const estate = await Estates.findByIdAndUpdate(req.params.id,req.body);
    if(estate) next(new appError('No estate with this ID',400 ));
    res.status(200).json({
        status: 'success',
        data: estate,
      });
});

exports.RentEstate = catchAsync(async (req,res,next) => {
  let[estate, _] = await Estates.findById(req.params.id);
  if(estate) throw new appError('No estate with this id found',404);
  

});
