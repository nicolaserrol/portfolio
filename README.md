# Errol June Nicolas — Portfolio

Personal portfolio. Static site: HTML, CSS, ES modules, GSAP 3 (ScrollTrigger, SplitText) and Three.js. No build step.

## Run locally

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

## Structure

- `index.html` — page shell
- `css/` — `tokens.css` (design tokens), `base.css`, one file per section
- `js/` — `main.js` entry, one module per section, `hero-scene.js` for the Three.js hero
- `data/` — `resume.json`, `projects.json` (anonymised case studies)
- `assets/` — favicon, OG image, resume PDF

Respects `prefers-reduced-motion`: the 3D scene and scroll animations are disabled when set.

## Build

`index.html` is generated: edit `index.template.html` and `partials/*.html`, then run
`python3 scripts/build.py`. Commit both the template and the generated `index.html`.
