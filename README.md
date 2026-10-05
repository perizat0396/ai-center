# AI Center — Amanzholov University

Landing site of the AI Center at Sarsen Amanzholov East Kazakhstan University — the lab where students build AI startups.

**Pages:** `index.html` (home) · `about.html` (About us)

**Stack:** Vite · vanilla HTML/CSS/JS · GSAP + ScrollTrigger · Lenis smooth scroll

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

> On Windows PowerShell use `npm.cmd` instead of `npm` if script execution is disabled.

## Build

```bash
npm run build
```

The production site is generated in `dist/`.

## Live site

https://perizat0396.github.io/ai-center/ — every push to `main` is built and published automatically by GitHub Actions (`.github/workflows/deploy.yml`).

## Where to change things

| What | File |
|---|---|
| Colors, fonts, sizes, dark mode palette | `src/styles/tokens.css` |
| Animation settings (speeds, distances, timings) | `src/config.js` |
| Dark mode glow effects | `src/styles/dark.css` |
| Page content | `index.html`, `about.html` |
| Images (hands, team photos) | `public/img/` |

Animations respect `prefers-reduced-motion`; the site has a light and a dark (starry) theme.
