import { attr, findChild, findChildren, type XmlNode } from '../binary/xml';
import type { ExcelCell, ExcelSheet } from './types';
import { numberToColumn } from './xlsx';

export interface SheetFilter {
  column: number;
  value: string;
}

export interface SortKey {
  column: number;
  ascending: boolean;
}

export function sortSheet(sheet: ExcelSheet, column: number, ascending: boolean): boolean {
  return sortSheetKeys(sheet, [{ column, ascending }]);
}

export function sortSheetKeys(sheet: ExcelSheet, keys: SortKey[]): boolean {
  if (sheet.maxRow < 3 || sheet.maxCol < 1 || !keys.length) return false;
  const rows: ExcelCell[][] = [];
  for (let row = 2; row <= sheet.maxRow; row++) {
    const cells: ExcelCell[] = [];
    for (let col = 1; col <= sheet.maxCol; col++) {
      const cell = sheet.cells.get(`${numberToColumn(col)}${row}`);
      if (cell) cells.push(cell);
    }
    rows.push(cells);
  }
  const valueOf = (cells: ExcelCell[], column: number): string =>
    cells.find((item) => item.col === column)?.value ?? '';
  rows.sort((left, right) => {
    for (const key of keys) {
      const a = valueOf(left, key.column);
      const b = valueOf(right, key.column);
      const numberA = Number(a.replace(/,/g, ''));
      const numberB = Number(b.replace(/,/g, ''));
      const compare = Number.isFinite(numberA) && Number.isFinite(numberB) && a !== '' && b !== ''
        ? numberA - numberB
        : a.localeCompare(b, 'vi');
      if (compare !== 0) return key.ascending ? compare : -compare;
    }
    return 0;
  });

  for (let row = 2; row <= sheet.maxRow; row++) {
    for (let col = 1; col <= sheet.maxCol; col++) sheet.cells.delete(`${numberToColumn(col)}${row}`);
  }
  rows.forEach((cells, index) => {
    const row = index + 2;
    for (const source of cells) {
      const ref = `${numberToColumn(source.col)}${row}`;
      const cell: ExcelCell = { ...source, row, ref };
      sheet.cells.set(ref, cell);
    }
  });
  rebuildSheetData(sheet);
  return true;
}

export function findInSheet(sheet: ExcelSheet, query: string): ExcelCell[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return [...sheet.cells.values()]
    .filter((cell) => cell.value.toLowerCase().includes(needle)
      || (cell.formula ?? '').toLowerCase().includes(needle)
      || cell.ref.toLowerCase().includes(needle))
    .sort((a, b) => a.row - b.row || a.col - b.col);
}

export function visibleRows(sheet: ExcelSheet, filter: SheetFilter | null): Set<number> | null {
  if (!filter || !filter.value.trim()) return null;
  const needle = filter.value.trim().toLowerCase();
  const visible = new Set<number>([1]);
  for (let row = 2; row <= sheet.maxRow; row++) {
    const cell = sheet.cells.get(`${numberToColumn(filter.column)}${row}`);
    if ((cell?.value ?? '').toLowerCase().includes(needle)) visible.add(row);
  }
  return visible;
}

export function rebuildSheetData(sheet: ExcelSheet): void {
  const root = sheet.xmlRoot;
  if (!root) return;
  let sheetData = findChild(root, 'sheetData');
  if (!sheetData) {
    sheetData = { name: 'sheetData', attrs: {}, text: '', children: [] };
    const at = root.children.findIndex((child) =>
      child.name === 'sheetCalcPr' || child.name === 'sheetProtection' || child.name === 'mergeCells'
      || child.name === 'conditionalFormatting' || child.name === 'dataValidations'
      || child.name === 'autoFilter' || child.name === 'tableParts');
    root.children.splice(at < 0 ? root.children.length : at, 0, sheetData);
  }
  const rows = new Map<number, ExcelCell[]>();
  for (const cell of sheet.cells.values()) {
    const list = rows.get(cell.row) ?? [];
    list.push(cell);
    rows.set(cell.row, list);
  }
  const children: XmlNode[] = [];
  for (const row of [...rows.keys()].sort((a, b) => a - b)) {
    const cells = rows.get(row) ?? [];
    const rowNode: XmlNode = { name: 'row', attrs: { r: String(row) }, text: '', children: [] };
    for (const cell of [...cells].sort((a, b) => a.col - b.col)) {
      rowNode.children.push(buildCellNode(cell));
    }
    children.push(rowNode);
  }
  sheetData.children = children;
  let maxRow = 0;
  let maxCol = 0;
  for (const cell of sheet.cells.values()) {
    maxRow = Math.max(maxRow, cell.row);
    maxCol = Math.max(maxCol, cell.col);
  }
  sheet.maxRow = maxRow;
  sheet.maxCol = maxCol;
}

function buildCellNode(cell: ExcelCell): XmlNode {
  const attrs: Record<string, string> = { r: cell.ref };
  if (cell.styleIndex !== undefined) attrs['s'] = String(cell.styleIndex);
  const children: XmlNode[] = [];
  if (cell.formula) children.push({ name: 'f', attrs: {}, text: cell.formula.replace(/^=/, ''), children: [] });
  let value = cell.value;
  if (!cell.formula) {
    if (cell.type === 'string') {
      attrs['t'] = 'inlineStr';
      children.push({ name: 'is', attrs: {}, text: '', children: [
        { name: 't', attrs: { 'xml:space': 'preserve' }, text: value, children: [] },
      ] });
      const node: XmlNode = { name: 'c', attrs, text: '', children };
      cell.xmlNode = node;
      return node;
    }
    if (cell.type === 'boolean') {
      attrs['t'] = 'b';
      value = value.toUpperCase() === 'TRUE' ? '1' : '0';
    } else if (cell.type === 'error') {
      attrs['t'] = 'e';
    }
  } else if (cell.type === 'string') {
    attrs['t'] = 'str';
  } else if (cell.type === 'boolean') {
    attrs['t'] = 'b';
    value = value.toUpperCase() === 'TRUE' ? '1' : '0';
  }
  if (value !== '') children.push({ name: 'v', attrs: {}, text: value, children: [] });
  const node: XmlNode = { name: 'c', attrs, text: '', children };
  cell.xmlNode = node;
  return node;
}
