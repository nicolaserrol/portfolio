// About section: content is static in partials/about.html. This module only
// wires the scroll-triggered reveal for the paragraphs, "what I do" items,
// the currently card and the industry chips (all marked [data-reveal]).

export function initAbout(ctx) {
  const section = document.getElementById('about');
  if (!section) return;

  const targets = section.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  // No motion allowed, or GSAP failed to load (e.g. CDN unreachable): make sure
  // nothing is left stuck at opacity:0 from the html.motion-ok CSS rule.
  if (!ctx.motionOk || !window.gsap) {
    targets.forEach((el) => { el.style.opacity = '1'; });
    return;
  }

  gsap.set(targets, { y: 24, opacity: 0 });
  gsap.to(targets, {
    y: 0,
    opacity: 1,
    duration: 0.8,
    ease: 'expo.out',
    stagger: 0.06,
    scrollTrigger: window.ScrollTrigger
      ? { trigger: section, start: 'top 80%', once: true }
      : undefined,
  });
}
