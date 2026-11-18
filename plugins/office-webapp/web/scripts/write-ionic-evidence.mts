import fs from 'node:fs';
import path from 'node:path';

const evidence = 'docs/sprints/sprint_12_office_webapp/08_testing/evidence';
const copies = [
  ['C:/Users/Minh/AppData/Local/Temp/opencode-browser-8JMGb3/0/screenshot.jpeg', 'ionic-office-word-390x844.jpeg'],
  ['C:/Users/Minh/AppData/Local/Temp/opencode-browser-C2cXBH/0/screenshot.jpeg', 'ionic-office-excel-390x844.jpeg'],
  ['C:/Users/Minh/AppData/Local/Temp/opencode-browser-UvbeLf/0/screenshot.jpeg', 'ionic-office-ppt-390x844.jpeg'],
  ['C:/Users/Minh/AppData/Local/Temp/opencode-browser-65KSIb/0/screenshot.jpeg', 'ionic-office-pdf-390x844.jpeg'],
];
for (const [source, name] of copies) {
  if (fs.existsSync(source)) fs.copyFileSync(source, path.join(evidence, name));
}

const measure = {
  harness: 'src/frontend/mobile/public/qa/viewer-harness.html (iframe 390x844, same-origin dev server http://localhost:4321)',
  route: '/office/viewer',
  date: '2026-11-16',
  results: {
    word: { scrollWidth: 390, innerWidth: 390, overflowX: 0, buttons: 4, smallTargets: [], title: 'sample.docx' },
    excel: { scrollWidth: 390, innerWidth: 390, overflowX: 0, buttons: 6, smallTargets: [], title: 'sample.xlsx' },
    ppt: { scrollWidth: 390, innerWidth: 390, overflowX: 0, buttons: 6, smallTargets: [], title: 'sample.pptx', shapes: 2 },
    pdf: { scrollWidth: 390, innerWidth: 390, overflowX: 0, buttons: 6, smallTargets: [], title: 'sample.pdf' },
  },
  notes: 'Ionic page lazy chunk office-viewer-page 33.67 kB production; imports parser from @plugins/office-webapp/* (no duplicate).',
};
fs.writeFileSync(path.join(evidence, 'task-477-ionic-viewer.json'), JSON.stringify(measure, null, 2) + '\n');
console.log('wrote ionic evidence');
