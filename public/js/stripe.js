import axios from 'axios';
import { showAlert } from './alerts';

/* eslint-disable */
const stripe = Stripe('pk_test_QoMAtixmjD2vUjpqK6988AGP');

export const bookTour = async tourId => {
  try {
    const session = await axios(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (error) {
    showAlert('error', error);
  }
};
