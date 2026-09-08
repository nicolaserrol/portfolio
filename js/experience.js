// Experience timeline: renders resume.experience into #experience-timeline
// and (when motion is allowed) draws the rail line + pops markers on scroll.

const BULLET_PREVIEW_COUNT = 4;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function chevronIcon() {
  return (
    '<svg class="icon timeline-toggle-icon" viewBox="0 0 24 24" aria-hidden="true">' +
    '<polyline points="6 9 12 15 18 9"></polyline>' +
    '</svg>'
  );
}

function renderEntry(entry, index) {
  const isVenture = entry.id === 'nuptl';
  const bullets = entry.bullets || [];
  const hasOverflow = bullets.length > BULLET_PREVIEW_COUNT;
  const chapterLabel = isVenture
    ? 'Side venture'
    : `Ch. ${String(index + 1).padStart(2, '0')}`;
  const bulletsId = `experience-bullets-${entry.id}`;

  const bulletItems = bullets
    .map((bullet, i) => {
      const isExtra = hasOverflow && i >= BULLET_PREVIEW_COUNT;
      return `<li class="timeline-bullet-item"${isExtra ? ' hidden data-extra' : ''}>${escapeHtml(bullet)}</li>`;
    })
    .join('');

  const toggle = hasOverflow
    ? `<button type="button" class="timeline-toggle" aria-expanded="false" aria-controls="${bulletsId}">
        <span class="timeline-toggle-label">Show all ${bullets.length}</span>
        ${chevronIcon()}
      </button>`
    : '';

  return `
    <li class="timeline-entry${isVenture ? ' timeline-entry--venture' : ''}" data-entry-id="${entry.id}">
      <div class="timeline-marker-col">
        <span class="timeline-marker" aria-hidden="true"></span>
      </div>
      <div class="timeline-content">
        <div class="timeline-meta">
          <span class="timeline-chapter">${chapterLabel}</span>
          ${isVenture ? '' : `<span class="timeline-period">${escapeHtml(entry.period)}</span>`}
        </div>
        <h3 class="timeline-role">${escapeHtml(entry.role)}</h3>
        <p class="timeline-company">${escapeHtml(entry.company)}</p>
        <ul class="timeline-bullets" id="${bulletsId}">${bulletItems}</ul>
        ${toggle}
      </div>
    </li>`;
}

function wireToggles(ol) {
  ol.addEventListener('click', (event) => {
    const btn = event.target.closest('.timeline-toggle');
    if (!btn || !ol.contains(btn)) return;

    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const list = document.getElementById(btn.getAttribute('aria-controls'));
    if (!list) return;

    const extras = list.querySelectorAll('[data-extra]');
    extras.forEach((li) => {
      li.hidden = expanded;
    });

    btn.setAttribute('aria-expanded', String(!expanded));
    btn.classList.toggle('is-expanded', !expanded);

    const label = btn.querySelector('.timeline-toggle-label');
    if (label) {
      const total = list.querySelectorAll('.timeline-bullet-item').length;
      label.textContent = expanded ? `Show all ${total}` : 'Show fewer';
    }
  });
}

function setupHeaderReveal(section) {
  const nodes = section.querySelectorAll('[data-reveal]');
  if (!nodes.length) return;

  gsap.set(nodes, { y: 16 });
  ScrollTrigger.create({
    trigger: section,
    start: 'top 85%',
    once: true,
    onEnter() {
      gsap.to(nodes, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'expo.out',
      });
    },
  });
}

function setupMotion(section, wrap, line, entryEls) {
  if (!window.gsap || !window.ScrollTrigger || !entryEls.length) {
    // No ScrollTrigger: make sure header reveal targets are not left hidden.
    section.querySelectorAll('[data-reveal]').forEach((el) => { el.style.opacity = '1'; });
    return;
  }

  setupHeaderReveal(section);

  gsap.set(line, { scaleY: 0, transformOrigin: 'top' });

  const markers = entryEls.map((li) => li.querySelector('.timeline-marker'));
  markers.forEach((marker) => {
    if (marker) gsap.set(marker, { scale: 0 });
  });
  const popped = new Set();

  ScrollTrigger.create({
    trigger: wrap,
    start: 'top 78%',
    end: 'bottom 30%',
    scrub: 0.5,
    onUpdate(self) {
      gsap.set(line, { scaleY: self.progress });
      const wrapHeight = wrap.offsetHeight || 1;
      markers.forEach((marker, i) => {
        if (!marker || popped.has(i)) return;
        const threshold = entryEls[i].offsetTop / wrapHeight;
        if (self.progress >= threshold) {
          popped.add(i);
          gsap.to(marker, { scale: 1, duration: 0.4, ease: 'back.out(2.2)' });
        }
      });
    },
  });

  entryEls.forEach((li) => {
    gsap.set(li, { opacity: 0, x: -24 });
    ScrollTrigger.create({
      trigger: li,
      start: 'top 88%',
      once: true,
      onEnter() {
        gsap.to(li, { opacity: 1, x: 0, duration: 0.8, ease: 'expo.out' });
      },
    });
  });
}

export function initExperience(ctx) {
  const ol = document.getElementById('experience-timeline');
  if (!ol) return;

  const entries = (ctx && ctx.resume && ctx.resume.experience) || [];
  if (!entries.length) return;

  ol.innerHTML = entries.map(renderEntry).join('');
  wireToggles(ol);

  const section = document.getElementById('experience');
  const wrap = ol.closest('.experience-timeline-wrap');
  const line = document.getElementById('experience-line');

  if (ctx.motionOk && section && wrap && line) {
    const entryEls = Array.from(ol.querySelectorAll('.timeline-entry'));
    setupMotion(section, wrap, line, entryEls);
  }
}
