/* eslint-disable */
import axios from 'axios';

import { showAlert, SUCCESS, ERROR } from './alerts';

export const UPDATE_PASSWORD = 'password';
export const UPDATE_DATA = 'data';

export const updateSettings = async (data, type) => {
  try {
    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${
        type === UPDATE_DATA ? 'update-me' : 'update-password'
      }`,
      data
    });

    if (res.data.status === SUCCESS) {
      showAlert(SUCCESS, 'Your settings was updated.');
    }
  } catch (error) {
    showAlert(ERROR, error.response.data.message);
  }
};
