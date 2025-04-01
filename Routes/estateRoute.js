const express = require('express');
const authController = require('../Controllers/authController');
const Router = express.Router();
const estateController = require('../Controllers/estateController');
// Router.param('body', houseController.checkBody);

//aliasing using middleware

//Router.route('/house-stats').get(houseController.getHouseStats); // Corrected method name


Router.route('/buyHouse/:id').patch();

Router.route('/')
  .get(estateController.getAllEstates) // Corrected method name
  .post(authController.protect,estateController.createEstate);

Router.route('/:id')
  .get(estateController.getAnEstate)
  .delete(authController.protect,estateController.deleteAnEstate)
  .patch(authController.protect,estateController.updateEstate);

module.exports = Router;
