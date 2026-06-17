# glebfox.com

Personal landing page for Gleb Gorelov — a single static "coming soon" page hosted on GitHub Pages.

🔗 **[glebfox.com](https://glebfox.com)**

## About

A minimal, self-contained page with zero external dependencies — pure HTML, CSS, and JavaScript, all inline in a single `index.html`. No build step, no framework, no backend.

Highlights:

- **Adaptive theming** — light/dark via the CSS `color-scheme` property and `light-dark()`, following the OS by default with a manual toggle (persisted in `localStorage`, applied before paint to avoid a flash).
- **Animated aurora background** — three drifting, blurred gradient orbs rendered purely in CSS.
- **Accessible by default** — respects `prefers-reduced-motion`, supports Windows High Contrast (`forced-colors`), and ships keyboard-focusable controls.
- **Adaptive SVG favicons** — light/dark variants selected via `prefers-color-scheme`.
- **Tuned for performance** — preloaded display font, `font-display: swap`, and a fallback metric match to avoid layout shift.

## Development

No build step. Open `index.html` directly in a browser, or serve the directory locally:

```bash
npx serve
```

## Deployment

Push to the `master` branch — GitHub Pages serves it automatically at the domain configured in [`CNAME`](CNAME).

## Structure

```
index.html              # The entire page — inline CSS and JS
fonts/                  # Custom script display font (woff)
images/favicon/         # Adaptive light/dark SVG favicons
CNAME                   # Custom domain for GitHub Pages
```

## License

© 2016–2026 Gleb Gorelov. All rights reserved.
