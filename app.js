const path = require('path');
const express = require('express');
const morgan = require('morgan'); //Логирование запроса
const rateLimit = require('express-rate-limit'); //Лимитирование количества запросов с одного IP
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

//Настройка шаблонизатора, будем использовать pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//Статические файлы для которых нужен доступ
//app.use(express.static(`${__dirname}/public`));
app.use(express.static(path.join(__dirname, 'public')));

//MIDDLEWARES

// Установка security HTTP headers
app.use(helmet());

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

// Добавляет объект с данными к req, доступен в req.body
app.use(express.json({ limit: '10kb' })); //Ограничение размера данных отправляемых на сервер

//Парсинг значений из cookie, доступны в req.cookies
app.use(cookieParser());

//Очистка входных данных
app.use(mongoSanitize());

//Отсечка XSS атак
app.use(xss());

//HPP - http prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

//ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

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
