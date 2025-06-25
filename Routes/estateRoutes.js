const express = require('express');
const authController = require('../Controllers/authController');
const Router = express.Router();
const estateController = require('../Controllers/estateController');
const cloudinary = require('../config/cloudinary');


Router.route('/')
  .get(estateController.getAllEstates)
  .post(
    authController.protect,
    cloudinary.uploadProductImages,
    cloudinary.resizeAndUploadImages,
    estateController.createNewEstate,
  );

Router.route('/:id')
  .get(estateController.getEstate)
  .delete(
    authController.protect,
    authController.isOwner,
    estateController.deleteEstate,
  ) 
  .patch(
    authController.protect,authController.isOwner, cloudinary.uploadProductImages,
    cloudinary.resizeAndUploadImages,
    estateController.UpdateEstate,
  ); 

module.exports = Router;
