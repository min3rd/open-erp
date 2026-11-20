import fs from 'node:fs';
import { WORD_RIBBON } from '../src/app/core/office/word-ribbon.ts';

const component = fs.readFileSync('src/app/office-webapp.component.ts', 'utf8');
const audit = fs.readFileSync('../../../docs/sprints/sprint_12_office_webapp/03_benchmarks/04_AUDIT-S12-001_m365_web_command_coverage.md', 'utf8');
const vi = JSON.parse(fs.readFileSync('../../../src/frontend/web/public/i18n/vi.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('../../../src/frontend/web/public/i18n/en.json', 'utf8'));

const start = component.indexOf('runWordCommand(id: string): void {');
const end = component.indexOf('selectSheet(index: number): void', start);
const dispatched = new Set([...component.slice(start, end).matchAll(/case '([^']+)'/g)].map((match) => match[1]));
const items = WORD_RIBBON.flatMap((tab) => tab.groups.flatMap((group) => group.items));
const actionable = items.filter((item) => !item.control && !item.disabled);
const missing = actionable.filter((item) => !dispatched.has(item.id)).map((item) => item.id);

const keys = new Set(WORD_RIBBON.flatMap((tab) => [
  tab.labelKey,
  ...tab.groups.flatMap((group) => [group.labelKey, ...group.items.map((item) => item.labelKey)]),
]));
const missingVi = [...keys].filter((key) => vi[key] === undefined);
const missingEn = [...keys].filter((key) => en[key] === undefined);

const service = audit.split(/\r?\n/)
  .filter((line) => /^\| W-A\d+/.test(line) && line.includes('SERVICE'))
  .map((line) => {
    const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
    return { code: cells[0], group: cells[1], reason: cells[3] };
  });

const report = {
  generated_at: new Date().toISOString(),
  ribbon: {
    tabs: WORD_RIBBON.length,
    base_tabs: WORD_RIBBON.filter((tab) => !['table', 'picture', 'shape'].includes(tab.id)).length,
    contextual_tabs: WORD_RIBBON.filter((tab) => ['table', 'picture', 'shape'].includes(tab.id)).map((tab) => tab.id),
    groups: WORD_RIBBON.reduce((sum, tab) => sum + tab.groups.length, 0),
    items: items.length,
    actionable_items: actionable.length,
    controls: items.filter((item) => item.control).length,
    disabled: items.filter((item) => item.disabled).map((item) => item.id),
    dispatched_commands: dispatched.size,
    missing_dispatch: missing,
  },
  i18n: { ribbon_keys: keys.size, missing_vi: missingVi, missing_en: missingEn },
  service_exclusions: service,
};
fs.mkdirSync('../../../docs/sprints/sprint_12_office_webapp/08_testing/evidence', { recursive: true });
fs.writeFileSync('../../../docs/sprints/sprint_12_office_webapp/08_testing/evidence/word-command-audit.json',
  JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (missing.length || missingVi.length || missingEn.length) process.exit(1);
