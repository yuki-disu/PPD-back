const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const AppError = require('../utilities/appError');
const catchAsync = require('../utilities/catchAsync');
const { estateSchema } = require('../Validators/estateValidator');
const User = require('./userModel');

const Estates = sequelize.define('estates', {
  id: {
    type: DataTypes.UUID,
    allowNull: false,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  owner_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('studio', 'apartment', 'house'),
    allowNull: false,
  },
  numOfRooms: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  numOfBathroom: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  numOfKitchen: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  garageCapacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  area: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('available', 'sold', 'rented'),
    allowNull: true,
    defaultValue: 'available',
  },
  for_rent: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  imageCover: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  images: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: DataTypes.NOW,
  },
  sold: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  rented: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  visibleHouse: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
  },
  centralHeating: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  alarmsAndSecurity: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  fireDetector: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  camera: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  parking: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  electricity: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  gaz: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  closeToTransportation: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  closeToBeach: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  natureView: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  elevator: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  cleaning: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  petsAllowed: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  tv: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  dishwasher: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  washingMachine: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  wifi: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  water: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  microwave: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  fridge: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  closeToSchool: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  closeToSupermarket: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  garden: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  balcony: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
}, {
  tableName: 'estates',
  timestamps: false,
  hooks: {
    afterFind: (results) => {
      if (!results) return;
      
      const parseImages = (estate) => {
        if (estate?.images && typeof estate.images === 'string') {
          estate.images = JSON.parse(estate.images);
        }
        return estate;
      };

      if (Array.isArray(results)) {
        results.forEach(parseImages);
      } else {
        parseImages(results);
      }
    },
  },
});


// We don't import Transactions here anymore to avoid circular dependencies

module.exports = Estates;