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
- `index.html` — the entire page; all CSS is inline in `<style>`, all JS is inline in `<script>`
- `fonts/Playlist-Script.*` — custom script font used for the `<h1>`
- `images/favicon/` — full favicon set

**Why inline CSS:** no separate CSS file means no cache-busting problem on redeploy — styles are always fresh with the HTML.

**Theming:** Light/dark via the CSS `color-scheme` property and `light-dark()`. A single set of variables in `:root` is resolved with `light-dark(light, dark)`; the default `color-scheme: light dark` follows the OS. The toggle writes an explicit `color-scheme: light`/`dark` inline on `<html>`, persisted in `localStorage` and reapplied before paint to avoid a flash. The toggle icon (sun/moon) is also driven purely by `color-scheme` — two pseudo-elements whose visibility is switched with `light-dark()`.

**Colors:** All color values use `oklch()`, wrapped in `light-dark()` for anything themed — keep both consistent when adding new colors.
