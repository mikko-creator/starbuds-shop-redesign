// data.mjs - load site.json (or the FOUNDATION stub until the DATA lane has written it)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.mjs';

export function loadSite() {
  for (const rel of ['src/content/site.json', 'src/content/site.stub.json']) {
    const f = path.join(ROOT, rel);
    if (!fs.existsSync(f)) continue;
    let site;
    try { site = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.error(`BUILD FAILED: ${rel} is not valid JSON: ${e.message}`); process.exit(1); }
    return { site, source: rel };
  }
  console.error('BUILD FAILED: neither src/content/site.json nor src/content/site.stub.json exists');
  process.exit(1);
}
