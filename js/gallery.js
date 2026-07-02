// js/gallery.js
document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('gallery-grid');
    const emptyState = document.getElementById('gallery-empty');
    const errorState = document.getElementById('gallery-error');

    // Show skeleton loaders while fetching
    if (grid) {
        grid.innerHTML = Array(6).fill(`
      <div class="gallery-skeleton skeleton-pulse"></div>
    `).join('');
    }

    try {
        const archives = await nnnFetch('gallery_archives', 'order=created_at.desc');

        if (!archives || archives.length === 0) {
            if (grid) grid.style.display = 'none';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (grid) {
            // UI/UX PATCH — accordion strip from the 5 most recent covers,
            // then series-grouped rows below. series_name is optional on
            // existing rows — anything without one falls into "Recaps" so
            // nothing already in Supabase disappears from the page.
            const featured = archives.slice(0, 5);
            const groups = {};
            archives.forEach((item) => {
                const key = item.series_name || 'Recaps';
                if (!groups[key]) groups[key] = [];
                groups[key].push(item);
            });

            const accordionHtml = `
        <div class="accordion reveal-up" aria-label="Featured recaps">
          ${featured.map((item, i) => `
            <div class="accordion-panel${i === 0 ? ' is-active' : ''}">
              <img
                src="${escapeHtml(item.cover_image_url || '')}"
                alt="${escapeHtml(item.collection_title)}"
                loading="lazy"
                onerror="this.parentElement.style.background='var(--color-bg-raised)'; this.remove();"
              />
              <p class="accordion-panel__label">${escapeHtml(item.collection_title)}</p>
            </div>
          `).join('')}
        </div>
      `;

            const seriesHtml = Object.entries(groups).map(([seriesName, items]) => `
        <div class="gallery-series reveal-up">
          <p class="gallery-series__label">${escapeHtml(seriesName)}</p>
          <div class="gallery-series__row">
            ${items.map(item => `
              <a href="${escapeHtml(item.white_label_subdomain_url || '#')}"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="gallery-card"
                 aria-label="View ${escapeHtml(item.collection_title)} gallery">

                <img
                  src="${escapeHtml(item.cover_image_url || '')}"
                  alt="${escapeHtml(item.collection_title)} — ${escapeHtml(item.event_city || '')} ${escapeHtml(item.event_date_text || '')}"
                  width="240"
                  height="240"
                  loading="lazy"
                  class="gallery-card__img"
                  onerror="this.parentElement.classList.add('gallery-card--error')"
                />

                <div class="gallery-card__overlay">
                  <div class="gallery-card__label">
                    <p class="gallery-card__title">${escapeHtml(item.collection_title)}</p>
                    <p class="gallery-card__meta">${escapeHtml(item.event_city || '')} · ${escapeHtml(item.event_date_text || '')}</p>
                  </div>
                </div>

                <div class="gallery-card__hover">
                  <p class="gallery-card__hover-title">${escapeHtml(item.collection_title)}</p>
                  <p class="gallery-card__hover-meta">${escapeHtml(item.event_city || '')} · ${escapeHtml(item.event_date_text || '')}</p>
                  <span class="gallery-card__cta">View Gallery →</span>
                </div>
              </a>
            `).join('')}
          </div>
        </div>
      `).join('');

            grid.outerHTML = `
        <div id="gallery-grid">
          ${accordionHtml}
          ${seriesHtml}
        </div>
      `;

            // Re-run reveal + accordion wiring now that motion.js already
            // finished its initial pass before this async content existed
            if (window.NNN_initMotionFor) window.NNN_initMotionFor(document.getElementById('gallery-grid'));
        }

    } catch (err) {
        console.error('[NNN] Gallery error:', err.message);
        if (grid) grid.style.display = 'none';
        if (errorState) errorState.classList.remove('hidden');
    }
});

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}