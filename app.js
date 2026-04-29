const form = document.querySelector('#intake-form');
const status = document.querySelector('#form-status');

const apiBase = window.DRIVEBEACON_API_BASE || '';

function setStatus(message, kind = 'info') {
  if (!status) return;
  status.textContent = message;
  status.dataset.kind = kind;
}

if (form) {
  if (!apiBase) {
    setStatus('Investor intake backend is not connected yet.', 'info');
    form.querySelector('button')?.setAttribute('disabled', 'true');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!apiBase) {
      setStatus('Backend not connected yet. Deploy the API and set DRIVEBEACON_API_BASE.', 'error');
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    setStatus('Sending...', 'info');

    try {
      const response = await fetch(`${apiBase}/api/intake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Submission failed');

      form.reset();
      setStatus('Thanks — your interest has been saved.', 'success');
    } catch (error) {
      setStatus(`Could not save the form yet. ${error.message}`, 'error');
    }
  });
}
