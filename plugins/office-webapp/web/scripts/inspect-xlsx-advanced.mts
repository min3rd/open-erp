import fs from 'node:fs';
import { parseXlsx } from '../src/app/core/office/xlsx.ts';
import { parseDefinedNames, workbookProtected } from '../src/app/core/office/excel-names.ts';
import { parseConditionalRules } from '../src/app/core/office/conditional.ts';
import { descendants } from '../src/app/core/binary/xml.ts';
import { cellDisplayValue } from '../src/app/core/office/excel-format.ts';

const bytes = fs.readFileSync(process.argv[2]);
const excel = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const sheet = excel.sheets[0];
console.log(JSON.stringify({
  names: parseDefinedNames(excel),
  workbookProtected: workbookProtected(excel),
  sheetProtected: sheet.protected,
  sheetProtection: descendants(sheet.xmlRoot!, 'sheetProtection').map((node) => node.attrs),
  comments: [...(sheet.comments?.values() ?? [])],
  commentParts: {
    comments: excel.packageEntries?.get('xl/comments1.xml')?.length ?? 0,
    vml: excel.packageEntries?.get('xl/drawings/vmlDrawing1.vml')?.length ?? 0,
  },
  legacyDrawing: descendants(sheet.xmlRoot!, 'legacyDrawing').length,
  cfRules: parseConditionalRules(sheet),
  b2: { style: sheet.cells.get('B2')?.style, display: cellDisplayValue(sheet.cells.get('B2')!) },
}, null, 2));
