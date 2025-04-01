const express = require('express');
const authController = require('../Controllers/authController');
const userController = require('../Controllers/userController')

const Router = express.Router();

Router.post('/signup',authController.signup);
Router.post('/login',authController.login);

Router.post('/forgotPassword',authController.forgotPassword);
Router.patch('/resetPassword/:token',authController.resetPassword);

Router.patch('/updateMyPassword');

Router.patch('/updateMe');
Router.delete('/deleteMe');


Router
 .route('/')
    .get(authController.protect,userController.getAllUsers)
    .post()
    
Router
 .route('/:id')
    .get(userController.getUser)
    .patch()
    .delete()
    
    module.exports = Router;