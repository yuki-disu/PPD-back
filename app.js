const express = require('express');
const morgan = require('morgan');

const AppError = require('./utilities/appError');
const db = require("./config/db")


const estateRouter = require("./Routes/estateRoutes");
const userRouter = require('./Routes/userRoutes');
const transactionRouter = require('./Routes/transactionRoutes');
const favoriteRouter = require('./Routes/favoriteRoutes');

const globaleErrorHandler = require('./Controllers/errorController');


const cors = require('cors');
const app = express();

//1)Global middlewares
// Security HTTP headers

// development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//limit request from same api

// Body parser, reading data form body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against XSS


//prevent parameter pollution


//Serving static file
app.use(express.static(`${__dirname}/public`));


app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT","PATCH", "DELETE"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
}));
//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);

  next();
});

// routes
app.use('/api/v1/houses',estateRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/favorites', favoriteRouter);
// Handle undefined routes


app.all('*', (req, res, next) => {
  res.status(404).json({
      status: 'fail',
      message: `Cant find ${req.originalUrl} on this server`
  });
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globaleErrorHandler);

module.exports = app;
