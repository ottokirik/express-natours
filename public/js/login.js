/* eslint-disable */
import axios from 'axios';

import { showAlert, SUCCESS, ERROR } from './alerts';

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/v1/users/login',
      data: { email, password }
    });

    if (res.data.status === SUCCESS) {
      showAlert(SUCCESS, 'Logged in successfully');
      window.location.assign('/');
    }
  } catch (error) {
    showAlert(ERROR, error.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://localhost:3000/api/v1/users/logout'
    });

    if (res.data.status === SUCCESS) {
      showAlert(SUCCESS, 'Logged out successfully');
      window.location.reload(true);
    }
  } catch (error) {
    showAlert(ERROR, 'Error logging out. Try again.');
  }
};
