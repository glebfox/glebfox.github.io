# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal landing page for Gleb Gorelov (glebfox.com), hosted on GitHub Pages. A single static HTML page — hero (avatar + name + intro + GitHub/Email), a "What I do" block grid, a tech-stack row, and a footer. No build system, no templating, no backend.

## Development

**No build step.** Open `index.html` directly in a browser to preview.

**Local preview:** a tracked `.claude/launch.json` provides a `site` server (`npx serve`, port 3000) for in-browser verification.

**Force a theme when verifying:** set `localStorage.theme` to `light`/`dark` (or set `document.documentElement.style.colorScheme` inline on `<html>`) and reload; clear it to follow the OS again.

**Preview screenshots clip on scroll (gotcha):** the Claude Preview `preview_screenshot` tool renders a blank band (≈ the scroll offset) when the page is scrolled. Verify scroll-dependent layout by reading computed values, or with a viewport tall enough to fit everything (no scroll).

**`modern-web-guidance` scope:** the mandatory search covers evolving CSS/JS APIs (this page's `light-dark()`/`oklch()`/animations) — it has no guides for static `<head>`/SEO/meta tags (canonical, Open Graph, `theme-color`, `description`), so expect empty results there and rely on standard knowledge.

**Deployment:** Push to the `master` branch — GitHub Pages serves it automatically at glebfox.com (configured via `CNAME`).

## Continuous integration

**Lighthouse CI:** `.github/workflows/lighthouse.yml` audits `index.html` on every push to `master` and on PRs, serving the repo root as a static site via `treosh/lighthouse-ci-action`. Budgets live in `lighthouserc.json`: accessibility / SEO / best-practices are hard-gated at 1.0; performance is warn-only (timing on shared CI runners fluctuates). Public repo → Actions minutes are free.

**Audit forces reduced motion (gotcha):** `lighthouserc.json` sets `chromeFlags: "--force-prefers-reduced-motion"`. The entrance animation (`@keyframes enter`) starts `header`/`main`/`footer` at `opacity: 0`, which never advances in headless Lighthouse → `NO_FCP` → the whole audit fails. Reduced motion makes content statically visible (the gated categories are motion-independent). Revisit this flag if that animation changes.

**Run the audit locally:** `npx -y @lhci/cli@latest collect --config=./lighthouserc.json && npx -y @lhci/cli@latest assert --config=./lighthouserc.json` — needs Chrome; the config's `chromeFlags` handle headless + reduced motion, so it mirrors CI. `.lighthouseci/` is gitignored.

## Architecture

Single-page site. Zero external dependencies — pure HTML/CSS/JS only.

**Files:**
- `index.html` — the entire page; all CSS inline in `<style>`, all JS inline in `<script>`, all icons inline as `<svg>` (incl. the tech-stack brand logos)
- `fonts/Satoshi-Variable.woff2` — self-hosted Satoshi (variable, weights 300–900); the page's only web font, used for the name and all text (sourced from Fontshare)
- `images/photo.jpg` — optimized 448² avatar used in the hero; `images/photo.png` (1000²) is the source kept for regenerating the og card
- `images/favicon/` — two adaptive SVG favicons (`favicon-light.svg` / `favicon-dark.svg`); the `<link rel="icon">` tags pick one via `prefers-color-scheme` (replaced the old PNG set)
- `images/og-image.png` — 1200×630 social-preview card (Open Graph / Twitter Card) referenced from `<head>`; a static dark render: avatar on the left, the name in Satoshi on the right

**Why inline CSS:** no separate CSS file means no cache-busting problem on redeploy — styles are always fresh with the HTML.

**Theming:** Light/dark via the CSS `color-scheme` property and `light-dark()`. A single set of variables in `:root` is resolved with `light-dark(light, dark)`; a `<meta name="color-scheme" content="light dark">` plus the `:root` default makes the page follow the OS. The toggle pins an explicit `color-scheme: light`/`dark` inline on `<html>` (persisted in `localStorage`, reapplied before paint to avoid a flash); toggling back to the scheme that matches the OS clears the override so the page follows the system again. The toggle icon (sun/moon) is also driven purely by `color-scheme` — two pseudo-elements whose visibility is switched with `light-dark()`.

**Typography:** Satoshi (self-hosted variable woff2) for the name and all text. The name (`.name`) enables `font-feature-settings: "ss01"` for Satoshi's spur-less alternate **G** (`ss01` also swaps lowercase `a`, but "Gleb Gorelov" has none). The old Playlist script font is retired.

**Full-height background (gotcha):** the page gradient is on `body { min-height: 100vh }`, NOT `html,body { height: 100% }` — the latter caps `body` to one viewport, so the gradient clips on scroll once content overflows. The fixed `.orbs` layer carries only the drifting blobs. The page gutter is the `--pad` variable (body padding + footer `padding-top`; the footer needs top padding only — `body` pads the bottom, don't double it).

**Tech-stack logos:** inline Simple Icons SVGs on small white tiles (keeps brand colors legible in both themes). Slugs: `openjdk` (Java — Simple Icons dropped the trademarked Java cup, so it's the Duke mark), `webcomponentsdotorg`, `css` (not `css3`). JavaScript's fill is darkened — its brand yellow is illegible on a white tile.

**Colors:** All color values use `oklch()`, wrapped in `light-dark()` for anything themed — keep both consistent when adding new colors. The two `<meta name="theme-color">` tags are the lone exception: they use hex (set per scheme via `media`, since `theme-color` accepts neither `oklch()` nor `light-dark()`) and must be hand-synced with `--bg-from` when the background changes.

**Contrast (WCAG):** no built-in check resolves `oklch()` contrast — compute ratios by converting `oklch()` → sRGB → relative luminance. For light-theme text over the background gradient the worst case is the *darker* stop `--bg-to` (closest in lightness to the text), not `--bg-from`.

**Social preview card:** `images/og-image.png` is a static, hand-generated render (dark aurora + the avatar on the left + the name in Satoshi), referenced by the Open Graph / Twitter tags in `<head>`. It is intentionally non-adaptive — a link scraper has no color-scheme to honor — and its `og:image`/`twitter:image` URLs are absolute, since scrapers fetch them server-side. No build step produces it; if the background palette or the wordmark changes, regenerate the PNG so the card stays in sync with the page.

**Regenerating `og-image.png`:** mirror the page's dark values + orbs/gradient + Satoshi (with `ss01`) + the avatar into a throwaway 1200×630 HTML mock, render it in a headless browser (served over HTTP, not `file://`, so `@font-face` + the photo load), wait for `document.fonts.ready`, then screenshot to PNG — commit only the PNG and discard the mock and any render artifacts.
