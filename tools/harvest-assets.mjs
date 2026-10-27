// harvest-assets.mjs - download the ORIGINAL of every Wix image the page models and site.json reference.
//   node tools/harvest-assets.mjs [--limit N] [--gap 250]
// Input: audit/extract-report.json images { original: { aliases, pages } } (written by tools/extract.mjs).
// One connection, a 250 ms gap; a 429 waits 30 s and retries at most twice; 401/403 are recorded and never retried.
// A file is accepted only when its magic bytes are an image. Saved as assets/source/<sanitised-id>.<ext>; wider than
// 2560 px -> re-encoded to 2560 px wide with ffmpeg (JPEG q=3 or PNG). Writes docs/data/images.json { images, failures }.
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../src/lib/site.mjs';
import { imageSize } from '../src/lib/images.mjs';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.concat([[v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]]) : a), []));
const GAP = Number(args.gap || 250);
const MAXW = 2560;
const rep = JSON.parse(fs.readFileSync(path.join(ROOT, 'audit/extract-report.json'), 'utf8'));
const outDir = path.join(ROOT, 'assets/source');
fs.mkdirSync(outDir, { recursive: true });
const prevPath = path.join(ROOT, 'docs/data/images.json');
let prev = { images: [] };
try { prev = JSON.parse(fs.readFileSync(prevPath, 'utf8')); } catch { /* first run */ }
const prevByUrl = new Map((prev.images || []).filter((r) => r.url && r.file && fs.existsSync(path.join(ROOT, r.file))).map((r) => [r.url, r]));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function get(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'user-agent': 'Mozilla/5.0 (site-reforge asset harvest)', accept: 'image/*,*/*;q=0.8' }, timeout: 60000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); resolve({ status: res.statusCode, location: new URL(res.headers.location, url).href }); return; }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks), type: res.headers['content-type'] || '' }));
      res.on('error', (e) => resolve({ status: 0, error: String(e) }));
    });
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', (e) => resolve({ status: 0, error: String(e) }));
  });
}
const magic = (b) => (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 ? 'jpg' : b.length > 8 && b.readUInt32BE(0) === 0x89504e47 ? 'png' : b.length > 6 && b.toString('ascii', 0, 3) === 'GIF' ? 'gif' : b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' ? 'webp' : null);
const sanitise = (id) => id.replace(/~mv2/g, '').replace(/\.[a-z0-9]+$/i, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 80);

const entries = Object.entries(rep.images || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1));
const limit = args.limit ? Number(args.limit) : entries.length;
const images = [];
const failures = [];
let n = 0;
for (const [url, info] of entries.slice(0, limit)) {
  n++;
  const id = decodeURIComponent(url.split('/media/')[1] || '');
  const had = prevByUrl.get(url);
  if (had) { images.push({ ...had, aliases: info.aliases, pages: info.pages }); continue; }
  let res = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await get(url);
    if (res.location) res = await get(res.location);
    if (res.status === 429 && attempt < 2) { console.log('429, waiting 30 s', url); await sleep(30000); continue; }
    break;
  }
  await sleep(GAP);
  if (res.status === 401 || res.status === 403 || res.status !== 200 || !res.body) { failures.push({ url, status: res.status, error: res.error || null, pages: info.pages }); console.log('FAIL', res.status, url); continue; }
  const ext = magic(res.body);
  if (!ext) { failures.push({ url, status: res.status, error: 'not an image (magic bytes; content-type ' + res.type + ')', pages: info.pages }); console.log('NOT IMAGE', url); continue; }
  let file = 'assets/source/' + sanitise(id) + '.' + ext;
  let buf = res.body;
  let dim = imageSize(buf) || {};
  const origDim = { width: dim.width || null, height: dim.height || null };
  let reencoded = false;
  if (dim.width > MAXW && (ext === 'jpg' || ext === 'png')) {
    const tmpIn = path.join(os.tmpdir(), 'sb-harvest-in.' + ext);
    const tmpOut = path.join(os.tmpdir(), 'sb-harvest-out.' + ext);
    fs.writeFileSync(tmpIn, buf);
    const a = ['-y', '-loglevel', 'error', '-i', tmpIn, '-vf', 'scale=' + MAXW + ':-2'].concat(ext === 'jpg' ? ['-q:v', '3'] : []).concat([tmpOut]);
    const r = spawnSync('ffmpeg', a, { encoding: 'utf8' });
    if (r.status === 0 && fs.existsSync(tmpOut)) { buf = fs.readFileSync(tmpOut); dim = imageSize(buf) || dim; reencoded = true; }
    else console.log('ffmpeg failed, keeping the original', url, (r.stderr || '').slice(0, 200));
  }
  fs.writeFileSync(path.join(ROOT, file), buf);
  images.push({ url, key: id.toLowerCase(), aliases: info.aliases, file, bytes: buf.length, width: dim.width || null, height: dim.height || null, original: reencoded ? { width: origDim.width, height: origDim.height, bytes: res.body.length } : undefined, pages: info.pages });
  if (n % 20 === 0) console.log(n + '/' + entries.length);
}
fs.mkdirSync(path.dirname(prevPath), { recursive: true });
fs.writeFileSync(prevPath, JSON.stringify({ generated: new Date().toISOString(), images, failures }, null, 1) + '\n');
console.log('harvest: images', images.length, '| failures', failures.length, '| bytes', images.reduce((a, r) => a + (r.bytes || 0), 0));
if (failures.length) process.exitCode = 1;
