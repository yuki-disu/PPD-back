const joi = require('joi');

const userSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().min(8).max(32).required(),
    passwordConfirm:joi.string().min(8).max(32).required(),
    passwordChangedAt:joi.date().default(null),
    phone: joi.number().integer(),
    role: joi.string().required().valid("user","admin","company").default("user"),
    active: joi.boolean().default(true),
    // image: joi.string().uri().default("public/img/users/default"),
});

module.exports = userSchema;