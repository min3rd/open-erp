import { attr, descendants, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import { readZip } from '../binary/zip';
import type { CellStyle, ExcelCell, ExcelDocument, ExcelSheet } from './types';
import { parseExcelAnalysis } from './xlsx-analysis';
import { parseCellStyleMap } from './excel-format';
import { parseSheetComments } from './excel-comments';

export async function parseXlsx(buffer: ArrayBuffer | Uint8Array): Promise<ExcelDocument> {
  const zip = await readZip(buffer);
  const workbookBytes = zip.entries.get('xl/workbook.xml');
  if (!workbookBytes) throw new Error('OFFICE_XLSX_PARSE_FAILED');
  const workbook = parseXml(new TextDecoder('utf-8').decode(workbookBytes));
  const rels = parseRelations(zip.entries.get('xl/_rels/workbook.xml.rels'));
  const sharedStrings = parseSharedStrings(zip.entries.get('xl/sharedStrings.xml'));
  const cellStyles = parseCellStyleMap(zip.entries);
  const warnings: string[] = [];

  const sheetsNode = findChild(workbook, 'workbook');
  const sheetNodes = findChildren(findChild(sheetsNode, 'sheets'), 'sheet');
  const sheets: ExcelSheet[] = [];
  for (const sheetNode of sheetNodes) {
    const name = attr(sheetNode, 'name') ?? `Sheet${sheets.length + 1}`;
    const relId = attr(sheetNode, 'r:id');
    const target = relId ? rels.get(relId) : undefined;
    const path = target ? normalizeTarget(target) : `xl/worksheets/sheet${sheets.length + 1}.xml`;
    const bytes = zip.entries.get(path);
    if (!bytes) {
      warnings.push(`SHEET_MISSING:${name}`);
      sheets.push({ name, cells: new Map(), maxRow: 0, maxCol: 0, merges: [], path });
      continue;
    }
    sheets.push(parseSheet(name, bytes, sharedStrings, path, cellStyles, zip.entries));
  }
  const document: ExcelDocument = { sheets, warnings, packageEntries: zip.entries, workbookRoot: sheetsNode ?? workbook };
  document.analysis = parseExcelAnalysis(zip.entries, document);
  return document;
}

function parseSheet(name: string, bytes: Uint8Array, sharedStrings: string[], path: string,
                    cellStyles: Map<number, CellStyle>, entries: Map<string, Uint8Array>): ExcelSheet {
  const doc = parseXml(new TextDecoder('utf-8').decode(bytes));
  const worksheet = findChild(doc, 'worksheet') ?? doc;
  const cells = new Map<string, ExcelCell>();
  let maxRow = 0;
  let maxCol = 0;

  for (const rowNode of findChildren(findChild(worksheet, 'sheetData'), 'row')) {
    const rowAttr = Number(attr(rowNode, 'r') ?? 0);
    for (const cellNode of findChildren(rowNode, 'c')) {
      const ref = attr(cellNode, 'r') ?? '';
      const position = parseCellRef(ref);
      const row = position?.row ?? rowAttr;
      const col = position?.col ?? 0;
      if (!row || !col) continue;
      const cell = parseCell(cellNode, ref, row, col, sharedStrings, cellStyles);
      if (cell.type !== 'empty' || cell.formula || cell.styleIndex !== undefined) {
        cells.set(ref, cell);
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);
      }
    }
  }

  const merges: string[] = [];
  const mergeNodes = findChildren(findChild(worksheet, 'mergeCells'), 'mergeCell');
  for (const merge of mergeNodes) {
    const ref = attr(merge, 'ref');
    if (ref) merges.push(ref);
  }
  const pane = descendants(findChild(worksheet, 'sheetViews'), 'pane')[0];
  const freezeRow = Number(attr(pane, 'ySplit') ?? 0);
  const freezeCol = Number(attr(pane, 'xSplit') ?? 0);
  const sheet: ExcelSheet = { name, cells, maxRow, maxCol, merges, path, xmlRoot: worksheet };
  if (findChild(worksheet, 'sheetProtection')) sheet.protected = true;
  sheet.comments = parseSheetComments(entries, path);
  if (attr(pane, 'state') === 'frozen' && (freezeRow > 0 || freezeCol > 0)) {
    sheet.freeze = { row: freezeRow, col: freezeCol };
  }
  return sheet;
}

function parseCell(node: XmlNode, ref: string, row: number, col: number, sharedStrings: string[],
                    cellStyles: Map<number, CellStyle>): ExcelCell {
  const type = attr(node, 't') ?? 'n';
  const formula = findChild(node, 'f');
  const valueNode = findChild(node, 'v');
  const inline = findChild(node, 'is');
  let value = valueNode ? textOf(valueNode) : '';
  let kind: ExcelCell['type'] = 'number';

  if (type === 's') {
    const index = Number(value);
    value = sharedStrings[index] ?? '';
    kind = 'string';
  } else if (type === 'inlineStr') {
    value = textOf(inline);
    kind = 'string';
  } else if (type === 'str') {
    kind = 'string';
  } else if (type === 'b') {
    kind = 'boolean';
    value = value === '1' ? 'TRUE' : 'FALSE';
  } else if (type === 'e') {
    kind = 'error';
  } else if (value === '' && !formula) {
    kind = 'empty';
  }

  return {
    ref,
    row,
    col,
    value,
    formula: formula ? `=${textOf(formula)}` : undefined,
    type: kind,
    xmlNode: node,
    ...cellStyleFields(node, cellStyles),
  };
}

function cellStyleFields(node: XmlNode, cellStyles: Map<number, CellStyle>): { styleIndex?: number; style?: CellStyle } {
  const raw = attr(node, 's');
  if (raw === undefined || raw === '') return {};
  const styleIndex = Number(raw);
  const style = cellStyles.get(styleIndex);
  return style ? { styleIndex, style } : { styleIndex };
}

function parseSharedStrings(bytes: Uint8Array | undefined): string[] {
  if (!bytes) return [];
  const doc = parseXml(new TextDecoder('utf-8').decode(bytes));
  const sst = findChild(doc, 'sst') ?? doc;
  return findChildren(sst, 'si').map((si) => textOf(si));
}

function parseRelations(bytes: Uint8Array | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!bytes) return map;
  const doc = parseXml(new TextDecoder('utf-8').decode(bytes));
  for (const rel of descendants(doc, 'Relationship')) {
    const id = attr(rel, 'Id');
    const target = attr(rel, 'Target');
    if (id && target) map.set(id, target);
  }
  return map;
}

function normalizeTarget(target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  if (target.startsWith('xl/')) return target;
  return `xl/${target}`;
}

export function parseCellRef(ref: string): { row: number; col: number } | null {
  const match = /^([A-Z]+)(\d+)$/i.exec(ref);
  if (!match) return null;
  return { col: columnToNumber(match[1]), row: Number(match[2]) };
}

export function columnToNumber(letters: string): number {
  let value = 0;
  for (const char of letters.toUpperCase()) {
    value = value * 26 + (char.charCodeAt(0) - 64);
  }
  return value;
}

export function numberToColumn(value: number): string {
  let column = '';
  let current = value;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
}
