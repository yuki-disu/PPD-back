const express = require('express');
const authController = require('../Controllers/authController');
const Router = express.Router();
const favoriteController = require('../Controllers/favoriteController');

Router.route('/')
  .get(authController.protect, favoriteController.getUserFavorites)
  .post(authController.protect, favoriteController.addToFavorites)
  .delete(authController.protect, favoriteController.removeFromFavorites);

module.exports = Router;