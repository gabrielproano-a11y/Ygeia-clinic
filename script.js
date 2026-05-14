/**
 * YGEIA — SCRIPT.JS
 * Consultorio Médico & Estético
 * Interactions: Navbar, Particles, Counters, Flip Cards,
 *               Scroll Reveal, Mobile Menu, Form, Back-to-top
 */

'use strict';

/* ============================================================
   UTILITY HELPERS
============================================================ */
function debounce(fn, wait = 20) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

/* ============================================================
   THEME TOGGLE — Light / Dark
============================================================ */
(function initTheme() {
    const html        = document.documentElement;
    const btn         = document.getElementById('themeToggle');
    const DARK_ICON   = '🌙';
    const LIGHT_ICON  = '☀️';
    const STORAGE_KEY = 'ygeia-theme';

    // Read saved preference or default to 'light'
    const saved = localStorage.getItem(STORAGE_KEY) || 'light';
    html.setAttribute('data-theme', saved);
    if (btn) btn.textContent = saved === 'dark' ? DARK_ICON : LIGHT_ICON;

    if (!btn) return;

    btn.addEventListener('click', () => {
        const current = html.getAttribute('data-theme');
        const next    = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        btn.textContent = next === 'dark' ? DARK_ICON : LIGHT_ICON;
        localStorage.setItem(STORAGE_KEY, next);

        // Tiny spin animation on the button
        btn.style.transform = 'scale(0.8) rotate(180deg)';
        setTimeout(() => { btn.style.transform = ''; }, 300);
    });
})();

/* ============================================================
   NAVBAR — SCROLL EFFECT + MOBILE MENU
============================================================ */
(function initNavbar() {
    const navbar      = document.getElementById('navbar');
    const menuToggle  = document.getElementById('menuToggle');
    const mobileMenu  = document.getElementById('mobileMenu');
    const mobileLinks = mobileMenu.querySelectorAll('.mobile-link, .mobile-cta');

    // Scroll → add 'scrolled' class
    const onScroll = debounce(() => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, 10);

    window.addEventListener('scroll', onScroll, { passive: true });

    // Mobile menu toggle
    function toggleMenu(open) {
        mobileMenu.classList.toggle('open', open);
        menuToggle.classList.toggle('open', open);
        document.body.style.overflow = open ? 'hidden' : '';
    }

    menuToggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.contains('open');
        toggleMenu(!isOpen);
    });

    // Close on link click
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });
})();

/* ============================================================
   SMOOTH SCROLL — All anchor links
============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
        const target = document.querySelector(link.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        const navH = document.getElementById('navbar').offsetHeight;
        const top  = target.getBoundingClientRect().top + window.scrollY - navH - 16;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});

/* ============================================================
   PARTICLE SYSTEM
============================================================ */
(function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    const COUNT = 50;

    for (let i = 0; i < COUNT; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left              = `${Math.random() * 100}%`;
        p.style.top               = `${Math.random() * 100}%`;
        p.style.width             = `${2 + Math.random() * 3}px`;
        p.style.height            = p.style.width;
        p.style.animationDelay    = `${Math.random() * 20}s`;
        p.style.animationDuration = `${15 + Math.random() * 15}s`;
        container.appendChild(p);
    }
})();

/* ============================================================
   ANIMATED COUNTER
============================================================ */
function animateCounter(el, target, duration = 1800) {
    let start = null;
    const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        // Ease out quart
        const eased = 1 - Math.pow(1 - progress, 4);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
    };
    requestAnimationFrame(step);
}

/* ============================================================
   INTERSECTION OBSERVER — Scroll reveal + Counter trigger
============================================================ */
(function initObservers() {

    // ---- Reveal sections / cards ----
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                const el = entry.target;
                // Stagger for .reveal-card siblings
                if (el.classList.contains('reveal-card')) {
                    const siblings = [...el.parentElement.children].filter(c =>
                        c.classList.contains('reveal-card')
                    );
                    const index = siblings.indexOf(el);
                    el.style.transitionDelay = `${index * 0.1}s`;
                }
                el.classList.add('visible');
                revealObserver.unobserve(el);
            }
        });
    }, {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px'
    });

    document.querySelectorAll('.reveal-section, .reveal-card').forEach(el => {
        revealObserver.observe(el);
    });

    // ---- Counters ----
    const countersDone = new WeakSet();

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !countersDone.has(entry.target)) {
                countersDone.add(entry.target);
                const el     = entry.target;
                const target = parseInt(el.dataset.target, 10);
                animateCounter(el, target);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('[data-target]').forEach(el => {
        counterObserver.observe(el);
    });
})();

/* ============================================================
   SERVICE BUBBLES V2 — Carousel + Hover/Tap interaction
============================================================ */
(function initServiceBubbles() {
    const track    = document.getElementById('svTrack');
    const mask     = track ? track.closest('.sv-track-mask') : null;
    const prevBtn  = document.getElementById('svPrev');
    const nextBtn  = document.getElementById('svNext');
    const dotsWrap = document.getElementById('svDots');

    if (!track || !mask) return;

    const bubbles = [...track.querySelectorAll('.sv-bubble')];
    const TOTAL   = bubbles.length;
    let current   = 0;

    /* --- Detect environment --- */
    const isTouch  = () => window.matchMedia('(hover: none)').matches;
    const isMobile = () => window.innerWidth <= 900;

    /* --- Build pagination dots --- */
    bubbles.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'sv-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', `Servicio ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
    });

    /* --- Carousel navigation (desktop only) --- */
    function getVisibleCount() {
        // Always show exactly 4 on desktop for the best 4-bubble view
        if (!isMobile()) return 4;
        // Mobile: measure how many actually fit
        const maskW   = mask.offsetWidth || 400;
        const bubbleW = bubbles[0] ? bubbles[0].offsetWidth : 200;
        const gap     = parseFloat(getComputedStyle(track).gap) || 32;
        return Math.max(1, Math.floor((maskW + gap) / (bubbleW + gap)));
    }

    function goTo(index) {
        if (isMobile()) return; // mobile uses native scroll-snap
        const maxIndex = Math.max(0, TOTAL - getVisibleCount());
        current = Math.max(0, Math.min(index, maxIndex));

        // Measure bubble width + gap from live DOM
        const bw  = bubbles[0] ? bubbles[0].offsetWidth : 200;
        const gap = parseFloat(getComputedStyle(track).gap) || 32;
        track.style.transform = `translateX(-${current * (bw + gap)}px)`;

        updateDots();
        updateArrows();
    }

    function updateDots() {
        [...dotsWrap.children].forEach((d, i) => {
            d.classList.toggle('active', i === current);
            d.setAttribute('aria-selected', i === current);
        });
    }

    function updateArrows() {
        if (prevBtn) prevBtn.disabled = current === 0;
        if (nextBtn) nextBtn.disabled = current >= TOTAL - getVisibleCount();
    }

    prevBtn?.addEventListener('click', () => goTo(current - 1));
    nextBtn?.addEventListener('click', () => goTo(current + 1));

    /* --- Hover (desktop) / Tap (mobile) panel reveal --- */
    bubbles.forEach(b => {
        if (!isTouch()) {
            // Desktop: hover shows panel
            b.addEventListener('mouseenter', () => {
                bubbles.forEach(o => o.classList.remove('sv-active'));
                b.classList.add('sv-active');
            });
            b.addEventListener('mouseleave', () => {
                b.classList.remove('sv-active');
            });
        } else {
            // Mobile: tap toggles panel (accordion style)
            b.addEventListener('click', (e) => {
                // Don't close when clicking CTA link
                if (e.target.closest('.sv-cta')) return;
                const wasActive = b.classList.contains('sv-active');
                bubbles.forEach(o => o.classList.remove('sv-active'));
                if (!wasActive) b.classList.add('sv-active');
            });
        }
    });

    // Tap outside bubble closes all panels (mobile)
    document.addEventListener('click', (e) => {
        if (isTouch() && !e.target.closest('.sv-bubble')) {
            bubbles.forEach(b => b.classList.remove('sv-active'));
        }
    });

    /* --- Recalibrate on resize --- */
    window.addEventListener('resize', debounce(() => {
        if (!isMobile()) {
            goTo(current);
        } else {
            // Reset JS transform on mobile
            track.style.transform = '';
        }
    }, 200));

    /* --- Init --- */
    goTo(0);
})();

/* ============================================================
   SERVICES PARALLAX — Scroll + Mouse parallax on bg layers
============================================================ */
(function initServicesParallax() {
    const section = document.querySelector('.services-v2');
    if (!section) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const layers = [
        { sel: '.sv-bg-canvas', scrollSpeed: 0.05, mouseX: 0.02, mouseY: 0.03 },
        { sel: '.sv-blob-1',    scrollSpeed: 0.10, mouseX: 0.04, mouseY: 0.06 },
        { sel: '.sv-blob-2',    scrollSpeed: 0.16, mouseX: 0.07, mouseY: 0.09 },
        { sel: '.sv-blob-3',    scrollSpeed: 0.12, mouseX: 0.05, mouseY: 0.07 },
        { sel: '.sv-mesh-a',    scrollSpeed: 0.08, mouseX: 0.09, mouseY: 0.05 },
        { sel: '.sv-mesh-b',    scrollSpeed: 0.14, mouseX: 0.06, mouseY: 0.10 },
        { sel: '.sv-mesh-c',    scrollSpeed: 0.18, mouseX: 0.08, mouseY: 0.04 },
    ].map(cfg => ({ ...cfg, el: section.querySelector(cfg.sel) }))
     .filter(cfg => cfg.el);

    /* --- Scroll parallax --- */
    function applyScroll() {
        const rect     = section.getBoundingClientRect();
        const viewH    = window.innerHeight;
        // normalised progress 0→1 as section scrolls through viewport
        const progress = (viewH - rect.top) / (viewH + rect.height);
        if (progress < -0.1 || progress > 1.1) return; // skip when off-screen

        layers.forEach(({ el, scrollSpeed }) => {
            const offset = (progress - 0.5) * 160 * scrollSpeed;
            el.style.setProperty('--pb-y', `${offset}px`);
        });
    }

    /* --- Mouse parallax (desktop only) --- */
    function applyMouse(e) {
        if (window.innerWidth <= 900) return;
        const rect = section.getBoundingClientRect();
        // Only react when mouse is over the section
        if (e.clientY < rect.top - 60 || e.clientY > rect.bottom + 60) return;

        const cx = (e.clientX / window.innerWidth  - 0.5) * 60;
        const cy = (e.clientY / window.innerHeight - 0.5) * 40;

        layers.forEach(({ el, mouseX, mouseY }) => {
            el.style.setProperty('--pb-x', `${cx * mouseX}px`);
            // Combine with existing scroll offset, not overwrite:
            const curY = parseFloat(el.style.getPropertyValue('--pb-y')) || 0;
            el.style.setProperty('--pb-y', `${curY + cy * mouseY * 0.3}px`);
        });
    }

    window.addEventListener('scroll', debounce(applyScroll, 10), { passive: true });
    document.addEventListener('mousemove', debounce(applyMouse, 16));
    applyScroll(); // init on load
})();

/* ============================================================
   BACK TO TOP
============================================================ */
(function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    const onScroll = debounce(() => {
        btn.classList.toggle('visible', window.scrollY > 500);
    }, 15);

    window.addEventListener('scroll', onScroll, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

/* ============================================================
   CONTACT FORM — Submit handler → n8n Webhook
============================================================ */
(function initForm() {
    const WEBHOOK_URL = 'https://practiceac.app.n8n.cloud/webhook/b30f5799-1996-47ed-aedf-c867aaa415dc';

    const form    = document.getElementById('contactForm');
    const success = document.getElementById('formSuccess');
    const btn     = document.getElementById('submitBtn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Loading state
        const originalHTML = btn.innerHTML;
        btn.innerHTML = 'Enviando... <span style="opacity:0.7">⏳</span>';
        btn.disabled = true;

        // Collect all form data
        const payload = {
            nombre:   form.nombre.value.trim(),
            email:    form.email.value.trim(),
            telefono: form.telefono.value.trim(),
            servicio: form.servicio.value,
            mensaje:  form.mensaje.value.trim(),
            fecha:    new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' }),
            origen:   'Formulario Web — Ygeia'
        };

        try {
            const response = await fetch(WEBHOOK_URL, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify(payload)
            });

            if (response.ok || response.status === 200) {
                // Success
                form.style.display = 'none';
                success.style.display = 'block';
            } else {
                throw new Error(`HTTP ${response.status}`);
            }
        } catch (err) {
            console.error('Error al enviar al webhook:', err);
            // Restore button and show error
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.style.background = 'linear-gradient(135deg, #7f1d1d, #dc2626)';
            btn.textContent = '⚠️ Error al enviar — Intenta de nuevo';
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.background = '';
            }, 3500);
        }
    });
})();

/* ============================================================
   PARALLAX — Subtle hero blob movement on mouse
============================================================ */
(function initParallax() {
    const blob = document.querySelector('.hero-bg-blob');
    if (!blob) return;

    // Only on desktop (non-touch)
    if (window.matchMedia('(hover: hover)').matches) {
        document.addEventListener('mousemove', debounce((e) => {
            const x = (e.clientX / window.innerWidth  - 0.5) * 30;
            const y = (e.clientY / window.innerHeight - 0.5) * 30;
            blob.style.transform = `translate(${x}px, ${y}px)`;
        }, 16));
    }
})();

/* ============================================================
   ACTIVE NAV LINK — Highlight based on scroll position
============================================================ */
(function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    const onScroll = debounce(() => {
        const navH = document.getElementById('navbar').offsetHeight + 30;
        let current = '';

        sections.forEach(sec => {
            const top = sec.getBoundingClientRect().top;
            if (top <= navH) current = sec.id;
        });

        navLinks.forEach(link => {
            link.style.color = '';
            if (link.getAttribute('href') === `#${current}`) {
                link.style.color = 'var(--primary-300)';
            }
        });
    }, 20);

    window.addEventListener('scroll', onScroll, { passive: true });
})();

/* ============================================================
   FORM INPUT — Floating label / focus ring polish
============================================================ */
document.querySelectorAll('.form-group input, .form-group select, .form-group textarea')
    .forEach(el => {
        el.addEventListener('focus', () => {
            el.parentElement.classList.add('focused');
        });
        el.addEventListener('blur', () => {
            el.parentElement.classList.remove('focused');
        });
    });

/* ============================================================
   INITIALIZE ON DOM READY
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    console.log('%c🏥 Ygeia — Consultorio Médico & Estético cargado con éxito ✨', 
        'color: #03a0a0; font-size: 14px; font-weight: bold;');
});
