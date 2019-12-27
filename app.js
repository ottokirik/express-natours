const express = require('express');
const morgan = require('morgan'); //Логирование запроса

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//MIDDLEWARES

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json()); // Добавляет объект к req, доступен в req.body
app.use(express.static(`${__dirname}/public`)); //Статические файлы для которых нужен доступ

//ROUTES

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//Обработка неопределенных URL
app.all('*', (req, res, next) => {
  /* res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server.`
  }); */

  const err = new Error(`Can't find ${req.originalUrl} on this server.`);
  err.status = 'fail';
  err.statusCode = 404;

  next(err);
});

app.use((err, req, res, next) => {
  const { statusCode } = err || 500;
  const { status } = err || 'error';
  const { message } = err;

  res.status(statusCode).json({
    status,
    message
  });
});

module.exports = app;
