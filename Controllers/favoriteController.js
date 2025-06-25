const { where } = require('sequelize');
const APIFeatures = require('../utilities/apiFeatures');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');

const Favorites = require('../models/favoriteModel');


exports.addToFavorites = catchAsync(async (req, res, next) => {
    const estateId = req.body.estate;

    userId = req.user.id; 
    if (!estateId) {
        return next(new AppError('Estate ID is required', 400));
    }

    const favorite = await Favorites.addToFavorites(userId, estateId);

    res.status(201).json({
        status: 'success',
        data: {
            favorite,
        },
    });
});
exports.removeFromFavorites = catchAsync(async (req, res, next) => {
    
    const estateId  = req.body.estate;
    console.log(estateId);
    
    userId = req.user.id;

    const deletedCount = await Favorites.removeFromFavorites(userId, estateId);

    if (deletedCount === 0) {
        return next(new AppError('Favorite not found', 404));
    }
    
    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.getUserFavorites = catchAsync(async (req, res, next) => {

    const userId  = req.user.id;
    if (!userId) {
        return next(new AppError('User ID is required', 400));
    }
    const favorites = await Favorites.getUserFavorites(userId);

    res.status(200).json({
        status: 'success',
        data: {
            favorites,
        },
    });
});