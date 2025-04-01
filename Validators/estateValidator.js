const Joi = require("joi");

const estateSchema = Joi.object({
    owner_id: Joi.string().uuid().required(),
    location: Joi.string().min(3).max(255).required(),
    description: Joi.string().min(10).required(),
    type: Joi.string().valid("studio", "apartment", "house").required(),
    numOfRooms: Joi.number().integer().min(1).required(),
    numOfBathroom: Joi.number().integer().min(1).required(),
    numOfKitchen: Joi.number().integer().min(0).allow(null),
    garageCapacity: Joi.number().integer().min(0).allow(null),
    area: Joi.number().integer().min(1).required(),
    price: Joi.number().precision(2).min(0).required(),
    status: Joi.string().valid("available", "sold", "rented").default("available"),
    for_rent: Joi.boolean().default(false),
    imageCover: Joi.string().uri().allow(null),
    images: Joi.array().items(Joi.string().uri()).allow(null),
    sold: Joi.boolean().default(false),
    rented: Joi.boolean().allow(null),
    visibleHouse: Joi.boolean().default(true),
    centralHeating: Joi.boolean().default(false),
    alarmsAndSecurity: Joi.boolean().default(false),
    fireDetector: Joi.boolean().default(false),
    camera: Joi.boolean().default(false),
    parking: Joi.boolean().default(false),
    electricity: Joi.boolean().default(false),
    gaz: Joi.boolean().default(false),
    closeToTransportation: Joi.boolean().default(false),
    closeToBeach: Joi.boolean().default(false),
    natureView: Joi.boolean().default(false),
});

module.exports = estateSchema;
