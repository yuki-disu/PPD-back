const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');
const mysql = require('mysql2');
const appError = require('./utilities/appError');


process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION , shuting down...');
  console.log(err);
  process.exit(1);
});



const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});



process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION , shuting down...');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});
