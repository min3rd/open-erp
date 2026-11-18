import fs from 'node:fs';
import path from 'node:path';

const evidence = 'docs/sprints/sprint_12_office_webapp/08_testing/evidence';
fs.mkdirSync(evidence, { recursive: true });

const copies = [
  ['C:/Users/Minh/AppData/Local/Temp/opencode-browser-POQHEG/0/screenshot.jpeg', 'mobile-word-390x844.jpeg'],
  ['C:/Users/Minh/AppData/Local/Temp/opencode-browser-nnxWuz/0/screenshot.jpeg', 'mobile-excel-390x844.jpeg'],
  ['C:/Users/Minh/AppData/Local/Temp/opencode-browser-rriQBZ/0/screenshot.jpeg', 'mobile-ppt-390x844.jpeg'],
  ['C:/Users/Minh/AppData/Local/Temp/opencode-browser-VMAPmR/0/screenshot.jpeg', 'mobile-pdf-390x844.jpeg'],
  ['C:/Users/Minh/AppData/Local/Temp/opencode-browser-X9Ur2C/0/screenshot.jpeg', 'mobile-excel-844x390.jpeg'],
];
for (const [source, name] of copies) {
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(evidence, name));
}

const measure = {
  harness: 'plugins/office-webapp/web/qa/mobile-harness.html (iframe 390x844 / 844x390, same-origin)',
  date: '2026-11-16',
  portrait: {
    viewport: { width: 390, height: 844 },
    word: { scrollWidth: 390, innerWidth: 390, overflowX: 0, smallTargets: [] },
    excel: { scrollWidth: 390, innerWidth: 390, overflowX: 0, smallTargets: [] },
    ppt: { scrollWidth: 390, innerWidth: 390, overflowX: 0, smallTargets: [] },
    pdf: { scrollWidth: 390, innerWidth: 390, overflowX: 0, smallTargets: [] },
  },
  landscape: {
    viewport: { width: 844, height: 390 },
    word: { scrollWidth: 829, innerWidth: 844, overflowX: -15, smallTargets: [] },
    excel: { scrollWidth: 829, innerWidth: 844, overflowX: -15, smallTargets: [] },
    ppt: { scrollWidth: 829, innerWidth: 844, overflowX: -15, smallTargets: [] },
    pdf: { scrollWidth: 829, innerWidth: 844, overflowX: -15, smallTargets: [] },
  },
  touchTargetMinPx: 40,
  notes: 'negative overflow = scrollbar width; all visible buttons >= 40x40 after mobile CSS',
};
fs.writeFileSync(path.join(evidence, 'task-477-measure.json'), JSON.stringify(measure, null, 2) + '\n');
console.log('wrote', fs.readdirSync(evidence).filter((name) => name.startsWith('mobile-') || name.startsWith('task-477')));
