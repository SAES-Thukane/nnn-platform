// js/events.js
document.addEventListener('DOMContentLoaded', async () => {

  // ── UI element references ──────────────────────────────────
  const ipGrid          = document.getElementById('ip-grid');
  const ipError         = document.getElementById('ip-error');
  const countdownSection = document.getElementById('countdown-section');
  const countdownName   = document.getElementById('countdown-event-name');
  const calendarEl      = document.getElementById('events-list');
  const calendarError   = document.getElementById('calendar-error');
  const calendarEmpty   = document.getElementById('calendar-empty');

  // ── Helper: format date for display ───────────────────────
  const formatDate = isoString => new Date(isoString).toLocaleDateString('en-ZA', {
    weekday: 'short', year: 'numeric', month: 'long', day: 'numeric'
  });
  const formatTime = isoString => new Date(isoString).toLocaleTimeString('en-ZA', {
    hour: '2-digit', minute: '2-digit'
  });

  // ── 1. Load Sub-Brand IP Grid ──────────────────────────────
  try {
    if (ipGrid) ipGrid.innerHTML = buildSkeletons(2, 'ip-skeleton');

    const ips = await nnnFetch('intellectual_properties', 'order=created_at.asc');

    if (!ips || ips.length === 0) {
      if (ipGrid) ipGrid.innerHTML = '';
      return;
    }

    if (ipGrid) {
      ipGrid.innerHTML = ips.map(ip => `
        <article class="ip-card ${ip.is_active_campaign ? 'ip-card--active' : ''}">
          <div class="ip-card__header">
            <h3 class="ip-card__name">${escapeHtml(ip.ip_name)}</h3>
            ${ip.badge_status
              ? `<span class="ip-card__badge">${escapeHtml(ip.badge_status)}</span>`
              : ''}
          </div>
          ${ip.tagline
            ? `<p class="ip-card__tagline">${escapeHtml(ip.tagline)}</p>`
            : ''}
          ${ip.description
            ? `<p class="ip-card__desc">${escapeHtml(ip.description)}</p>`
            : ''}
        </article>
      `).join('');
    }

  } catch (err) {
    console.error('[NNN] IP grid error:', err.message);
    if (ipGrid)  ipGrid.innerHTML  = '';
    if (ipError) ipError.classList.remove('hidden');
  }

  // ── 2. Countdown — next non-sold-out event ─────────────────
  try {
    const upcoming = await nnnFetch(
      'events_calendar',
      'ticket_status=neq.Sold Out&order=event_date.asc&limit=1'
    );

    if (upcoming && upcoming.length > 0) {
      const next = upcoming[0];
      if (countdownName) countdownName.textContent = next.event_name;
      startCountdown(next.event_date, 'countdown-timer');
    } else {
      if (countdownSection) countdownSection.hidden = true;
    }
  } catch (err) {
    console.error('[NNN] Countdown error:', err.message);
    if (countdownSection) countdownSection.hidden = true;
  }

  // ── 3. Live Events Calendar ────────────────────────────────
  try {
    if (calendarEl) calendarEl.innerHTML = buildSkeletons(3, 'event-skeleton');

    const allEvents = await nnnFetch('events_calendar', 'order=event_date.asc');

    if (!allEvents || allEvents.length === 0) {
      if (calendarEl)    calendarEl.innerHTML = '';
      if (calendarEmpty) calendarEmpty.classList.remove('hidden');
      return;
    }

    if (calendarEl) {
      calendarEl.innerHTML = allEvents.map(evt => {
        const isSoldOut   = evt.ticket_status === 'Sold Out';
        const isUpcoming  = evt.ticket_status === 'Upcoming';
        const isAvailable = evt.ticket_status === 'Available';

        let actionHtml = '';
        if (isSoldOut) {
          actionHtml = `<span class="event-row__badge event-row__badge--soldout">Sold Out</span>`;
        } else if (isUpcoming) {
          actionHtml = `<span class="event-row__badge event-row__badge--upcoming">Coming Soon</span>`;
        } else if (isAvailable && evt.ticket_redirect_url) {
          actionHtml = `
            <a href="${escapeHtml(evt.ticket_redirect_url)}"
               target="_blank"
               rel="noopener noreferrer"
               class="event-row__btn">
              Get Tickets →
            </a>`;
        }

        return `
          <div class="event-row" role="listitem">
            <div class="event-row__info">
              <p class="event-row__name">${escapeHtml(evt.event_name)}</p>
              <p class="event-row__meta">${formatDate(evt.event_date)} · ${formatTime(evt.event_date)}</p>
              <p class="event-row__venue">${escapeHtml(evt.venue)} · ${escapeHtml(evt.city)}</p>
            </div>
            <div class="event-row__action">${actionHtml}</div>
          </div>`;
      }).join('');
    }

  } catch (err) {
    console.error('[NNN] Calendar error:', err.message);
    if (calendarEl)    calendarEl.innerHTML = '';
    if (calendarError) calendarError.classList.remove('hidden');
  }
});

// ── Utility: XSS protection ────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Utility: skeleton loader HTML ─────────────────────────
function buildSkeletons(count, cls) {
  return Array(count).fill(`<div class="${cls} skeleton-pulse"></div>`).join('');
}
