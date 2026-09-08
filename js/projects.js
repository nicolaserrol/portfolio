// Projects section: bento grid of case-study cards, tag filtering, and a native
// <dialog> for full case-study detail. GSAP (+ ScrollTrigger) is optional and only
// used when ctx.motionOk is true; everything degrades to instant/static otherwise.

const TAG_ICONS = {
  Mobile: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>',
  Web: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  AI: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>',
  Backend: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
};

const TAG_ORDER = ['Mobile', 'Web', 'AI', 'Backend'];

function primaryIcon(tags) {
  for (const t of TAG_ORDER) {
    if (tags.includes(t)) return TAG_ICONS[t];
  }
  return TAG_ICONS.Web;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Deterministic bento rhythm: the first featured project gets the hero (xl) slot,
// remaining featured projects alternate large/medium, regular projects mostly small
// with the occasional medium for variety.
function sizeClassFor(project, featuredSeen, regularSeen) {
  if (project.featured) {
    if (featuredSeen === 0) return 'is-xl';
    return featuredSeen % 2 === 1 ? 'is-lg' : 'is-md';
  }
  return regularSeen % 3 === 1 ? 'is-md' : 'is-sm';
}

export function initProjects(ctx) {
  const section = document.getElementById('projects');
  const grid = document.getElementById('projects-grid');
  const filtersEl = document.getElementById('projects-filters');
  const countEl = document.getElementById('projects-count');
  const dialog = document.getElementById('project-dialog');
  if (!section || !grid || !filtersEl || !dialog) return;

  const { motionOk } = ctx;
  const data = ctx.projects || { tags: [], projects: [] };
  const list = Array.isArray(data.projects) ? data.projects : [];
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const hasGsap = motionOk && typeof window.gsap !== 'undefined';

  // ---------------------------------------------------------------------
  // Dialog refs + open/close
  // ---------------------------------------------------------------------
  const dialogIndustry = document.getElementById('project-dialog-industry');
  const dialogTitle = document.getElementById('project-dialog-title');
  const dialogMeta = document.getElementById('project-dialog-meta');
  const dialogSummary = document.getElementById('project-dialog-summary');
  const dialogStack = document.getElementById('project-dialog-stack');
  const dialogOutcomes = document.getElementById('project-dialog-outcomes');
  const dialogClose = dialog.querySelector('[data-dialog-close]');
  let lastFocused = null;

  function openDialog(project, opener) {
    lastFocused = opener;
    dialogIndustry.textContent = project.industry;
    dialogTitle.textContent = project.title;
    dialogMeta.textContent = `${project.role} · ${project.period}`;
    dialogSummary.textContent = project.summary;
    dialogStack.innerHTML = project.stack
      .map((s) => `<span class="chip">${escapeHtml(s)}</span>`)
      .join('');
    dialogOutcomes.innerHTML = project.outcomes
      .map((o) => `<li>${escapeHtml(o)}</li>`)
      .join('');
    document.documentElement.classList.add('dialog-open');
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  dialogClose?.addEventListener('click', closeDialog);
  dialog.addEventListener('click', (e) => {
    // A click landing on the <dialog> element itself (not its inner panel)
    // means the user clicked the ::backdrop area.
    if (e.target === dialog) closeDialog();
  });
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('dialog-open');
    if (lastFocused) lastFocused.focus();
  });
  dialog.addEventListener('cancel', () => {
    // Native Esc handling already closes the dialog; nothing extra needed,
    // but keep the listener so future changes have a hook.
  });

  // ---------------------------------------------------------------------
  // Hover tilt + cursor glow (pointer: fine only)
  // ---------------------------------------------------------------------
  const canTilt = hasGsap && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function attachTilt(surface) {
    if (!canTilt) return;
    const maxTilt = 6;
    const quickX = gsap.quickTo(surface, 'rotateX', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    const quickY = gsap.quickTo(surface, 'rotateY', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });

    surface.addEventListener('pointermove', (e) => {
      const rect = surface.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      quickY((px - 0.5) * maxTilt * 2);
      quickX(-(py - 0.5) * maxTilt * 2);
      surface.style.setProperty('--mx', `${px * 100}%`);
      surface.style.setProperty('--my', `${py * 100}%`);
    });

    surface.addEventListener('pointerleave', () => {
      quickX(0);
      quickY(0);
    });
  }

  // ---------------------------------------------------------------------
  // Render cards
  // ---------------------------------------------------------------------
  const cardEntries = [];
  let featuredSeen = 0;
  let regularSeen = 0;

  list.forEach((project) => {
    const size = sizeClassFor(project, featuredSeen, regularSeen);
    if (project.featured) featuredSeen += 1; else regularSeen += 1;

    const li = document.createElement('li');
    li.className = `project-card ${size}`;
    li.dataset.tags = project.tags.join(',');
    if (motionOk) li.setAttribute('data-reveal', '');

    const surface = document.createElement('button');
    surface.type = 'button';
    surface.className = 'project-card__surface';
    surface.setAttribute('aria-haspopup', 'dialog');
    surface.setAttribute('aria-controls', 'project-dialog');
    surface.dataset.projectId = project.id;

    const stackShown = project.stack.slice(0, 4);
    const stackRest = project.stack.length - stackShown.length;

    surface.innerHTML = `
      <span class="project-card__icon">${primaryIcon(project.tags)}</span>
      <p class="project-card__industry">${escapeHtml(project.industry)}</p>
      <h3 class="project-card__title">${escapeHtml(project.title)}</h3>
      <p class="project-card__role">${escapeHtml(project.role)} · ${escapeHtml(project.period)}</p>
      <p class="project-card__summary">${escapeHtml(project.summary)}</p>
      <span class="project-card__stack">
        ${stackShown.map((s) => `<span class="chip">${escapeHtml(s)}</span>`).join('')}
        ${stackRest > 0 ? `<span class="chip project-card__more">+${stackRest} more</span>` : ''}
      </span>
    `;

    surface.addEventListener('click', () => openDialog(project, surface));

    li.appendChild(surface);
    grid.appendChild(li);
    attachTilt(surface);
    cardEntries.push({ el: li, tags: project.tags });
  });

  // ---------------------------------------------------------------------
  // Filters
  // ---------------------------------------------------------------------
  const allLabel = 'All';
  const filterButtons = [];

  [allLabel, ...tags].forEach((tag) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter-btn';
    btn.textContent = tag;
    btn.setAttribute('aria-pressed', tag === allLabel ? 'true' : 'false');
    btn.addEventListener('click', () => applyFilter(tag));
    filtersEl.appendChild(btn);
    filterButtons.push(btn);
  });

  function announceCount(n) {
    if (countEl) countEl.textContent = `${n} project${n === 1 ? '' : 's'}`;
  }

  function applyFilter(tag) {
    filterButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.textContent === tag ? 'true' : 'false');
    });

    const matches = (entry) => tag === allLabel || entry.tags.includes(tag);

    if (!hasGsap) {
      cardEntries.forEach((entry) => { entry.el.hidden = !matches(entry); });
      announceCount(cardEntries.filter(matches).length);
      return;
    }

    const toHide = cardEntries.filter((e) => !matches(e) && !e.el.hidden);
    const toShow = cardEntries.filter((e) => matches(e) && e.el.hidden);

    const finish = () => {
      cardEntries.forEach((entry) => { entry.el.hidden = !matches(entry); });
      // Cards that were waiting on the scroll reveal (opacity 0, y 32) may now sit in the
      // viewport after the grid re-lays out; the once-only ScrollTrigger will never fire for
      // them, so force every matching card fully visible before animating the new ones in.
      gsap.set(cardEntries.filter(matches).map((e) => e.el), { opacity: 1, y: 0 });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      if (toShow.length) {
        gsap.fromTo(
          toShow.map((e) => e.el),
          { opacity: 0, scale: 0.94 },
          { opacity: 1, scale: 1, duration: 0.4, ease: 'expo.out', stagger: 0.04, clearProps: 'transform' } // keep inline opacity: base.css [data-reveal] would reset it to 0
        );
      }
      announceCount(cardEntries.filter(matches).length);
    };

    if (toHide.length) {
      gsap.to(toHide.map((e) => e.el), {
        opacity: 0,
        scale: 0.92,
        duration: 0.22,
        ease: 'power2.in',
        stagger: 0.02,
        onComplete: finish,
      });
    } else {
      finish();
    }
  }

  announceCount(list.length);

  // ---------------------------------------------------------------------
  // Scroll reveal
  // ---------------------------------------------------------------------
  if (hasGsap) {
    const cardEls = cardEntries.map((e) => e.el);
    gsap.set(cardEls, { y: 32 });

    const headerEls = section.querySelectorAll('[data-reveal]');
    gsap.set(headerEls, { y: 24 });

    if (window.ScrollTrigger) {
      ScrollTrigger.batch(cardEls, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.6, ease: 'expo.out', stagger: 0.08 }),
      });
      ScrollTrigger.batch(headerEls, {
        start: 'top 85%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', stagger: 0.1 }),
      });
    } else {
      gsap.to(cardEls, { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 });
      gsap.to(headerEls, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 });
    }
  }
}
