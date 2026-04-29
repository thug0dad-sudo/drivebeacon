const form = document.querySelector('#intake-form');
const status = document.querySelector('#form-status');

if (form && status) {
  status.textContent = 'This form submits through Formspree.';
}
