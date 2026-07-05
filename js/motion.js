// js/motion.js
// ─────────────────────────────────────────────────────────────
// Loads AFTER config.js + nav.js on every page that wants motion.
// Three responsibilities:
//   1. Lazy-load Lenis smooth-scroll — DESKTOP ONLY. On mobile the
//      <script> tag is never even requested, so there's zero cost
//      to the in-app-browser audience this site actually lives in.
//   2. IntersectionObserver-based reveal-up animation — cheap,
//      works everywhere, runs on every viewport.
//   3. Vertical-slice accordion — hover-driven on desktop,
//      tap-to-expand on mobile (hover doesn't really exist there).
// ─────────────────────────────────────────────────────────────

(function () {
    // UI/UX PATCH — this MUST be the very first thing that runs, before
    // anything that could possibly throw. It's what tells globals.css
    // "JS is alive, safe to hide content pending reveal." If this line
    // runs, reveal-up content is guaranteed to eventually become visible
    // via the observer below — nothing after this point can prevent that
    // by throwing, because each feature is now independently try/caught.
    document.documentElement.classList.add('js-reveal-ready');

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;

    // ── 1. Lenis — desktop only, lazily injected ──────────────────
    try {
        if (isDesktop && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
            script.onload = () => {
                try {
                    if (typeof Lenis === 'undefined') return;
                    const lenis = new Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 3) });
                    function raf(time) {
                        lenis.raf(time);
                        requestAnimationFrame(raf);
                    }
                    requestAnimationFrame(raf);
                } catch (err) {
                    console.error('[NNN motion.js] Lenis init failed:', err);
                }
            };
            document.head.appendChild(script);
        }
    } catch (err) {
        console.error('[NNN motion.js] Lenis setup failed:', err);
    }

    // ── 2 & 3. Reveal + accordion wiring — reusable, since content
    // fetched asynchronously (e.g. gallery.js's series rows) doesn't
    // exist yet on the first pass at DOMContentLoaded. ──────────────
    function initMotionFor(root) {
        root = root || document;

        // Scroll reveals
        try {
            const revealEls = root.querySelectorAll('.reveal-up:not(.is-visible)');
            if (revealEls.length && 'IntersectionObserver' in window) {
                const observer = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting) {
                                entry.target.classList.add('is-visible');
                                observer.unobserve(entry.target);
                            }
                        });
                    },
                    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
                );
                revealEls.forEach((el) => observer.observe(el));
            } else {
                revealEls.forEach((el) => el.classList.add('is-visible'));
            }
        } catch (err) {
            console.error('[NNN motion.js] Reveal-up setup failed:', err);
            // Safety net: if the observer itself throws, force everything
            // visible immediately rather than risk it staying hidden
            root.querySelectorAll('.reveal-up:not(.is-visible)').forEach((el) => el.classList.add('is-visible'));
        }

        // Vertical-slice accordion
        try {
            root.querySelectorAll('.accordion').forEach((accordion) => {
                if (accordion.dataset.motionBound === 'true') return;
                accordion.dataset.motionBound = 'true';
                const panels = accordion.querySelectorAll('.accordion-panel');
                if (!panels.length) return;

                if (isDesktop) {
                    panels.forEach((panel) => {
                        panel.addEventListener('mouseenter', () => {
                            panels.forEach((p) => p.classList.remove('is-active'));
                            panel.classList.add('is-active');
                        });
                    });
                    accordion.addEventListener('mouseleave', () => {
                        panels.forEach((p) => p.classList.remove('is-active'));
                    });
                } else {
                    panels.forEach((panel) => {
                        panel.addEventListener('click', () => {
                            const wasActive = panel.classList.contains('is-active');
                            panels.forEach((p) => p.classList.remove('is-active'));
                            if (!wasActive) panel.classList.add('is-active');
                        });
                    });
                }
            });
        } catch (err) {
            console.error('[NNN motion.js] Accordion setup failed:', err);
        }
    }

    window.NNN_initMotionFor = initMotionFor;
    document.addEventListener('DOMContentLoaded', () => initMotionFor(document));

    // ── 4. Parallax collages — desktop only, throttled via rAF ──────
    if (isDesktop) {
        document.addEventListener('DOMContentLoaded', () => {
            try {
                const parallaxEls = document.querySelectorAll('[data-parallax-speed]');
                if (!parallaxEls.length) return;
                let ticking = false;
                function updateParallax() {
                    const scrollY = window.scrollY;
                    parallaxEls.forEach((el) => {
                        const speed = parseFloat(el.dataset.parallaxSpeed) || 0.08;
                        const rect = el.getBoundingClientRect();
                        const offset = (scrollY - (scrollY + rect.top)) * speed;
                        el.style.transform = `translateY(${offset}px)`;
                    });
                    ticking = false;
                }
                window.addEventListener('scroll', () => {
                    if (!ticking) {
                        requestAnimationFrame(updateParallax);
                        ticking = true;
                    }
                }, { passive: true });
            } catch (err) {
                console.error('[NNN motion.js] Parallax setup failed:', err);
            }
        });
    }

    // ── 5. Hero slideshow (About Us) — crossfades slides on an interval.
    // Works on all devices; it's just opacity transitions, no heavy cost. ──
    try {
        document.querySelectorAll('.hero-slideshow').forEach((slideshow) => {
            const slides = slideshow.querySelectorAll('.hero-slideshow__slide');
            if (slides.length < 2) return;
            let current = 0;
            setInterval(() => {
                slides[current].classList.remove('is-active');
                current = (current + 1) % slides.length;
                slides[current].classList.add('is-active');
            }, 5000);
        });
    } catch (err) {
        console.error('[NNN motion.js] Hero slideshow setup failed:', err);
    }
})();