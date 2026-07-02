// js/home.js
document.addEventListener('DOMContentLoaded', async () => {
    const heroHeadline = document.getElementById('hero-headline');
    const heroSubheadline = document.getElementById('hero-subheadline');
    const heroCta = document.getElementById('hero-cta');
    const emailLinks = document.querySelectorAll('.contact-email');
    const heroSection = document.getElementById('hero-section');

    // Show loading state
    if (heroHeadline) heroHeadline.textContent = 'Never Not Nice.';

    // UI/UX PATCH — hero_headline still stores one full string in Supabase
    // (no schema change needed). This just splits it at the first sentence
    // break so the wordmark and tagline can render at different sizes.
    // If there's no period, the whole string stays as the big wordmark line
    // and the tagline is simply left empty — never breaks either way.
    function splitHeadline(fullText) {
        const match = fullText.match(/^(.*?[.!?])\s*(.*)$/);
        if (!match) return { wordmark: fullText, tagline: '' };
        return { wordmark: match[1].trim(), tagline: match[2].trim() };
    }

    try {
        const data = await nnnFetch('global_settings', 'limit=1');

        if (!data || data.length === 0) {
            console.warn('[NNN] global_settings returned no records');
            return;
        }

        const settings = data[0];

        // Inject hero headline — split into wordmark + tagline
        if (heroHeadline && settings.hero_headline) {
            const { wordmark, tagline } = splitHeadline(settings.hero_headline);
            heroHeadline.textContent = wordmark;
            if (heroSubheadline) heroSubheadline.textContent = tagline;
        }

        // Inject CTA button
        if (heroCta) {
            if (settings.hero_cta_text) heroCta.textContent = settings.hero_cta_text;
            if (settings.hero_cta_target_page) heroCta.href = settings.hero_cta_target_page;
        }

        // Inject email into every .contact-email element on the page
        if (settings.company_email) {
            emailLinks.forEach(el => {
                el.textContent = settings.company_email;
                el.href = `mailto:${settings.company_email}`;
            });
        }

    } catch (err) {
        console.error('[NNN] home.js fetch error:', err.message);
        // Fail silently — static fallback content already in HTML
        // Do not show a broken state to the user for hero content
    }
});