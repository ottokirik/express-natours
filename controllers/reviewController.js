const Review = require('../models/reviewModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  const {
    body: { review, rating },
    user
  } = req;
  const newReview = await Review.create({
    review,
    rating,
    user: user.id
  });
  res.status(201).json({
    status: 'success',
    data: {
      review: newReview
    }
  });
});
