/* eslint-disable node/no-unsupported-features/es-syntax */
const AppError = require('./../utils/appError');

//ТРАДИОННЫЙ МЕТОД С УСЛОВИЯМИ И РАЗНЫМИ ФУНКЦИЯМИ
//Обработка ошибок базы данных
/* const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
}; */

const handleErrors = {
  CastError: err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
  },
  11000: err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    return new AppError(message, 400);
  },
  ValidationError: err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
  },
  JsonWebTokenError: () =>
    new AppError('Invalid token. Please log in again.', 401),
  TokenExpiredError: () =>
    new AppError('Your token has expired. Please log in again.', 401),
  default: err => {
    return err;
  }
};

const sendErrorDev = (err, req, res) => {
  //Если обращение по api
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  //Если обращение с веб-сайта
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  });
};

//TODO сделать рефакторинг кода, убрать дублирование условий
const sendErrorProd = (err, req, res) => {
  //API
  if (req.originalUrl.startsWith('/api')) {
    //Если ошибка соединения или доступа к базе, или... то отправить сообщение клиенту
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
      //Если ошибка программная или в сторонних пакетах, то посылаем общее сообщение
    }
    //Отправка общего сообщения клиенту
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
  //RENDER
  const msg = err.isOperational ? err.message : 'Please try again later.';
  res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err };
    //Если есть code, значит это ошибка MongoDB и надо вместо имени взять код этой ошибки
    error.name = error.code || error.name || 'default';
    error.message = err.message;
    //Реализация объекта с обработчиками позволяет избежать условных конструкций
    //и упростить добавление новых хендлеров
    error = handleErrors[error.name](error);

    //ТРАДИЦИОННЫЙ МЕТОД С УСЛОВИЯМИ
    /* if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error); */

    sendErrorProd(error, req, res);
  }
};
