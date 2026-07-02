// js/countdown.js
// Reusable countdown clock.
// Call: startCountdown('2025-08-01T20:00:00+02:00', 'countdown-timer')

function startCountdown(isoDateString, elementId) {
  const targetDate = new Date(isoDateString).getTime();
  const el = document.getElementById(elementId);
  if (!el) return;

  // Validate the date is real
  if (isNaN(targetDate)) {
    el.innerHTML = `<span class="countdown__error">Invalid date</span>`;
    return;
  }

  const pad = n => String(n).padStart(2, '0');

  const tick = () => {
    const diff = targetDate - Date.now();

    if (diff <= 0) {
      el.innerHTML = `
        <div class="countdown__live">
          <span class="countdown__live-dot"></span>
          Event is Live
        </div>`;
      return;
    }

    const days    = Math.floor(diff / 86400000);
    const hours   = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    el.innerHTML = `
      <div class="countdown__clock">
        <div class="countdown__unit">
          <span class="countdown__num">${pad(days)}</span>
          <span class="countdown__label">Days</span>
        </div>
        <span class="countdown__sep">:</span>
        <div class="countdown__unit">
          <span class="countdown__num">${pad(hours)}</span>
          <span class="countdown__label">Hrs</span>
        </div>
        <span class="countdown__sep">:</span>
        <div class="countdown__unit">
          <span class="countdown__num">${pad(minutes)}</span>
          <span class="countdown__label">Min</span>
        </div>
        <span class="countdown__sep">:</span>
        <div class="countdown__unit">
          <span class="countdown__num">${pad(seconds)}</span>
          <span class="countdown__label">Sec</span>
        </div>
      </div>`;

    setTimeout(tick, 1000);
  };

  tick();
}
