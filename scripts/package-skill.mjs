import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = async name => (await readFile(path.join(root, 'app', name), 'utf8')).replace(/\r\n?/g, '\n');
const common = { absWorkingDir: root, bundle: true, write: false, format: 'iife', platform: 'browser', target: 'es2022', minify: true, legalComments: 'inline' };
const worker = await build({ ...common, entryPoints: ['app/engine-worker.mjs'] });
const bundled = await build({
  ...common,
  entryPoints: ['app/app.mjs'],
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.svg': 'dataurl' },
  metafile: true
});

// Ship every bundled dependency's license, including transitive UI primitives.
const names = [...new Set(Object.keys(bundled.metafile.inputs).flatMap(input => {
  const normalized = input.replaceAll('\\', '/');
  const relative = normalized.split('node_modules/').at(-1);
  if (relative === normalized) return [];
  const parts = relative.split('/');
  return [parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]];
}))].sort();
let notices = 'Classroom Commons — bundled third-party software\n\n';
for (const name of names) {
  const directory = path.join(root, 'node_modules', name);
  const metadata = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8'));
  let license;
  for (const filename of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md', 'License']) {
    try { license = await readFile(path.join(directory, filename), 'utf8'); break; }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  if (!license) try {
    license = await readFile(path.join(root, 'scripts', 'licenses', name.replaceAll('/', '__') + '.txt'), 'utf8');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!license) throw new Error(`Missing distribution license: ${name}`);
  notices += `${name} ${metadata.version} (${metadata.license})\n${license.trim()}\n\n`;
}
notices += `Classroom Text / Classroom Display — OFL-1.1 font subsets\n${await read('fonts/OFL.txt')}\n`;
await writeFile(path.join(root, 'THIRD_PARTY_NOTICES.txt'), notices);
const script = (`window.CLASSROOM_WORKER_SOURCE=${JSON.stringify(worker.outputFiles[0].text)};\n${bundled.outputFiles[0].text}`)
  .replaceAll('</script', '<\\/script').replace(/\r\n?/g, '\n');
const hash = createHash('sha256').update(script).digest('base64');
const logo = 'data:image/svg+xml;base64,' + Buffer.from(await read('logo.svg')).toString('base64');
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
let styles = await read('style.css') + '\n' + await read('studio.css');
for (const name of ['classroom-text-regular', 'classroom-text-medium', 'classroom-text-bold', 'classroom-display']) {
  const bytes = await readFile(path.join(root, 'app/fonts', name + '.woff2'));
  styles = styles.replaceAll(`url('fonts/${name}.woff2')`, `url('data:font/woff2;base64,${bytes.toString('base64')}')`);
}
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'sha256-${hash}'; style-src 'unsafe-inline'; img-src data:; font-src data:; connect-src 'self' https: http://127.0.0.1:* http://localhost:*; worker-src blob:; frame-src 'self' blob:; object-src 'none'; base-uri 'none'">
<meta name="theme-color" content="#f7f6f2"><title>Classroom Commons</title><link rel="icon" href="${logo}"><style>${styles}</style></head>
<body><div id="app"></div><div id="toast" role="status" aria-live="polite"></div><template id="third-party-notices">${escape(notices)}</template><script>${script}</script></body></html>`;
await mkdir(path.join(root, 'releases'), { recursive: true });
await writeFile(path.join(root, 'releases', 'Classroom-Commons.html'), html);
await writeFile(path.join(root, 'skills', 'classroom-commons', 'assets', 'workbench.html'), html);
console.log(`Built standalone workbench (${Buffer.byteLength(html)} bytes); ${names.length} bundled packages, no remote UI assets. API is optional and opt-in.`);
