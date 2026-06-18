#!/usr/bin/env node
// PostToolUse hook — non-blocking advisory.
//
// `theme-color` <meta> tags accept neither oklch() nor light-dark(), so their hex
// values are hand-synced with --bg-from (see CLAUDE.md). This catches drift: when
// index.html changes, it resolves --bg-from (light/dark) to sRGB hex and warns if
// the declared theme-color has fallen out of sync — printing the exact value to use.
// It never blocks the edit (the tool has already run by PostToolUse time).

import { readFileSync } from 'node:fs';
import path from 'node:path';

const TOLERANCE = 6; // per-channel difference (0-255) tolerated before warning

// ── stdin → payload ──────────────────────────────────────────
let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0); // no/garbled stdin → nothing to do
}

const filePath = payload?.tool_input?.file_path;
if (!filePath || path.basename(filePath) !== 'index.html') process.exit(0);

let html;
try {
  html = readFileSync(filePath, 'utf8');
} catch {
  process.exit(0); // file vanished/unreadable → don't fail the edit
}

// ── color math: oklch → sRGB hex (pure, no deps) ─────────────
function toSrgb8(linear) {
  const x = Math.min(1, Math.max(0, linear)); // clamp into gamut before transfer
  const s = x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, s)) * 255);
}

function oklchToRgb(L, C, H) {
  const hr = (H * Math.PI) / 180;
  const a = C * Math.cos(hr);
  const b = C * Math.sin(hr);
  // OKLab → LMS' (Björn Ottosson)
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;
  // LMS → linear sRGB
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return [toSrgb8(r), toSrgb8(g), toSrgb8(bl)];
}

function parseOklch(str) {
  // oklch(L[%] C[%] H[deg]) — alpha (/ A) is ignored; --bg-from has none
  const m = str.match(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)(%?)\s+([\d.]+)/i);
  if (!m) return null;
  let L = parseFloat(m[1]);
  if (m[2] === '%') L /= 100;
  let C = parseFloat(m[3]);
  if (m[4] === '%') C = (C / 100) * 0.4; // CSS: 100% chroma === 0.4
  const H = parseFloat(m[5]);
  return oklchToRgb(L, C, H);
}

function toHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

function parseHex(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function lineOf(needle) {
  const i = html.indexOf(needle);
  return i === -1 ? null : html.slice(0, i).split('\n').length;
}

// ── extract declared theme-color metas ───────────────────────
const declared = {}; // { light: {hex, line}, dark: {...} }
for (const tag of html.match(/<meta\b[^>]*name=["']theme-color["'][^>]*>/gi) || []) {
  const scheme = (tag.match(/prefers-color-scheme:\s*(light|dark)/i) || [])[1];
  const content = (tag.match(/content=["'](#[0-9a-fA-F]{3,8})["']/i) || [])[1];
  if (scheme && content) declared[scheme.toLowerCase()] = { hex: content, line: lineOf(tag) };
}

// ── extract --bg-from light-dark pair ────────────────────────
const bg = html.match(
  /--bg-from\s*:\s*light-dark\(\s*(oklch\([^)]*\))\s*,\s*(oklch\([^)]*\))\s*\)/i
);
if (!bg) process.exit(0); // structure changed → nothing reliable to check

const expected = { light: parseOklch(bg[1]), dark: parseOklch(bg[2]) };

// ── compare & report ─────────────────────────────────────────
const warnings = [];
for (const scheme of ['light', 'dark']) {
  const exp = expected[scheme];
  const dec = declared[scheme];
  if (!exp || !dec) continue;
  const want = parseHex(toHex(exp));
  const have = parseHex(dec.hex);
  const drift = want.some((v, i) => Math.abs(v - have[i]) > TOLERANCE);
  if (drift) {
    const at = dec.line ? ` (line ${dec.line})` : '';
    warnings.push(
      `${scheme}: <meta name="theme-color"> is ${dec.hex}${at} but --bg-from ${scheme} resolves to ${toHex(exp)} — update it to ${toHex(exp)}`
    );
  }
}

if (warnings.length) {
  const message =
    'theme-color / --bg-from drift in index.html (theme-color cannot use oklch()/light-dark(), so they are hand-synced):\n  ' +
    warnings.join('\n  ') +
    `\n(oklch→sRGB, tolerance ${TOLERANCE}/channel)`;
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: message },
    })
  );
}

process.exit(0);
