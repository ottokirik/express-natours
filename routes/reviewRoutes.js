const express = require('express');

const {
  getAllReviews,
  createReview
} = require('../controllers/reviewController');

const { protect, restrictTo } = require('../controllers/authController');

// mergeParams нужен для доступа к параметрам при вложенных маршрутах
// GET /tours/:tourId/reviews - без этого флага не будет доступа к :tourId
const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(getAllReviews)
  .post(protect, restrictTo('user'), createReview);

module.exports = router;
