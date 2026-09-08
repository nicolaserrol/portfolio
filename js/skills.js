// Skills section: builds the bento grid of skill-group cards from
// ctx.resume.skills into #skills-grid, then wires the scroll-triggered
// reveal on the cards.

const GROUP_ICONS = {
  'Mobile': '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect><path d="M12 18h.01"></path>',
  'Frontend': '<rect width="7" height="7" x="3" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="3" rx="1"></rect><rect width="7" height="7" x="14" y="14" rx="1"></rect><rect width="7" height="7" x="3" y="14" rx="1"></rect>',
  'APIs & Backend': '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"></rect><rect width="20" height="8" x="2" y="14" rx="2" ry="2"></rect><line x1="6" x2="6.01" y1="6" y2="6"></line><line x1="6" x2="6.01" y1="18" y2="18"></line>',
  'AI & Automation': '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.287 1.288L3 12l5.8 1.9a2 2 0 0 1 1.288 1.287L12 21l1.9-5.8a2 2 0 0 1 1.287-1.288L21 12l-5.8-1.9a2 2 0 0 1-1.288-1.287Z"></path>',
  'Integrations': '<path d="M12 22v-5"></path><path d="M9 8V2"></path><path d="M15 8V2"></path><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"></path>',
  'Tools & Practices': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>',
};

// Emphasised per his positioning (React Native lead + AI-assisted delivery).
const EMPHASIZED_GROUPS = new Set(['Mobile', 'AI & Automation']);

function buildCard(group) {
  const card = document.createElement('article');
  card.className = 'card skills-card' + (EMPHASIZED_GROUPS.has(group.group) ? ' skills-card--accent' : '');
  card.setAttribute('data-reveal', '');

  const iconWrap = document.createElement('span');
  iconWrap.className = 'skills-card-icon';
  const iconPaths = GROUP_ICONS[group.group] || '';
  iconWrap.innerHTML = `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths}</svg>`;

  const heading = document.createElement('h3');
  heading.className = 'skills-card-title';
  heading.textContent = group.group;

  const list = document.createElement('ul');
  list.className = 'skills-card-list';
  list.setAttribute('aria-label', `${group.group} skills`);
  for (const item of group.items) {
    const li = document.createElement('li');
    li.className = 'chip';
    li.textContent = item;
    list.appendChild(li);
  }

  card.append(iconWrap, heading, list);
  return card;
}

export function initSkills(ctx) {
  const grid = document.getElementById('skills-grid');
  if (!grid) return;

  const groups = ctx.resume && Array.isArray(ctx.resume.skills) ? ctx.resume.skills : [];
  if (!groups.length) return;

  const frag = document.createDocumentFragment();
  for (const group of groups) frag.appendChild(buildCard(group));
  grid.appendChild(frag);

  // Header (.skills-head) is static markup with data-reveal too; include it so it is never left hidden.
  const section = grid.closest('section') || grid.parentElement;
  const targets = section.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

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
      ? { trigger: grid, start: 'top 80%', once: true }
      : undefined,
  });
}
