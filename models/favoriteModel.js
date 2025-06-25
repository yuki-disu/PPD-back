const { DataTypes } = require('sequelize');
const sequelize = require('../config/db.js');
const AppError = require('../utilities/appError.js');
const Estates = require('./estatesModel.js');
const favoriteSchema = require('../Validators/favoriteValidator.js');


const favorites = sequelize.define('favorites', {
    user: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    },
    estate: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
}, {
  timestamps: false,
  freezeTableName: true,
  tableName: 'favorites',
});

favorites.addToFavorites = async (userId, estateId) => {
    const { error } = favoriteSchema.validate({ user: userId, estate: estateId });
    if (error) {
        throw new AppError(error.details[0].message, 400);
    }

    const favorite = await favorites.create({ user: userId, estate: estateId });
    return favorite;
};


favorites.removeFromFavorites = async (userId, estateId) => {
    const { error } = favoriteSchema.validate({ user: userId, estate: estateId });
    if (error) {
        throw new AppError(error.details[0].message, 400);
    }

    const deletedCount = await favorites.destroy({
        where: { user: userId, estate: estateId }
    });

    if (deletedCount === 0) {
        throw new AppError('Favorite not found', 404);
    }

    return deletedCount;
};

favorites.getUserFavorites = async (userId) => {
    const userFavorites = await favorites.findAll({
        where: { user: userId },
        include: [{
            model: Estates,
            as: 'favoriteEstate',
            attributes: ['id', 'location', 'description','imageCover','images', 'type', 'numOfRooms', 'numOfBathroom', 'numOfKitchen', 'garageCapacity', 'area', 'price', 'status']
        }]
    });

    // Return only the estate info
    return userFavorites.map(fav => fav.favoriteEstate);
}

module.exports = favorites;