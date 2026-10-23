import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { dictionaries } from '../app/i18n.mjs';
import { uiCopy } from '../app/ui-copy.mjs';

test('every UI language has all labels, including the no-API host workflow', () => {
  const keys = Object.keys(dictionaries.en).sort();
  for (const dictionary of Object.values(dictionaries)) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys);
    assert.ok(dictionary.hostHelp && dictionary.manualHelp && dictionary.returnToHost);
    assert.equal(dictionary.apiKey, undefined);
  }
});

test('new workbench states and recovery actions are translated in all four languages', () => {
  assert.deepEqual(Object.keys(uiCopy).sort(), Object.keys(dictionaries).sort());
  const keys = Object.keys(uiCopy.en).sort();
  for (const dictionary of Object.values(uiCopy)) {
    assert.deepEqual(Object.keys(dictionary).sort(), keys);
    for (const key of keys) assert.ok(typeof dictionary[key] === 'string' && dictionary[key].trim(), key);
  }
});

test('standalone workbench is executable with a matching CSP hash and no module fetches', async () => {
  const html = await readFile(new URL('../releases/Classroom-Commons.html', import.meta.url), 'utf8');
  const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert.doesNotThrow(() => new vm.Script(script));
  // HTML parsing normalizes Windows line endings before checking an inline CSP hash.
  const hash = createHash('sha256').update(script.replace(/\r\n?/g, '\n')).digest('base64');
  assert.ok(html.includes(`script-src 'sha256-${hash}'`));
  assert.equal(/<script[^>]+src=|<link[^>]+href="(?!data:)|@import\s|import\.meta/.test(html), false);
  assert.ok(html.includes('window.CLASSROOM_WORKER_SOURCE'));
  assert.equal(html, await readFile(new URL('../skills/classroom-commons/assets/workbench.html', import.meta.url), 'utf8'));
});

test('offline distribution embeds the complete bundled software notices', async () => {
  const html = await readFile(new URL('../releases/Classroom-Commons.html', import.meta.url), 'utf8');
  const notices = await readFile(new URL('../THIRD_PARTY_NOTICES.txt', import.meta.url), 'utf8');
  const embedded = html.match(/<template id="third-party-notices">([\s\S]*?)<\/template>/)?.[1];
  assert.equal(embedded, notices.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;'));
  for (const name of ['react ', 'react-dom ', 'lucide-react ', '@radix-ui/react-dialog ']) assert.ok(notices.includes(name), name);
});
