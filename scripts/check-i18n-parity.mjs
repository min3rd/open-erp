import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * i18n parity gate (Sprint 04, FEAT-29). Compares every locale dictionary in an
 * app against the `en` reference and reports missing/extra keys + coverage.
 *
 *   node scripts/check-i18n-parity.mjs           # report only
 *   node scripts/check-i18n-parity.mjs --strict  # fail when a locale is < 100%
 *
 * A locale is only released when it reaches 100% (customer decision), so run
 * `--strict` in CI/release.
 */
const APPS = ['web', 'mobile'];
const REFERENCE = 'en';
const strict = process.argv.includes('--strict');

let failed = false;

for (const app of APPS) {
  const dir = join('src', 'frontend', app, 'public', 'i18n');
  const files = readdirSync(dir).filter((name) => name.endsWith('.json'));
  const dictionaries = new Map();
  for (const file of files) {
    dictionaries.set(file.replace(/\.json$/, ''), JSON.parse(readFileSync(join(dir, file), 'utf8')));
  }
  const reference = dictionaries.get(REFERENCE);
  if (!reference) {
    console.error(`${app}: reference dictionary ${REFERENCE}.json is missing`);
    failed = true;
    continue;
  }
  const referenceKeys = new Set(Object.keys(reference));
  console.log(`\n${app} (reference ${REFERENCE}: ${referenceKeys.size} keys)`);
  for (const [locale, dictionary] of [...dictionaries].sort()) {
    if (locale === REFERENCE) {
      continue;
    }
    const keys = new Set(Object.keys(dictionary));
    const missing = [...referenceKeys].filter((key) => !keys.has(key));
    const extra = [...keys].filter((key) => !referenceKeys.has(key));
    const coverage = ((referenceKeys.size - missing.length) / referenceKeys.size) * 100;
    const status = missing.length === 0 && extra.length === 0 ? 'OK' : 'INCOMPLETE';
    console.log(`  ${locale}: ${coverage.toFixed(1)}% missing=${missing.length} extra=${extra.length} [${status}]`);
    if (missing.length) {
      console.log(`    missing: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ', …' : ''}`);
    }
    if (status === 'INCOMPLETE' && strict) {
      failed = true;
    }
  }
}

if (failed) {
  console.error('\ni18n parity check FAILED (strict: a locale is not at 100%).');
  process.exit(1);
}
console.log('\ni18n parity check done.');
