const multer = require('multer');
const sharp = require('sharp');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const { readOne, readAll, updateOne, deleteOne } = require('./handlerFactory');

//Пакет для загрузки файлов
/* const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/img/users');
  },
  filename: (req, file, cb) => {
    const { mimetype } = file;
    const {
      user: { id }
    } = req;
    const ext = mimetype.split('/')[1];
    cb(null, `user-${id}-${Date.now()}.${ext}`);
  }
}); */
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    return cb(
      new AppError('Not an image. Please upload only images.', 400),
      false
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  const { file } = req;
  if (!file) return next();

  const {
    user: { id }
  } = req;

  //Сохраняем имя файла в req, чтобы было можно сохранить в миддлваре updateMe
  req.file.filename = `user-${id}-${Date.now()}.jpg`;

  //Multer сохраняет фото в память, доступ через буфер
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...allowedFields) => {
  return Object.keys(obj).reduce((acc, key) => {
    if (allowedFields.includes(key)) {
      // eslint-disable-next-line node/no-unsupported-features/es-syntax
      return { ...acc, [key]: obj[key] };
    }
    return acc;
  }, {});
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead.'
  });
};

exports.getAllUsers = readAll(User);
exports.getUser = readOne(User);
exports.updateUser = updateOne(User);
exports.deleteUser = deleteOne(User);

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
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
  if (req.file) filteredBody.photo = req.file.filename;

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

exports.deleteMe = catchAsync(async (req, res, next) => {
  const {
    user: { id }
  } = req;

  await User.findByIdAndUpdate(id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null
  });
});
