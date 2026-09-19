import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const hook = fileURLToPath(new URL('./check-theme-color.mjs', import.meta.url));

function check(source) {
  const directory = mkdtempSync(path.join(tmpdir(), 'theme-color-'));
  try {
    const file = path.join(directory, 'index.html');
    writeFileSync(file, source);
    const result = spawnSync(process.execPath, [hook], {
      input: JSON.stringify({ tool_input: { file_path: file } }),
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test('the current palette matches its theme-color metadata', () => {
  assert.equal(check(html), '');
});

for (const [scheme, expected] of [['light', '#f5f2ea'], ['dark', '#171816']]) {
  test(`warns when ${scheme} theme-color drifts from the page background`, () => {
    const output = check(html.replace(`content="${expected}"`, 'content="#000000"'));
    assert.notEqual(output, '', 'Expected a palette drift warning');
    const message = JSON.parse(output).hookSpecificOutput.additionalContext;
    assert.ok(message.includes(`${scheme}:`));
    assert.ok(message.includes(`update it to ${expected}`));
  });
}
