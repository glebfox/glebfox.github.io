# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal landing page for Gleb Gorelov (glebfox.com), hosted on GitHub Pages. A static HTML "coming soon" page — no build system, no templating, no backend.

## Development

**No build step.** Open `index.html` directly in a browser to preview.

**Deployment:** Push to the `master` branch — GitHub Pages serves it automatically at glebfox.com (configured via `CNAME`).

## Architecture

Single-page site. Zero external dependencies — pure HTML/CSS/JS only.

**Files:**
- `index.html` — the entire page; includes inline JS for the theme toggle
- `css/style.css` — all styles; no minified copy (load directly)
- `fonts/Playlist-Script.*` — custom script font used for the `<h1>`
- `images/favicon/` — full favicon set

**Theming:** Light/dark toggle via `data-theme` attribute on `<html>`. CSS variables in `:root` (dark default) and `[data-theme="light"]` use `oklch()`. Preference is persisted in `localStorage`; initial value falls back to `prefers-color-scheme`.

**Colors:** All color values use `oklch()` — keep this consistent when adding new colors.
