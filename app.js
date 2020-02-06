const express = require('express');
const morgan = require('morgan'); //Логирование запроса
const rateLimit = require('express-rate-limit'); //Лимитирование количества запросов с одного IP

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

//MIDDLEWARES

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//Разрешено 100 запросов в час с одного IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});

app.use('/api', limiter);
app.use(express.json()); // Добавляет объект к req, доступен в req.body
app.use(express.static(`${__dirname}/public`)); //Статические файлы для которых нужен доступ

//ROUTES

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

//Обработка неопределенных URL
app.all('*', (req, res, next) => {
  const err = new AppError(
    `Can't find ${req.originalUrl} on this server.`,
    404
  );

  next(err);
});

app.use(globalErrorHandler);

module.exports = app;
