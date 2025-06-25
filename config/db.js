const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

// Export the sequelize instance directly
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: console.log,
  }
);

// Test the connection, but don’t block export
sequelize.authenticate()
  .then(() => {
    console.log('Connected to the database!');
  })
  .catch(error => {
    console.error('Unable to connect to the database:', error);
  });

// Export
module.exports = sequelize;
