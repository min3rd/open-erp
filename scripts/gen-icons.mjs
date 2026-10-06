import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

/**
 * Vendors only the Feather icons the app actually uses into a generated TS file
 * (data, not a runtime dependency). Run after adding an icon:
 *
 *   npm run icons:gen
 *
 * Sources: the `IconName` enum values plus any literal `name="..."` passed to
 * <app-icon> in templates, so a stray literal can never render empty.
 */
const require = createRequire(new URL('../src/frontend/web/package.json', import.meta.url));
const feather = require('feather-icons');

const ENUM_FILE = join('src', 'frontend', 'shared', 'enums', 'icon.enum.ts');
const OUT_FILE = join('src', 'frontend', 'shared', 'components', 'icon', 'icon-data.generated.ts');
const ROOTS = ['src/frontend/shared', 'src/frontend/web/src', 'src/frontend/mobile/src'];

const names = new Set();
for (const match of readFileSync(ENUM_FILE, 'utf8').matchAll(/=\s*'([^']+)'/g)) {
  names.add(match[1]);
}

const walk = (dir) => {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (!/node_modules|dist|\.angular/.test(path)) walk(path);
    } else if (/\.html$/.test(entry)) {
      for (const match of readFileSync(path, 'utf8').matchAll(/<app-icon[^>]*\sname="([a-z0-9-]+)"/g)) {
        names.add(match[1]);
      }
    }
  }
};
ROOTS.forEach(walk);

const missing = [];
const entries = [...names].sort().map((name) => {
  const icon = feather.icons[name];
  if (!icon) {
    missing.push(name);
    return null;
  }
  return `  ${JSON.stringify(name)}: ${JSON.stringify(icon.contents)}`;
}).filter(Boolean);

if (missing.length) {
  console.error('Unknown feather icon names:', missing.join(', '));
  process.exit(1);
}

const file = `/**
 * GENERATED FILE — do not edit by hand. Run \`npm run icons:gen\`.
 *
 * Only the Feather icons this app uses are vendored here as data, so the
 * runtime bundle does not pull the whole icon set (TASK-361 follow-up).
 * feather-icons is MIT licensed, (c) 2013-2023 Cole Bemis.
 */
export const ICON_DATA: Readonly<Record<string, string>> = {
${entries.join(',\n')}
};
`;

writeFileSync(OUT_FILE, file, 'utf8');
console.log(`wrote ${entries.length} icons to ${OUT_FILE}`);
