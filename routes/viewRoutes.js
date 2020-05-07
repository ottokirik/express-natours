const express = require('express');

const router = express.Router();

const {
  getOverview,
  getTour,
  getLoginForm,
  getAccount,
  getMyTours
} = require('../controllers/viewsController');

const { createBookingCheckout } = require('../controllers/bookingController');

const { isLoggedIn, protect } = require('../controllers/authController');

router.get('/', createBookingCheckout, isLoggedIn, getOverview);
router.get('/tour/:slug', isLoggedIn, getTour);
router.get('/login', isLoggedIn, getLoginForm);
router.get('/me', protect, getAccount);
router.get('/my-tours', protect, getMyTours);

module.exports = router;
