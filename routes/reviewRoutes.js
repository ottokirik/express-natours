const express = require('express');

const {
  getAllReviews,
  getReview,
  createReview,
  deleteReview,
  updateReview,
  setTourUserIds,
  setTourId
} = require('../controllers/reviewController');

const { protect, restrictTo } = require('../controllers/authController');

// mergeParams нужен для доступа к параметрам при вложенных маршрутах
// GET /tours/:tourId/reviews - без этого флага не будет доступа к :tourId
const router = express.Router({ mergeParams: true });

router.use(protect);

router
  .route('/')
  .get(setTourId, getAllReviews)
  .post(restrictTo('user'), setTourUserIds, createReview);

router
  .route('/:id')
  .get(getReview)
  .patch(restrictTo('user', 'admin'), updateReview)
  .delete(restrictTo('user', 'admin'), deleteReview);

module.exports = router;
