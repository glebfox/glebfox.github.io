---
name: theme-verify
description: Verify glebfox.com renders and behaves correctly across light, dark, and system-follow themes. Screenshots both schemes, asserts the theme toggle persists and CLEARS its override when returning to the OS scheme, checks responsive layout, and confirms per-scheme favicon/theme-color. Run before committing visual or theming changes to index.html.
disable-model-invocation: true
---

# theme-verify

Runtime verification for `index.html`'s theming. Static review belongs to the `landing-page-reviewer` subagent; this skill **renders** the page and exercises it in a real browser via the Playwright MCP tools.

## 1. Serve the site

Start the local server (matches `.claude/launch.json`) in the background from the project root, then use `http://localhost:3000` as the base URL:

```
npx serve -l 3000 .
```

If a server is already on :3000, reuse it. Tear down anything you started when finished.

## 2. Drive the browser

Use the Playwright MCP browser tools (`mcp__plugin_playwright_playwright__browser_*`). Run every check; capture a screenshot for each visual state so the user can eyeball it.

**A — Toggle logic (the core correctness test).** Navigate fresh, then via `browser_evaluate` assert and exercise the inline script's contract ([index.html](../../../index.html) toggle script):
1. Clean load: `localStorage.getItem('theme')` is `null` and `document.documentElement.style.colorScheme` is `''` (page follows the OS through CSS `color-scheme: light dark`).
2. Record the system scheme: `window.matchMedia('(prefers-color-scheme: dark)').matches`.
3. Click `#theme-toggle` once → an override **is set**: `colorScheme` is now `light`/`dark` (the opposite of the system scheme) and `localStorage.theme` matches it.
4. Click `#theme-toggle` again → the override **is cleared**: `colorScheme === ''` **and** `localStorage.theme === null` (returning to the system scheme drops the override so the page follows the OS again). This clear-on-return is the easiest behavior to regress — assert it explicitly.

**B — Both schemes render.** Emulate each OS preference and screenshot, so you see how the page looks when following the system (not just the toggle override). Use `browser_run_code_unsafe` to call `page.emulateMedia({ colorScheme: 'light' })`, reload, screenshot; repeat for `'dark'`. If media emulation is unavailable, force the scheme via `document.documentElement.style.colorScheme` instead and note that this exercises the override path rather than OS-follow.

**C — Responsive.** `browser_resize` to 375×667 (mobile) and 1280×800 (desktop). At each, screenshot and assert no horizontal overflow: `document.documentElement.scrollWidth <= window.innerWidth`.

**D — Per-scheme metadata.** Confirm the DOM declares **both** scheme variants for each: two `<meta name="theme-color">` (light/dark `media`) and two favicon `<link rel="icon">` (light/dark `media`). (The PostToolUse hook separately checks the `theme-color` hex matches `--bg-from`; here just confirm the pairs exist.)

**E — Reduced motion.** Emulate `prefers-reduced-motion: reduce` (via `browser_run_code_unsafe` → `page.emulateMedia({ reducedMotion: 'reduce' })`), reload, and confirm the orb drift and entrance animations are suppressed.

**F — Console.** Read `browser_console_messages`; there should be zero errors or warnings.

## 3. Report

Summarize each check (A–F) as PASS / FAIL with the observed values, and surface the screenshots inline. Call out any FAIL with a concrete fix and `index.html:LINE`. End with a one-line verdict on whether the theming is safe to ship.
