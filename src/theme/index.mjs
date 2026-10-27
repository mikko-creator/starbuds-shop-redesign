// index.mjs - the page modules, in render order (FOUNDATION). Each exports render(ctx) -> [{ path, html }].
// Revision 2: every module in ALL that exists is rendered, so a lane can add its module without editing this file.
// sitemap stays last: it reads ctx.pages, the pages rendered before it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ALL = ['home', 'stores', 'states', 'content', 'resources', 'blog', 'sitemap'];
export const MODULES = ALL.filter((m) => fs.existsSync(path.join(here, m + '.mjs')));
