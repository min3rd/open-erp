import type { ExcelCell, ExcelDocument, ExcelSheet } from './types';

export function parseCsv(buffer: ArrayBuffer | Uint8Array): ExcelDocument {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let text = new TextDecoder('utf-8').decode(bytes);
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const delimiter = detectDelimiter(text);
  const rows = parseRows(text, delimiter);
  const cells = new Map<string, ExcelCell>();
  let maxRow = 0;
  let maxCol = 0;

  rows.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      if (!value) return;
      const ref = `${numberToColumn(colIndex + 1)}${rowIndex + 1}`;
      const numeric = Number(value.replace(/,/g, ''));
      const isNumber = value.trim() !== '' && Number.isFinite(numeric);
      cells.set(ref, {
        ref,
        row: rowIndex + 1,
        col: colIndex + 1,
        value: value,
        type: isNumber ? 'number' : 'string',
      });
      maxRow = Math.max(maxRow, rowIndex + 1);
      maxCol = Math.max(maxCol, colIndex + 1);
    });
  });

  const sheet: ExcelSheet = { name: 'Sheet1', cells, maxRow, maxCol, merges: [] };
  return { sheets: [sheet], warnings: [] };
}

function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const candidates = [',', ';', '\t'];
  return candidates.reduce((best, candidate) =>
    firstLine.split(candidate).length > firstLine.split(best).length ? candidate : best, ',');
}

function parseRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') { quoted = true; continue; }
    if (char === delimiter) { row.push(field); field = ''; continue; }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      continue;
    }
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function numberToColumn(value: number): string {
  let column = '';
  let current = value;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
}
