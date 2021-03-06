const multer = require('multer');
const sharp = require('sharp');

const Tour = require('./../models/tourModel');
//const APIFeatures = require('./../utils/apiFeatures');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const {
  createOne,
  readOne,
  updateOne,
  deleteOne,
  readAll
} = require('./handlerFactory');

exports.getAllTours = readAll(Tour);
exports.createTour = createOne(Tour);
exports.getTour = readOne(Tour, { path: 'reviews' });
exports.updateTour = updateOne(Tour);
exports.deleteTour = deleteOne(Tour);

//Загрузка фотографий
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

//Фото будут в req.files
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 3 }
]);

//Если надо загрузить несколько фотографий, без поля с одной фотографией, то можно:
//upload.array('images', 5);

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  const {
    files: { imageCover, images }
  } = req;

  if (!imageCover || !images) {
    return next();
  }

  const imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${imageCoverFilename}`);

  //Для доступа при сохранении в БД в миддлваре updateOne
  req.body.imageCover = imageCoverFilename;

  req.body.images = [];
  //Функция асинк возвращает промисы, map создаст новый массив промисов, дождемся всех выполнения всех промисов с помощью Promise.all
  await Promise.all(
    images.map(async (file, idx) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${idx + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);

      req.body.images.push(filename);
    })
  );

  next();
});

// Использование pipelines MongoDB, aggregation
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: '$difficulty',
        numTours: { $sum: 1 }, //Количество документов
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats
    }
  });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = Number(req.params.year); // 2021

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' //Разбивает документ на документы по переданному массиву
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: { month: '$_id' }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: { numTourStarts: -1 }
    },
    {
      $limit: 12
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// /tours-within/:distance/cenetr/:latlng/unit/:unit
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const {
    params: { distance, latlng, unit }
  } = req;
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng.',
        400
      )
    );
  }

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});

exports.getDistances = catchAsync(async (req, res, next) => {
  const {
    params: { latlng, unit }
  } = req;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      // Всегда должен быть первым
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1]
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});
