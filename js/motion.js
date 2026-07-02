// JavaScript source code
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
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;

    // ── 1. Lenis — desktop only, lazily injected ──────────────────
    if (isDesktop && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js';
        script.onload = () => {
            if (typeof Lenis === 'undefined') return;
            const lenis = new Lenis({ duration: 1.1, easing: t => 1 - Math.pow(1 - t, 3) });
            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        };
        document.head.appendChild(script);
    }

    // ── 2 & 3. Reveal + accordion wiring — reusable, since content
    // fetched asynchronously (e.g. gallery.js's series rows) doesn't
    // exist yet on the first pass at DOMContentLoaded. ──────────────
    function initMotionFor(root) {
        root = root || document;

        // Scroll reveals
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

        // Vertical-slice accordion
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
    }

    window.NNN_initMotionFor = initMotionFor;
    document.addEventListener('DOMContentLoaded', () => initMotionFor(document));

    // ── 4. Parallax collages — desktop only, throttled via rAF ──────
    if (isDesktop) {
        document.addEventListener('DOMContentLoaded', () => {
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
        });
    }
})();