/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings, UPDATE_PASSWORD, UPDATE_DATA } from './updateSettings';
import { bookTour } from './stripe';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('#login-form');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserForm = document.querySelector('#update-user-form');
const updatePasswordForm = document.querySelector('#update-password-form');
const bookBtn = document.querySelector('#book-tour');

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', event => {
    event.preventDefault();
    logout();
  });
}

if (updateUserForm) {
  updateUserForm.addEventListener('submit', async event => {
    const btn = document.querySelector('#btn--save-data');
    btn.textContent = 'Updating...';

    event.preventDefault();

    const form = new FormData();
    form.append('name', document.querySelector('#name').value);
    form.append('email', document.querySelector('#email').value);
    form.append('photo', document.querySelector('#photo').files[0]);

    await updateSettings(form, UPDATE_DATA);

    window.location.reload(true);

    btn.textContent = 'Save settings';
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener('submit', async event => {
    const btn = document.querySelector('#btn--save-password');
    btn.textContent = 'Updating...';

    event.preventDefault();
    const passwordCurrent = document.querySelector('#password-current').value;
    const password = document.querySelector('#password').value;
    const passwordConfirm = document.querySelector('#password-confirm').value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      UPDATE_PASSWORD
    );
    btn.textContent = 'Save Password';
    updatePasswordForm.reset();
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', event => {
    event.target.textContent = 'Processing...';
    const { tourId } = event.target.dataset;
    bookTour(tourId);
  });
}
