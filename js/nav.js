// js/nav.js
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('nav-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const nav = document.getElementById('main-nav');

    // ── Mobile hamburger toggle ────────────────────────────────
    if (btn && mobileMenu) {
        btn.addEventListener('click', () => {
            const isOpen = !mobileMenu.classList.contains('hidden');
            mobileMenu.classList.toggle('hidden', isOpen);
            btn.setAttribute('aria-expanded', String(!isOpen));
            // UI/UX PATCH — lock background scroll while menu is open,
            // to stop scroll fighting/mistouches on the panel underneath
            document.body.classList.toggle('nav-open', !isOpen);
        });

        // Close when any link inside is tapped
        // Critical for Instagram and TikTok in-app browsers
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                btn.setAttribute('aria-expanded', 'false');
                document.body.classList.remove('nav-open');
            });
        });
    }

    // ── Sticky nav: transparent → solid on scroll ──────────────
    if (nav) {
        const onScroll = () => {
            if (window.scrollY > 40) {
                nav.classList.add('nav--scrolled');
            } else {
                nav.classList.remove('nav--scrolled');
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // run once on load
    }

    // ── Active nav link highlighting ───────────────────────────
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (
            href === currentPage ||
            (currentPage === '' && href === 'index.html') ||
            (currentPage === 'index.html' && href === 'index.html')
        ) {
            link.classList.add('nav-link--active');
            link.setAttribute('aria-current', 'page');
        }
    });
});