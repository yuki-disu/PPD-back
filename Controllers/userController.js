const User = require('../models/userModel');
const appError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');



exports.getAllUsers = catchAsync(async (req,res,next) => {
    const users = await User.findAll();
    
    res.status(200).json({
    status: 'success',
    length: users.length,
    data: users
    });
});


exports.getUser = catchAsync(async (req,res,next) => {
    let user = await User.findById(req.params.id);
    res.status(200).json({
    status: 'success',
    data: user
    });
});

exports.updateUser = catchAsync(async (req,res,next) => {
    const user = await User.findByIdAndUpdate(req.params.id,req.body);
    if(!user)  next(new appError("No user with this id ",400 ));
    res.status(200).json({
        status:"success",
        data: user
    });

})

