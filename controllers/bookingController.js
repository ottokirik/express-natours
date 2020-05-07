const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const {
  createOne,
  readOne,
  updateOne,
  deleteOne,
  readAll
} = require('./handlerFactory');
//const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const {
    params: { tourId },
    protocol,
    user: { email, id }
  } = req;

  const tour = await Tour.findById(tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${protocol}://${req.get(
      'host'
    )}/?tour=${tourId}&user=${id}&price=${tour.price}`,
    cancel_url: `${protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: email,
    client_reference_id: tourId,
    line_items: [
      {
        name: `${tour.name} Tour`,
        description: tour.summary,
        images: [],
        amount: tour.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });

  res.status(200).json({
    status: 'success',
    session
  });
});

// Используется, только для разработки, т.к. это небезопасно. В реальном проекте будем использовать stripe hooks
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  const {
    query: { tour, user, price }
  } = req;

  if (!tour && !user && !price) {
    return next();
  }

  await Booking.create({ tour, user, price });

  res.redirect(req.originalUrl.split('?')[0]);
});

exports.createBooking = createOne(Booking);
exports.getBooking = readOne(Booking);
exports.getAllBookings = readAll(Booking);
exports.updateBooking = updateOne(Booking);
exports.deleteBooking = deleteOne(Booking);
