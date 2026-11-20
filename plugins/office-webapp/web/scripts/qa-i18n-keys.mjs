/**
 * Checks that every i18n key referenced by the Word UI exists in the dictionary
 * served to the app (public/i18n). Catches a half-broken dictionary after edits.
 *
 *   node scripts/qa-i18n-keys.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const appDir = path.resolve(here, '../src/app');
const ribbonDir = path.resolve(appDir, 'core/office');
const dictDir = 'D:/Projects/open-erp/src/frontend/web/public/i18n';

const files = [
  path.join(appDir, 'office-webapp.component.html'),
  ...fs.readdirSync(ribbonDir).filter((name) => name.endsWith('.ts')).map((name) => path.join(ribbonDir, name)),
];
const keys = new Set();
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/'(office\.[a-zA-Z0-9_.]+)'/g)) {
    // Keys ending with '.' are prefixes concatenated at runtime (e.g. 'office.app.' + app()).
    if (!match[1].endsWith('.')) keys.add(match[1]);
  }
}

const report = {};
for (const lang of ['vi', 'en']) {
  const dict = JSON.parse(fs.readFileSync(path.join(dictDir, `${lang}.json`), 'utf8').replace(/^\uFEFF/, ''));
  const missing = [...keys].filter((key) => dict[key] === undefined).sort();
  report[lang] = { keys: keys.size, missing: missing.length, sample: missing.slice(0, 10) };
}
console.log(JSON.stringify(report, null, 1));
process.exit(report.vi.missing || report.en.missing ? 1 : 0);
