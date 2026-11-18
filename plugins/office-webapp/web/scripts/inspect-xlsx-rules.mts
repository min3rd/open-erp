import fs from 'node:fs';
import { parseXlsx } from '../src/app/core/office/xlsx.ts';
import { parseConditionalRules } from '../src/app/core/office/conditional.ts';
import { parseValidations } from '../src/app/core/office/validation.ts';
import { filterTableRows, slicerValues } from '../src/app/core/office/excel-table.ts';

const bytes = fs.readFileSync(process.argv[2]);
const excel = await parseXlsx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const sheet = excel.sheets[0];
const cf = parseConditionalRules(sheet);
const dv = parseValidations(sheet);
const table = excel.analysis?.tables[0];
const rows = table ? filterTableRows(sheet, table, excel.analysis?.slicers ?? []) : [];
console.log(JSON.stringify({
  analysis: excel.analysis ?? null,
  cf: cf.map((rule) => ({ type: rule.type, operator: rule.operator, formulas: rule.formulas })),
  dv: dv.map((rule) => ({ type: rule.type, operator: rule.operator, ranges: rule.ranges, formula1: rule.formula1, formula2: rule.formula2 })),
  slicerValues: table ? slicerValues(sheet, table, 0) : [],
  filteredRows: rows,
}, null, 2));
