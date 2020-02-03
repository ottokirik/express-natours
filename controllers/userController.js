const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

const filterObj = (obj, ...allowedFields) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (allowedFields.includes(key)) {
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      return { ...acc, [key]: obj[key] };
    }
    return acc;
  }, {});
};

exports.getAllUsers = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};

//Редактирование текущего пользователя
exports.updateMe = catchAsync(async (req, res, next) => {
  // Если пользователь пытается обновить пароль, то выдать ошибку
  const {
    body: { password, passwordConfirm }
  } = req;
  if (password || passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use //update-password.',
        400
      )
    );
  }

  const {
    user: { id }
  } = req;

  const filteredBody = filterObj(req.body, 'name', 'email');
  const updatedUser = await User.findByIdAndUpdate(id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});
