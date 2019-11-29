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

module.exports = app;
