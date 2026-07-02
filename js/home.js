// js/home.js
document.addEventListener('DOMContentLoaded', async () => {
  const heroHeadline = document.getElementById('hero-headline');
  const heroCta      = document.getElementById('hero-cta');
  const emailLinks   = document.querySelectorAll('.contact-email');
  const heroSection  = document.getElementById('hero-section');

  // Show loading state
  if (heroHeadline) heroHeadline.textContent = 'Never Not Nice.';

  try {
    const data = await nnnFetch('global_settings', 'limit=1');

    if (!data || data.length === 0) {
      console.warn('[NNN] global_settings returned no records');
      return;
    }

    const settings = data[0];

    // Inject hero headline
    if (heroHeadline && settings.hero_headline) {
      heroHeadline.textContent = settings.hero_headline;
    }

    // Inject CTA button
    if (heroCta) {
      if (settings.hero_cta_text)        heroCta.textContent = settings.hero_cta_text;
      if (settings.hero_cta_target_page) heroCta.href        = settings.hero_cta_target_page;
    }

    // Inject email into every .contact-email element on the page
    if (settings.company_email) {
      emailLinks.forEach(el => {
        el.textContent = settings.company_email;
        el.href        = `mailto:${settings.company_email}`;
      });
    }

  } catch (err) {
    console.error('[NNN] home.js fetch error:', err.message);
    // Fail silently — static fallback content already in HTML
    // Do not show a broken state to the user for hero content
  }
});
