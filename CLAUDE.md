# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal landing page for Gleb Gorelov (glebfox.com), hosted on GitHub Pages. A static HTML "coming soon" page — no build system, no templating, no backend.

## Development

**No build step.** Open `index.html` directly in a browser to preview.

**Local preview:** a tracked `.claude/launch.json` provides a `site` server (`npx serve`, port 3000) for in-browser verification.

**Force a theme when verifying:** set `localStorage.theme` to `light`/`dark` (or set `document.documentElement.style.colorScheme` inline on `<html>`) and reload; clear it to follow the OS again.

**`modern-web-guidance` scope:** the mandatory search covers evolving CSS/JS APIs (this page's `light-dark()`/`oklch()`/animations) — it has no guides for static `<head>`/SEO/meta tags (canonical, Open Graph, `theme-color`, `description`), so expect empty results there and rely on standard knowledge.

**Deployment:** Push to the `master` branch — GitHub Pages serves it automatically at glebfox.com (configured via `CNAME`).

## Architecture

Single-page site. Zero external dependencies — pure HTML/CSS/JS only.

**Files:**
- `index.html` — the entire page; all CSS is inline in `<style>`, all JS is inline in `<script>`
- `fonts/Playlist-Script.ttf.woff` — custom script font for the `<h1>` (woff only; no woff2/ttf)
- `images/favicon/` — two adaptive SVG favicons (`favicon-light.svg` / `favicon-dark.svg`); the `<link rel="icon">` tags pick one via `prefers-color-scheme` (replaced the old PNG set)
- `images/og-image.png` — 1200×630 social-preview card (Open Graph / Twitter Card) referenced from `<head>`; a static dark render of the page (aurora background + the name in the script font)

**Why inline CSS:** no separate CSS file means no cache-busting problem on redeploy — styles are always fresh with the HTML.

**Theming:** Light/dark via the CSS `color-scheme` property and `light-dark()`. A single set of variables in `:root` is resolved with `light-dark(light, dark)`; a `<meta name="color-scheme" content="light dark">` plus the `:root` default makes the page follow the OS. The toggle pins an explicit `color-scheme: light`/`dark` inline on `<html>` (persisted in `localStorage`, reapplied before paint to avoid a flash); toggling back to the scheme that matches the OS clears the override so the page follows the system again. The toggle icon (sun/moon) is also driven purely by `color-scheme` — two pseudo-elements whose visibility is switched with `light-dark()`.

**Colors:** All color values use `oklch()`, wrapped in `light-dark()` for anything themed — keep both consistent when adding new colors. The two `<meta name="theme-color">` tags are the lone exception: they use hex (set per scheme via `media`, since `theme-color` accepts neither `oklch()` nor `light-dark()`) and must be hand-synced with `--bg-from` when the background changes.

**Contrast (WCAG):** no built-in check resolves `oklch()` contrast — compute ratios by converting `oklch()` → sRGB → relative luminance. For light-theme text over the background gradient the worst case is the *darker* stop `--bg-to` (closest in lightness to the text), not `--bg-from`.

**Social preview card:** `images/og-image.png` is a static, hand-generated render (dark aurora + the name in the script font), referenced by the Open Graph / Twitter tags in `<head>`. It is intentionally non-adaptive — a link scraper has no color-scheme to honor — and its `og:image`/`twitter:image` URLs are absolute, since scrapers fetch them server-side. No build step produces it; if the background palette or the wordmark changes, regenerate the PNG so the card stays in sync with the page.

**Regenerating `og-image.png`:** mirror the page's dark values + orbs/gradient/script font into a throwaway 1200×630 HTML mock, render it in a headless browser (served over HTTP, not `file://`, so the `@font-face` woff loads), wait for `document.fonts.ready`, then screenshot to PNG — commit only the PNG and discard the mock and any render artifacts.
