# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal landing page for Gleb Gorelov (glebfox.com), hosted on GitHub Pages. A single static HTML page — introduction and portrait, three "What I do" areas, a smaller "Currently exploring" note, and a footer. No build system, no templating, no backend.

Keep copy understated and evergreen (no dates, counters, or links that rot); the only external links are GitHub and email.

## Development

**No build step.** Open `index.html` directly in a browser to preview.

**Local preview:** a tracked `.claude/launch.json` provides a `site` server (`npx serve`, port 3000) for in-browser verification.

**Force a theme when verifying:** set `localStorage.theme` to `light`/`dark` (or set `document.documentElement.style.colorScheme` inline on `<html>`) and reload; clear it to follow the OS again.

**Preview screenshots clip on scroll (gotcha):** the Claude Preview `preview_screenshot` tool renders a blank band (≈ the scroll offset) when the page is scrolled. Verify scroll-dependent layout by reading computed values, or with a viewport tall enough to fit everything (no scroll).

**`/theme-verify` screenshots are unreachable (gotcha):** the Playwright MCP `browser_take_screenshot` writes to the MCP server's own sandbox dir, not the repo — `Read` can't open them. Verify rendering via resolved computed values instead (`getComputedStyle`, or paint a CSS var onto a throwaway probe element to resolve it to rgb), which is also a stricter check than eyeballing pixels. Its local `npx serve -l 3000` is not persistent across turns — re-check and restart it before driving the browser.

**`modern-web-guidance` scope:** the mandatory search covers evolving CSS/JS APIs (this page's `light-dark()`/`oklch()`/animations) — it has no guides for static `<head>`/SEO/meta tags (canonical, Open Graph, `theme-color`, `description`), so expect empty results there and rely on standard knowledge.

**Deployment:** Push to the `master` branch — GitHub Pages serves it automatically at glebfox.com (configured via `CNAME`).

## Continuous integration

**Lighthouse CI:** `.github/workflows/lighthouse.yml` audits `index.html` on every push to `master` and on PRs, serving the repo root as a static site via `treosh/lighthouse-ci-action`. Budgets live in `lighthouserc.json`: accessibility / SEO / best-practices are hard-gated at 1.0; performance is warn-only (timing on shared CI runners fluctuates). Public repo → Actions minutes are free.

**Portrait sizing:** the single 448² asset supports the desktop portrait (208 × 240 CSS pixels), with a smaller mobile crop. Performance is warn-only; keep the existing AVIF/WebP/JPEG sources.

**Reduced motion:** the published site's 700ms fade and 20px entrance apply to `header`, the entire `main`, and `footer`, with 0/150/300ms delays. The entrance and link-arrow transitions run only under `prefers-reduced-motion: no-preference`. Reduced-motion users see fully opaque, stationary content immediately. The audit retains `--force-prefers-reduced-motion`; content is visible with or without it.

**Check the palette-drift hook:** `node --test .claude/hooks/check-theme-color.test.mjs` verifies that current colors pass and incorrect light/dark metadata produces a warning.

**Run the audit locally:** `npx -y @lhci/cli@latest collect --config=./lighthouserc.json && npx -y @lhci/cli@latest assert --config=./lighthouserc.json` — needs Chrome; the config's `chromeFlags` handle headless + reduced motion, so it mirrors CI. `.lighthouseci/` is gitignored.

## Architecture

Single-page site. Zero external dependencies — pure HTML/CSS/JS only.

**Files:**
- `index.html` — the entire page; all CSS inline in `<style>`, all JS inline in `<script>`, theme icons embedded as SVG CSS masks
- `fonts/Satoshi-Variable.woff2` — self-hosted Satoshi (variable, weights 300–900); the page's only web font, used for the name and all text (sourced from Fontshare)
- `images/photo.{avif,webp,jpg}` — 448² hero avatar served via `<picture>` (AVIF ~27K → WebP ~29K → JPEG ~75K fallback), generated with `npx sharp` at 448² from `images/photo.png` (1000² source, also used for the og card; no native image CLI installed); the picture occupies the right hero column on desktop and a compact slot beside the name on mobile, stacking above it when text needs more room
- `images/favicon/` — two adaptive SVG favicons (`favicon-light.svg` / `favicon-dark.svg`); the `<link rel="icon">` tags pick one via `prefers-color-scheme` (replaced the old PNG set)
- `images/og-image.png` — 1200×630 social-preview card (Open Graph / Twitter Card) referenced from `<head>`; a static dark editorial render: name and introduction on the left, portrait on the right

**Portrait formats:** if re-encoding or changing the source crop, regenerate AVIF, WebP, and JPEG together so browsers receive the same image. CSS-only framing needs no asset re-encode.

**Why inline CSS:** no separate CSS file means no cache-busting problem on redeploy — styles are always fresh with the HTML.

**Theming:** Light/dark via the CSS `color-scheme` property and `light-dark()`. A single set of variables in `:root` is resolved with `light-dark(light, dark)`; a `<meta name="color-scheme" content="light dark">` plus the `:root` default makes the page follow the OS. The toggle pins an explicit `color-scheme: light`/`dark` inline on `<html>` (persisted in `localStorage`, reapplied before paint to avoid a flash); toggling back to the scheme that matches the OS clears the override so the page follows the system again. The toggle icon (sun/moon) is also driven purely by `color-scheme` — two pseudo-elements whose visibility is switched with `light-dark()`.

**Storage availability:** reads and writes to `localStorage` are guarded. When storage is blocked, the page starts with the OS theme and the toggle still works for the current page; only persistence is unavailable. Keep these guards when changing theme behavior.

**List semantics:** retain `role="list"` on the work-area list because its CSS removes list markers.

**Typography:** Satoshi (self-hosted variable woff2) for the name and all text. The name (`.name`) enables `font-feature-settings: "ss01"` for Satoshi's spur-less alternate **G** (`ss01` also swaps lowercase `a`, but "Gleb Gorelov" has none). The old Playlist script font is retired. `body` sets `font-size-adjust: from-font` so the fallback's x-height matches Satoshi during the `font-display: swap`, preventing reflow (CLS) on the LCP `.name`.

**Layout:** the content width is 63rem. The desktop hero has text on the left and a modest rectangular portrait on the right. Three equal work columns become aligned rows below 56rem and stacked blocks below 36rem. On mobile, a named inline-size container on `main` keeps the portrait beside the name when at least 17rem of content width is available. Below that font-relative threshold, the portrait stacks above the centered name, matching DOM order. This preserves the compact layout at ordinary font sizes while accommodating enlarged text. Check mobile layouts with 200% root font size as well as the default size; headings and contact links must wrap without overlap or horizontal overflow. Browsers without container queries use the stacked layout. The introduction's vertical rule and amber segment repeat once beside "Currently exploring". The portrait has a warm padded frame, soft shadow, and a slight static tilt; a CSS filter gently reduces saturation without changing the source assets.

**Colors:** themed tokens use `oklch()` inside `light-dark()`. The solid backgrounds match warm paper `#f5f2ea` and charcoal `#171816`; the two `<meta name="theme-color">` tags mirror these values in hex. Primary text, secondary text, accent, and rules have dedicated tokens. No gradients, continuous background animation, or technology badges.

**Contrast (WCAG):** measure primary, secondary, and accent text against the solid background in both themes. All interactive controls have visible `:focus-visible` outlines; forced-colors mode preserves the theme icon and button border.

**Social preview card:** `images/og-image.png` is a static, hand-generated render (warm charcoal + the name in Satoshi on the left + the portrait on the right), referenced by the Open Graph / Twitter tags in `<head>`. It is intentionally non-adaptive — a link scraper has no color-scheme to honor — and its `og:image`/`twitter:image` URLs are absolute, since scrapers fetch them server-side. No build step produces it; if the background palette or the wordmark changes, regenerate the PNG so the card stays in sync with the page.

**Regenerating `og-image.png`:** mirror the page's dark palette + editorial rule + Satoshi (with `ss01`) + the framed portrait (including its CSS filter) into a throwaway 1200×630 HTML mock, render it in a headless browser (served over HTTP, not `file://`, so `@font-face` + the photo load), wait for `document.fonts.ready`, then screenshot to PNG — commit only the PNG and discard the mock and any render artifacts.
