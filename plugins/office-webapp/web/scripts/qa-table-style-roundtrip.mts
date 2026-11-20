import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { saveDocx } from '../src/app/core/office/docx-save.ts';
import { applyTableStyle } from '../src/app/core/office/word-tables.ts';

const sample = process.argv[2] ?? 'sample.docx';
const preset = (process.argv[3] ?? 'accentHeader') as Parameters<typeof applyTableStyle>[2];
const bytes = fs.readFileSync(`D:/Projects/open-erp/plugins/office-webapp/web/samples/${sample}`);
const doc = await parseDocx(bytes);
const tableIndex = doc.blocks.findIndex((block) => block.kind === 'table');
if (tableIndex < 0) throw new Error('no table in sample');
const preview = fs.readFileSync('D:/Projects/open-erp/plugins/office-webapp/web/samples/sample-real-proposal.docx').length;
const applied = applyTableStyle(doc, tableIndex, preset, doc.theme ? { accent: doc.theme.accent, accents: doc.theme.accents, font: doc.theme.font } : undefined);
const saved = await saveDocx(doc, bytes);
const out = `D:/Projects/open-erp/plugins/office-webapp/web/.tmp/table-style-${preset}.docx`;
fs.writeFileSync(out, saved);
console.log(JSON.stringify({
  sample, preset, applied, tableIndex,
  theme: doc.theme ?? null,
  bytes: saved.length,
  out,
  proposalBytes: preview,
}, null, 1));
