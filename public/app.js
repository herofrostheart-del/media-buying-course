// Client-side JS: modal behavior, timezone detection, form submission
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('modal');
  const enrollBtns = [document.getElementById('enrollBtn'), document.getElementById('enrollBtn2')].filter(Boolean);
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  const applyForm = document.getElementById('applyForm');
  const formMessage = document.getElementById('formMessage');
  const timezoneInput = document.getElementById('timezone');

  function openModal() { modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow='hidden'; }
  function hideModal() { modal.setAttribute('aria-hidden', 'true'); document.body.style.overflow='auto'; }

  enrollBtns.forEach(b=>b.addEventListener('click', openModal));
  closeModal.addEventListener('click', hideModal);
  cancelBtn.addEventListener('click', hideModal);

  // Detect timezone
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    timezoneInput.value = tz;
  } catch (e) {
    timezoneInput.value = '';
  }

  applyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formMessage.textContent = '';
    const data = {};
    data.name = document.getElementById('name').value.trim();
    data.email = document.getElementById('email').value.trim();
    data.phone = document.getElementById('phone').value.trim();
    data.experience = document.getElementById('experience').value;
    data.goals = document.getElementById('goals').value.trim();

    // platforms
    const platforms = Array.from(document.querySelectorAll('input[name="platforms"]:checked')).map(i => i.value);
    data.platforms = platforms;

    // preferred times
    const preferred = Array.from(document.querySelectorAll('input[name="preferred_times"]:checked')).map(i => i.value);
    data.preferred_times = preferred;

    data.timezone = timezoneInput.value || '';
    data.consent = document.getElementById('consent').checked;

    // Basic validation
    if (!data.name || !data.email || !data.consent) {
      formMessage.textContent = 'Please fill required fields and accept consent.';
      return;
    }

    const submitBtn = applyForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      const resp = await fetch('/api/apply', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(data)
      });
      const json = await resp.json();
      if (json.ok) {
        formMessage.style.color = '#8fffdc';
        formMessage.textContent = 'Application submitted! Check your email for confirmation.';
        applyForm.reset();
        // keep timezone value
        try { timezoneInput.value = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch {}
        setTimeout(() => hideModal(), 1400);
      } else {
        formMessage.style.color = '#ffb3b3';
        formMessage.textContent = json.error || 'Submission failed.';
      }
    } catch (err) {
      formMessage.style.color = '#ffb3b3';
      formMessage.textContent = 'Network error. Please try again later.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Application';
    }
  });
});