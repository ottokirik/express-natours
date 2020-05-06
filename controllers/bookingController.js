const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
//const AppError = require('../utils/appError');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  const {
    params: { tourId },
    protocol,
    user: { email }
  } = req;

  const tour = await Tour.findById(tourId);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${protocol}://${req.get('host')}/`,
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
