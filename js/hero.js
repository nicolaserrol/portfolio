// Owned by hero agent: sticky nav behaviour + hero text motion.
// GSAP / ScrollTrigger / SplitText are registered as globals by main.js.

function qs(sel, root = document) {
  return root.querySelector(sel);
}
function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

function initNavToggle() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-mobile-menu');
  if (!toggle || !menu) return;

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    menu.classList.remove('is-open');
  };
  const openMenu = () => {
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    menu.classList.add('is-open');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu();
    else openMenu();
  });

  qsa('a', menu).forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      toggle.focus();
    }
  });

  const desktopQuery = window.matchMedia('(min-width: 1024px)');
  const handleBreakpointChange = (e) => {
    if (e.matches) closeMenu();
  };
  if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', handleBreakpointChange);
  else if (desktopQuery.addListener) desktopQuery.addListener(handleBreakpointChange);
}

function initScrollProgress() {
  const bar = document.getElementById('nav-progress');
  if (!bar || !window.gsap || !window.ScrollTrigger) return;

  gsap.set(bar, { scaleX: 0 });
  gsap.to(bar, {
    scaleX: 1,
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });
}

function initNavScrollBehavior() {
  const nav = document.getElementById('site-nav');
  const menu = document.getElementById('nav-mobile-menu');
  if (!nav) return;

  if (!window.ScrollTrigger) {
    // Fallback with no GSAP: keep the border cue, skip the direction-based hide/show.
    window.addEventListener(
      'scroll',
      () => nav.classList.toggle('site-nav--scrolled', window.scrollY > 8),
      { passive: true }
    );
    return;
  }

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      nav.classList.toggle('site-nav--scrolled', self.scroll() > 8);

      if (menu && menu.classList.contains('is-open')) {
        nav.classList.remove('site-nav--hidden');
        return;
      }
      if (self.direction === 1 && self.scroll() > nav.offsetHeight * 2) {
        nav.classList.add('site-nav--hidden');
      } else if (self.direction === -1) {
        nav.classList.remove('site-nav--hidden');
      }
    },
  });
}

function initActiveSection() {
  if (!window.ScrollTrigger) return;

  const sectionIds = ['about', 'projects', 'experience', 'skills', 'contact'];
  const navLinks = qsa('[data-nav-link]');
  const mobileLinks = qsa('[data-nav-link-mobile]');

  const setActive = (id) => {
    navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.navLink === id));
    mobileLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.navLinkMobile === id));
  };

  sectionIds.forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return; // sibling section not built yet
    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onEnter: () => setActive(id),
      onEnterBack: () => setActive(id),
    });
  });
}

function initHeroReveal(ctx) {
  const heroSection = document.getElementById('hero');
  const revealEls = heroSection ? qsa('[data-reveal]', heroSection) : [];

  if (!ctx.motionOk || !window.gsap) {
    revealEls.forEach((el) => {
      el.style.opacity = '1';
    });
    return;
  }

  const title = document.getElementById('hero-title');
  const eyebrow = qs('.hero__eyebrow', heroSection);
  const tagline = qs('.hero__tagline', heroSection);
  const summary = qs('.hero__summary', heroSection);
  const ctas = qs('.hero__ctas', heroSection);
  const highlights = qs('.hero__highlights', heroSection);

  const run = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

    // NOTE: base.css hides [data-reveal] elements via a stylesheet opacity:0 rule
    // (to avoid a FOUC before JS runs). A plain gsap `.from()` on those elements
    // would read that already-0 computed opacity as its implicit "to" value and
    // produce a no-op tween. Every element carrying data-reveal is therefore
    // revealed with an explicit `fromTo`/`set` target instead of a bare `.from`.

    if (eyebrow) tl.fromTo(eyebrow, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 });

    if (title && window.SplitText) {
      const split = new SplitText(title, { type: 'chars' });
      tl.set(title, { opacity: 1 }, '-=0.1').from(
        split.chars,
        { opacity: 0, y: 40, stagger: 0.02, duration: 0.7 },
        '-=0.15'
      );
    } else if (title) {
      tl.to(title, { opacity: 1, duration: 0.6 }, '-=0.1');
    }

    const textGroup = [tagline, summary].filter(Boolean);
    if (textGroup.length) {
      tl.fromTo(
        textGroup,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 },
        '-=0.3'
      );
    }
    if (ctas) {
      // .hero__ctas itself carries data-reveal (see note above); reveal the
      // container instantly, then stagger its children in — the children are
      // plain elements with no data-reveal of their own, so `.from()` on them
      // correctly reads their natural opacity:1 as the target.
      tl.set(ctas, { opacity: 1 }, '-=0.3').from(
        ctas.children,
        { opacity: 0, y: 16, duration: 0.5, stagger: 0.08 },
        '<'
      );
    }
    if (highlights) {
      tl.set(highlights, { opacity: 1 }, '-=0.25').from(
        highlights.children,
        { opacity: 0, y: 16, duration: 0.5, stagger: 0.06 },
        '<'
      );
    }
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run).catch(run);
  } else {
    run();
  }
}

function initMagneticCtas() {
  if (!window.gsap) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;

  qsa('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      xTo(relX * 0.35);
      yTo(relY * 0.35);
    });
    el.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

export function initHero(ctx) {
  try {
    initNavToggle();
    initScrollProgress();
    initNavScrollBehavior();
    initActiveSection();
    initHeroReveal(ctx);
    if (ctx.motionOk) initMagneticCtas();
  } catch (err) {
    console.warn('[hero] init encountered an error:', err);
  }
}
