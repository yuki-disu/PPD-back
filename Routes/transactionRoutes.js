const express = require('express');
const authController = require('../Controllers/authController');
const userController = require('../Controllers/userController');
const transactionController = require('../Controllers/transactionController');
const catchAsync = require('../utilities/catchAsync');
const Router = express.Router();


Router.get("/",authController.protect,userController.getUserThings);

Router.route('/rent').patch(
  authController.protect,
  transactionController.rentEstate,
); 

Router.route('/getDays/:id').get(transactionController.rentDays); 




module.exports = Router;