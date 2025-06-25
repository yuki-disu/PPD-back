const Joi = require("joi");

const transactionSchema = Joi.object({
id: Joi.string().uuid().required(),
buyer_id: Joi.string().uuid().required(),
seller_id: Joi.string().uuid().required(),
estate_id: Joi.string().uuid().required(),
transaction_type: Joi.string().valid("buy", "rent").required(),
transaction_date: Joi.date().iso().required(),
startDate: Joi.date().iso().allow(null),
endDate: Joi.date().iso().allow(null),
amount: Joi.number().precision(2).min(0).required(),
});

module.exports = transactionSchema;

