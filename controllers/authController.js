const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN //Время жизни токена
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined; //Не отправляем пароль пользователю при создании

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const {
    body: { name, email, password, passwordConfirm, role }
  } = req;

  const user = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role
  });

  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const {
    body: { email, password }
  } = req;

  //Проверить введены ли почта и пароль
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  //Найти пользователя по почте
  const user = await User.findOne({ email }).select('+password'); //Выбор поля, которое помечено как select: false

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    //Время жизни токена 10 секунд
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ status: 'success' });
};

//Проверяет в ситсеме пользователь или нет
exports.protect = catchAsync(async (req, res, next) => {
  //Токен призодит в хедере в виде строки 'Bearer token...'
  const {
    headers: { authorization }
  } = req;

  //Проверка, автризован ли пользователь
  if (
    (!authorization || !authorization.startsWith('Bearer')) &&
    !req.cookies.jwt
  ) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  //Получение токена
  const token = authorization ? authorization.split(' ')[1] : req.cookies.jwt;

  //Получение id пользователя из токена
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const { id, iat } = decoded;

  //Проверка, существует ли пользователь. Если пользователь удалил учетную запись, а токен еще действует.
  const user = await User.findById(id);

  if (!user) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }
  //Проверка, не менял ли пользователь пароль после полученя токена
  if (user.changedPasswordAfter(iat)) {
    return next(new AppError('Please log in again.', 401));
  }

  //У пользователя есть права на доступ к ресурсу
  req.user = user;
  res.locals.user = user;
  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );
      const { id, iat } = decoded;

      //Проверка, существует ли пользователь. Если пользователь удалил учетную запись, а токен еще действует.
      const user = await User.findById(id);

      if (!user) {
        return next();
      }
      //Проверка, не менял ли пользователь пароль после полученя токена
      if (user.changedPasswordAfter(iat)) {
        return next();
      }

      //user будет доступен в шаблонах pug, например в нашем случае в шаблоне _header.pug
      res.locals.user = user;
      return next();
    } catch (error) {
      return next();
    }
  }

  next();
};

//Проверяет, разрешен ли доступ к маршруту на основе переданных ролей
exports.restrictTo = (...roles) => (req, res, next) => {
  //example: roles = ['admin', 'lead-guide']
  //т.к. перед этой миддлварой запускалась миддлвара protect, то в req теперь есть user
  const {
    user: { role }
  } = req;

  if (!roles.includes(role)) {
    return next(
      new AppError('You do not have permission to perform this action', 403)
    );
  }

  next();
};

//Сброс пароля
exports.forgotPassword = async (req, res, next) => {
  const {
    body: { email }
  } = req;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  const resetToken = user.createPasswordResetToken();

  user.save({ validateBeforeSave: false }); //Отключить валидацию, т.к. пользователь не вводит пароль

  const { protocol } = req;
  const resetURL = `${protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
};

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Найти пользователя по отправленному ему на почту токену
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // Если пользователь найден и токен не просрочен, то установить новый пароль для пользователя
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  const {
    body: { password, passwordConfirm }
  } = req;

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  // Обновить поле passwordChangedAt для проверки корректности JWT. Реализовано в middleware в модели
  // Отправить корректный JWT пользователю
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const {
    user: { id },
    body: { passwordConfirm, password, passwordCurrent }
  } = req;

  const user = await User.findById(id).select('+password');

  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong.', 401));
  }

  user.password = password;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
