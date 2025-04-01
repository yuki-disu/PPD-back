const express = require('express');
const morgan = require('morgan');
const estateRouter = require("./Routes/estateRoute");
const AppError = require('./utilities/appError');
// const houseRouter = require('./Routes/houseRouts');
const userRouter = require('./Routes/userRoutes');
const globaleErrorHandler = require('./Controllers/errorController');

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

//Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);

  next();
});

// routes
app.use('/api/v1/houses',estateRouter);
app.use('/api/v1/users', userRouter);


// app.use('/api/v1/houses', houseRouter);

app.all('*', (req, res, next) => {
  res.status(404).json({
      status: 'fail',
      message: `Cant find ${req.originalUrl} on this server`
  });
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globaleErrorHandler);

module.exports = app;
