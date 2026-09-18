# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal landing page for Gleb Gorelov (glebfox.com), hosted on GitHub Pages. A single static HTML page — hero (avatar + name + intro + GitHub/Email), a "What I do" block grid, and a footer. No build system, no templating, no backend.

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

**Accepted Lighthouse warning:** "Properly size images" (`uses-responsive-images`) flags the avatar — the single 448² file backs the 224px retina box, but Lighthouse's emulated DPR reads it as oversized. (The hero crop zooms the image 1.18×, so effective density is ~1.71× on desktop and ~2.16× on mobile rather than a flat 2×.) Performance is warn-only so it never gates; don't add `srcset` densities for the single-digit-KB saving.

**Audit forces reduced motion (gotcha):** `lighthouserc.json` sets `chromeFlags: "--force-prefers-reduced-motion"`. The entrance animation (`@keyframes enter`) starts `header`/`main`/`footer` at `opacity: 0`, which never advances in headless Lighthouse → `NO_FCP` → the whole audit fails. Reduced motion makes content statically visible (the gated categories are motion-independent). Revisit this flag if that animation changes.

**Run the audit locally:** `npx -y @lhci/cli@latest collect --config=./lighthouserc.json && npx -y @lhci/cli@latest assert --config=./lighthouserc.json` — needs Chrome; the config's `chromeFlags` handle headless + reduced motion, so it mirrors CI. `.lighthouseci/` is gitignored.

## Architecture

Single-page site. Zero external dependencies — pure HTML/CSS/JS only.

**Files:**
- `index.html` — the entire page; all CSS inline in `<style>`, all JS inline in `<script>`, all icons inline as `<svg>`
- `fonts/Satoshi-Variable.woff2` — self-hosted Satoshi (variable, weights 300–900); the page's only web font, used for the name and all text (sourced from Fontshare)
- `images/photo.{avif,webp,jpg}` — 448² hero avatar served via `<picture>` (AVIF ~27K → WebP ~29K → JPEG ~75K fallback), generated with `npx sharp` at 448² from `images/photo.png` (1000² source, also used for the og card; the only image tools on this machine are `sips` and `cjpeg` — neither writes AVIF or WebP, so any re-encode needs `sharp` and must regenerate all three formats together or the `<picture>` will serve different crops per browser). `.hero picture` is the sizing box (border-radius + ring + `overflow: hidden`); `.photo` fills it and is zoomed with `transform: scale()` to crop past the street background, so the crop costs no bytes and needs no re-encode
- `images/favicon/` — two adaptive SVG favicons (`favicon-light.svg` / `favicon-dark.svg`); the `<link rel="icon">` tags pick one via `prefers-color-scheme` (replaced the old PNG set)
- `images/og-image.png` — 1200×630 social-preview card (Open Graph / Twitter Card) referenced from `<head>`; a static dark render: avatar on the left, the name in Satoshi on the right

**Why inline CSS:** no separate CSS file means no cache-busting problem on redeploy — styles are always fresh with the HTML.

**Theming:** Light/dark via the CSS `color-scheme` property and `light-dark()`. A single set of variables in `:root` is resolved with `light-dark(light, dark)`; a `<meta name="color-scheme" content="light dark">` plus the `:root` default makes the page follow the OS. The toggle pins an explicit `color-scheme: light`/`dark` inline on `<html>` (persisted in `localStorage`, reapplied before paint to avoid a flash); toggling back to the scheme that matches the OS clears the override so the page follows the system again. The toggle icon (sun/moon) is also driven purely by `color-scheme` — two pseudo-elements whose visibility is switched with `light-dark()`.

**Typography:** Satoshi (self-hosted variable woff2) for the name and all text. The name (`.name`) enables `font-feature-settings: "ss01"` for Satoshi's spur-less alternate **G** (`ss01` also swaps lowercase `a`, but "Gleb Gorelov" has none). The old Playlist script font is retired. `body` sets `font-size-adjust: from-font` so the fallback's x-height matches Satoshi during the `font-display: swap`, preventing reflow (CLS) on the LCP `.name`.

**Type scale:** the page previously jumped straight from the poster-sized `.name` to 13–15px small print with nothing in between. There is now a middle: card body 15px, intro 17px, card headings 17px, section heading 26px, footer 13px. Keep that middle register when adding copy — don't reintroduce sub-15px body text.

**Full-height background (gotcha):** the page gradient is on `body { min-height: 100vh }`, NOT `html,body { height: 100% }` — the latter caps `body` to one viewport, so the gradient clips on scroll once content overflows. The fixed `.orbs` layer carries only the drifting blobs. The page gutter is the `--pad` variable on the body; the footer sets its own `margin-top` + hairline `border-top` + `padding-top` and is width-matched to `main` (52rem) so the rule lines up with the content column — `body` pads the bottom, so don't add bottom padding there.

**Colors:** All color values use `oklch()`, wrapped in `light-dark()` for anything themed — keep both consistent when adding new colors. The two `<meta name="theme-color">` tags are the lone exception: they use hex (set per scheme via `media`, since `theme-color` accepts neither `oklch()` nor `light-dark()`) and must be hand-synced with `--bg-from` when the background changes.

**`light-dark()` takes colors only (gotcha):** it is defined for `<color>`, so feeding it bare numbers — `--orb-a: light-dark(0.42, 0.55)` for an `opacity` — is invalid and fails *silently*: the declaration is dropped and the property falls back to its initial value (`opacity: 1`), which looks like a design regression rather than a syntax error. To vary a non-color per scheme, fold it into a color instead: the orb alpha lives in `--orb-1..3` as `oklch(… / 0.42)` rather than in `.orb { opacity }`.

**Contrast (WCAG) — measure against the orb layer, not the gradient:** `.orbs` is `position: fixed`, so scrolling slides every text block across the whole orb field. Any text can end up over any part of it, which makes the field's luminance extremes genuinely reachable rather than a hypothetical worst case. Checking text against the bare `--bg-from`/`--bg-to` gradient therefore passes colors that fail on screen — `--muted` measured 5.3:1 against the bare gradient and 2.6:1 over the field.

**How to measure it:** reconstruct the field with the browser's own rasterizer instead of modelling the blur. In the page, paint `body`'s gradient into a `<canvas>`, then for each `.orb` read its `getBoundingClientRect()` and computed `background-color` / `filter` and redraw it with `ctx.filter = 'blur(80px)'`; `getImageData` over the result gives the true min/max luminance, which is what each text color must clear. Two traps make a hand-rolled version silently wrong:

- `getComputedStyle(el).color` returns an **`oklch(...)`/`oklab(...)` string**, not `rgb()`. Parsing the first three numbers yields `0.95, 0.01, 260` read as RGB — plausible-looking garbage. Convert by painting the color into a 1×1 canvas and reading the pixel back.
- Analytic Gaussian approximations of `blur()` are easy to get subtly wrong; drawing through `ctx.filter` uses the same implementation the page does.

**Don't de-emphasise text with `opacity`:** element `opacity` composites the text with whatever is behind it, so its effective contrast moves with the orb field — `.do-item p` at `opacity: 0.8` fell to 3.6:1 in the light theme. Use a tuned color (`--muted`) instead; the de-emphasis reads the same and the ratio holds.

**Tinted surfaces:** for text on a tint (e.g. `.btn-primary`, whose text is `--accent` over a `color-mix(--accent 12%, transparent)` fill), composite the tint over the field first and check the result explicitly — it runs well below the bare-backdrop figure.

**Social preview card:** `images/og-image.png` is a static, hand-generated render (dark aurora + the avatar on the left + the name in Satoshi), referenced by the Open Graph / Twitter tags in `<head>`. It is intentionally non-adaptive — a link scraper has no color-scheme to honor — and its `og:image`/`twitter:image` URLs are absolute, since scrapers fetch them server-side. No build step produces it; if the background palette or the wordmark changes, regenerate the PNG so the card stays in sync with the page.

**Regenerating `og-image.png`:** mirror the page's dark values + orbs/gradient + Satoshi (with `ss01`) + the avatar into a throwaway 1200×630 HTML mock, render it in a headless browser (served over HTTP, not `file://`, so `@font-face` + the photo load), wait for `document.fonts.ready`, then screenshot to PNG — commit only the PNG and discard the mock and any render artifacts.
