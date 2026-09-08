// Contact section + footer behaviour: copy-to-clipboard, reveal + magnetic hover.
export function initContact(ctx) {
  const { motionOk } = ctx || {};

  initCopyEmail();
  if (motionOk && window.gsap) {
    initReveal();
    initMagneticCards();
  }
}

function initCopyEmail() {
  const btn = document.getElementById('copy-email-btn');
  const status = document.getElementById('copy-email-status');
  if (!btn) return;

  const email = btn.getAttribute('data-copy-email') || '';
  const label = btn.querySelector('.copy-email-label');
  const defaultLabel = label ? label.textContent : 'Copy email';
  let resetTimer = null;

  btn.addEventListener('click', async () => {
    let copied = false;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(email);
        copied = true;
      } catch (err) {
        copied = false;
      }
    }

    if (!copied) {
      copied = fallbackCopy(email);
    }

    if (label) label.textContent = copied ? 'Copied' : 'Copy failed';
    if (status) status.textContent = copied ? `Copied ${email} to clipboard.` : 'Could not copy automatically — email selected, use Cmd/Ctrl+C.';

    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      if (label) label.textContent = defaultLabel;
      if (status) status.textContent = '';
    }, 2000);
  });
}

function fallbackCopy(text) {
  const temp = document.createElement('textarea');
  temp.value = text;
  temp.setAttribute('readonly', '');
  temp.style.position = 'absolute';
  temp.style.left = '-9999px';
  document.body.appendChild(temp);
  temp.select();
  temp.setSelectionRange(0, temp.value.length);

  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (err) {
    ok = false;
  }
  document.body.removeChild(temp);
  return ok;
}

function initReveal() {
  const items = document.querySelectorAll('.contact [data-reveal]');
  if (!items.length) return;

  gsap.set(items, { y: 24 });
  gsap.to(items, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    stagger: 0.12,
    ease: 'expo.out',
    scrollTrigger: {
      trigger: '.contact',
      start: 'top 75%',
      once: true,
    },
  });
}

function initMagneticCards() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const cards = document.querySelectorAll('.contact [data-magnetic]');
  cards.forEach((card) => {
    const xTo = gsap.quickTo(card, 'x', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(card, 'y', { duration: 0.5, ease: 'elastic.out(1, 0.4)' });

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const relX = e.clientX - rect.left - rect.width / 2;
      const relY = e.clientY - rect.top - rect.height / 2;
      xTo(relX * 0.25);
      yTo(relY * 0.25);
    });

    card.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}
