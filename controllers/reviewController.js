const Review = require('../models/reviewModel');
//const catchAsync = require('../utils/catchAsync');
const {
  readOne,
  createOne,
  updateOne,
  deleteOne,
  readAll
} = require('./handlerFactory');

exports.setTourId = (req, res, next) => {
  req.filter = {};
  if (req.params.tourId) {
    req.filter = {
      tour: req.params.tourId
    };
  }
  next();
};

exports.getAllReviews = readAll(Review);

//Миддлвара, вызывается перед createReview, т.к. необходимы tourId и userId
exports.setTourUserIds = (req, res, next) => {
  // Условия позволяют задавать пользователя и тур вручную
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = createOne(Review);
exports.getReview = readOne(Review);
exports.updateReview = updateOne(Review);
exports.deleteReview = deleteOne(Review);
