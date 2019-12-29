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
  default: err => err
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  //Если ошибка соединения или доступа к базе, или... то отправить сообщение клиенту
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });

    //Если ошибка программная или в сторонних пакетах, то посылаем общее сообщение
  } else {
    //Логирование ошибки
    console.error('ERROR: ', err);
    //Отправка общего сообщения клиенту
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    //Если есть code, значит это ошибка MongoDB и надо вместо имени взять код этой ошибки
    error.name = error.code || error.name || 'default';
    //Реализация объекта с обработчиками позволяет избежать условных конструкций
    //и упростить добавление новых хендлеров
    error = handleErrors[error.name](error);

    //ТРАДИЦИОННЫЙ МЕТОД С УСЛОВИЯМИ
    /* if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error); */

    sendErrorProd(error, res);
  }
};
