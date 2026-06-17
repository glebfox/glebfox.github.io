#!/usr/bin/env node
// PreToolUse hook — guards the custom-domain pointer.
//
// CNAME holds the GitHub Pages custom domain (glebfox.com). An accidental edit
// silently breaks the live domain on the next push. This requires explicit
// confirmation before any Edit/Write/MultiEdit touches CNAME; intentional
// changes proceed on confirm, accidents get caught.

import { readFileSync } from 'node:fs';
import path from 'node:path';

let payload;
try {
  payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0); // no/garbled stdin → don't interfere
}

const filePath = payload?.tool_input?.file_path;
if (!filePath || path.basename(filePath) !== 'CNAME') process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'ask',
      permissionDecisionReason:
        'CNAME holds the GitHub Pages custom domain (glebfox.com). An accidental change breaks the live site on the next push. Confirm this edit is intentional.',
    },
  })
);

process.exit(0);
