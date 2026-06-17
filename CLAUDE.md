# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal landing page for Gleb Gorelov (glebfox.com), hosted on GitHub Pages. A static HTML "coming soon" page — no build system, no templating, no backend.

## Development

**No build step.** Open `index.html` directly in a browser to preview.

**Local preview:** a tracked `.claude/launch.json` provides a `site` server (`npx serve`, port 3000) for in-browser verification.

**Deployment:** Push to the `master` branch — GitHub Pages serves it automatically at glebfox.com (configured via `CNAME`).

## Architecture

Single-page site. Zero external dependencies — pure HTML/CSS/JS only.

**Files:**
- `index.html` — the entire page; all CSS is inline in `<style>`, all JS is inline in `<script>`
- `fonts/Playlist-Script.ttf.woff` — custom script font for the `<h1>` (woff only; no woff2/ttf)
- `images/favicon/` — full favicon set

**Why inline CSS:** no separate CSS file means no cache-busting problem on redeploy — styles are always fresh with the HTML.

**Theming:** Light/dark via the CSS `color-scheme` property and `light-dark()`. A single set of variables in `:root` is resolved with `light-dark(light, dark)`; a `<meta name="color-scheme" content="light dark">` plus the `:root` default makes the page follow the OS. The toggle pins an explicit `color-scheme: light`/`dark` inline on `<html>` (persisted in `localStorage`, reapplied before paint to avoid a flash); toggling back to the scheme that matches the OS clears the override so the page follows the system again. The toggle icon (sun/moon) is also driven purely by `color-scheme` — two pseudo-elements whose visibility is switched with `light-dark()`.

**Colors:** All color values use `oklch()`, wrapped in `light-dark()` for anything themed — keep both consistent when adding new colors.
