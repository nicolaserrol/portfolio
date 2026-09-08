// Entry point. GSAP + plugins are loaded as globals from cdnjs in index.html.
// Three.js is loaded by hero-scene.js via the importmap.
import { initHero } from './hero.js';
import { initHeroScene } from './hero-scene.js';
import { initAbout } from './about.js';
import { initSkills } from './skills.js';
import { initProjects } from './projects.js';
import { initExperience } from './experience.js';
import { initContact } from './contact.js';

// Motion only when the user allows it AND GSAP actually loaded (CDN can fail).
export const MOTION_OK =
  !window.matchMedia('(prefers-reduced-motion: reduce)').matches && !!window.gsap;

if (window.gsap) {
  if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  gsap.defaults({ ease: 'expo.out', duration: 0.8 });
}
if (MOTION_OK) document.documentElement.classList.add('motion-ok');

async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function boot() {
  const [resume, projects] = await Promise.all([
    loadJSON('./data/resume.json'),
    loadJSON('./data/projects.json'),
  ]);
  const ctx = { resume, projects, motionOk: MOTION_OK };

  const canvas = document.getElementById('hero-canvas');
  if (canvas && MOTION_OK) {
    initHeroScene(canvas).catch((e) => console.warn('hero scene skipped:', e));
  }
  initHero(ctx);
  initAbout(ctx);
  initSkills(ctx);
  initProjects(ctx);
  initExperience(ctx);
  initContact(ctx);

  if (window.ScrollTrigger) ScrollTrigger.refresh();
}

boot().catch((e) => console.error(e));
