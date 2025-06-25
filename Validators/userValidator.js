const joi = require('joi');

const userSchema = joi.object({
    username: joi.string().required(),
    firstName: joi.string(),
    lastName: joi.string(),
    email: joi.string().email().required(),
    password: joi.string().min(8).max(32).required(),
    image: joi.string().uri().allow(null),
    passwordConfirm: joi.string().valid(joi.ref('password')).required().messages({
        'any.only': 'Passwords do not match'
    }),
    passwordChangedAt: joi.date().default(null),
    phone: joi.number().integer(),
    role: joi.string().valid("user", "admin").default("user"),
    active: joi.boolean().default(true),
});

module.exports = { userSchema }; 
