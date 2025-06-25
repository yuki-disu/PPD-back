// modelsAssociation.js
const User = require('./userModel');
const Estates = require('./estatesModel');
const Transactions = require('./transactionModel');
const Favorites = require('./favoriteModel');
const PasswordReset = require('./passwordResetModel');
const Reviews = require('./ReviewsModel');

// Set up User associations
User.associate = function(models) {
  User.hasMany(Estates, {
    foreignKey: 'owner_id',
    as: 'estates'
  });
  User.hasMany(Transactions, {
    foreignKey: 'buyer_id',
    as: 'purchases'
  });
  User.hasMany(Transactions, {
    foreignKey: 'seller_id',
    as: 'sales'
  });
  User.hasMany(Favorites, {
    foreignKey: 'user',
    as: 'favorites'
  });
  User.hasOne(PasswordReset, {
    foreignKey: 'user_id',
    as: 'passwordResets'
  });
  User.hasMany(Reviews, {
    foreignKey: 'user_id',
    as: 'reviews'
  });
};

// Set up Estates associations
Estates.associate = function(models) {
  Estates.belongsTo(User, {
    foreignKey: 'owner_id',
    as: 'owner'
  });
  Estates.hasMany(Transactions, {
    foreignKey: 'estate_id',
    as: 'transactions'
  });
  Estates.hasMany(Reviews, {
    foreignKey: 'estate_id',
    as: 'reviews'
  });
  Estates.hasMany(Favorites, {
    foreignKey: 'estate',
    as: 'favorites'
  });
};

// Set up Transactions associations
Transactions.associate = function(models) {
  Transactions.belongsTo(Estates, {
    foreignKey: 'estate_id',
    as: 'estate'
  });
  Transactions.belongsTo(User, {
    foreignKey: 'buyer_id',
    as: 'buyer'
  });
  Transactions.belongsTo(User, {
    foreignKey: 'seller_id',
    as: 'seller'
  });
};

// Set up Favorites associations
Favorites.associate = function(models) {
  Favorites.belongsTo(User, {
    foreignKey: 'user',
    as: 'favoriteUser'
  });
  Favorites.belongsTo(Estates, {
    foreignKey: 'estate',
    as: 'favoriteEstate'
  });
};

// Set up PasswordReset associations
PasswordReset.associate = function(models) {
  PasswordReset.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

// Set up Reviews associations
Reviews.associate = function(models) {
  Reviews.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
  });
  Reviews.belongsTo(Estates, {
    foreignKey: 'estate_id',
    as: 'estate'
  });
};

// Create models object and automatically set up associations
const models = {
  User,
  Estates,
  Transactions,
  Favorites,
  PasswordReset,
  Reviews
};

// Initialize all associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Export models for easy access
module.exports = models;