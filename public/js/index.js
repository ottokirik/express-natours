/* eslint-disable */
import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings, UPDATE_PASSWORD, UPDATE_DATA } from './updateSettings';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('#login-form');
const logoutBtn = document.querySelector('.nav__el--logout');
const updateUserForm = document.querySelector('#update-user-form');
const updatePasswordForm = document.querySelector('#update-password-form');

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
    const name = document.querySelector('#name').value;
    const email = document.querySelector('#email').value;
    await updateSettings({ name, email }, UPDATE_DATA);
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
