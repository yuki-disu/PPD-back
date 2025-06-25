const Joi = require("joi");

const favoriteSchema = Joi.object({
  user: Joi.string().uuid().required(),
  estate: Joi.string().uuid().required(),
  createdAt: Joi.date().default(() => new Date())
}).options({ stripUnknown: true }); 

module.exports = favoriteSchema;