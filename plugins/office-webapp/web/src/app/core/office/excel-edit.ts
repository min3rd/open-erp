import { findChild, type XmlNode } from '../binary/xml';
import type { ExcelCell, ExcelDocument, ExcelSheet } from './types';
import { numberToColumn, parseCellRef } from './xlsx';
import { rebuildSheetData } from './excel-sort';
import { applyCellStyle } from './excel-format';

export type CellShift = 'right' | 'down' | 'left' | 'up';

export function insertCells(sheet: ExcelSheet, ref: string, direction: CellShift): void {
  const position = parseCellRef(ref);
  if (!position) return;
  const moves: Array<{ from: string; to: string; cell: ExcelCell; row: number; col: number }> = [];
  for (const cell of sheet.cells.values()) {
    const matches = direction === 'right' || direction === 'left'
      ? cell.row === position.row && cell.col >= position.col
      : cell.col === position.col && cell.row >= position.row;
    if (!matches) continue;
    const row = direction === 'down' ? cell.row + 1 : cell.row;
    const col = direction === 'right' ? cell.col + 1 : cell.col;
    moves.push({ from: cell.ref, to: `${numberToColumn(col)}${row}`, cell, row, col });
  }
  for (const move of moves.sort((a, b) => direction === 'right'
    ? b.cell.col - a.cell.col
    : b.cell.row - a.cell.row)) {
    sheet.cells.delete(move.from);
    move.cell.row = move.row;
    move.cell.col = move.col;
    move.cell.ref = move.to;
    sheet.cells.set(move.to, move.cell);
  }
  rebuildSheetData(sheet);
}

export function deleteCells(sheet: ExcelSheet, ref: string, direction: CellShift): void {
  const position = parseCellRef(ref);
  if (!position) return;
  sheet.cells.delete(ref);
  const moves: Array<{ from: string; to: string; cell: ExcelCell; row: number; col: number }> = [];
  for (const cell of sheet.cells.values()) {
    const matches = direction === 'left' || direction === 'right'
      ? cell.row === position.row && cell.col > position.col
      : cell.col === position.col && cell.row > position.row;
    if (!matches) continue;
    const row = direction === 'up' ? cell.row - 1 : cell.row;
    const col = direction === 'left' ? cell.col - 1 : cell.col;
    moves.push({ from: cell.ref, to: `${numberToColumn(col)}${row}`, cell, row, col });
  }
  for (const move of moves.sort((a, b) => direction === 'left'
    ? a.cell.col - b.cell.col
    : a.cell.row - b.cell.row)) {
    sheet.cells.delete(move.from);
    move.cell.row = move.row;
    move.cell.col = move.col;
    move.cell.ref = move.to;
    sheet.cells.set(move.to, move.cell);
  }
  rebuildSheetData(sheet);
}

export function insertRow(sheet: ExcelSheet, row: number): void {
  shiftRows(sheet, row, 1);
}

export function deleteRow(sheet: ExcelSheet, row: number): void {
  for (const cell of [...sheet.cells.values()]) if (cell.row === row) sheet.cells.delete(cell.ref);
  shiftRows(sheet, row, -1);
}

export function insertColumn(sheet: ExcelSheet, col: number): void {
  shiftColumns(sheet, col, 1);
}

export function deleteColumn(sheet: ExcelSheet, col: number): void {
  for (const cell of [...sheet.cells.values()]) if (cell.col === col) sheet.cells.delete(cell.ref);
  shiftColumns(sheet, col, -1);
}

export function autoSum(sheet: ExcelSheet, ref: string): string | null {
  const position = parseCellRef(ref);
  if (!position) return null;
  const above = contiguous(sheet, position.row - 1, position.col, -1, 'row');
  const left = contiguous(sheet, position.col - 1, position.row, -1, 'column');
  const range = above.length >= 2 ? `${numberToColumn(position.col)}${above[0]}:${numberToColumn(position.col)}${above[above.length - 1]}`
    : left.length >= 2 ? `${numberToColumn(left[0])}${position.row}:${numberToColumn(left[left.length - 1])}${position.row}`
      : null;
  if (!range) return null;
  const values = [...sheet.cells.values()]
    .filter((cell) => inRange(cell, range) && cell.type === 'number')
    .map((cell) => Number(cell.value.replace(/,/g, '')));
  const total = values.reduce((sum, value) => sum + value, 0);
  let cell = sheet.cells.get(ref);
  if (!cell) {
    cell = { ref, row: position.row, col: position.col, value: '', type: 'empty' };
    sheet.cells.set(ref, cell);
  }
  cell.value = String(total);
  cell.formula = `=SUM(${range})`;
  cell.type = 'number';
  rebuildSheetData(sheet);
  return cell.formula;
}

export function clearCell(sheet: ExcelSheet, ref: string, mode: 'contents' | 'formats' | 'all'): boolean {
  const cell = sheet.cells.get(ref);
  if (!cell) return false;
  if (mode === 'all') {
    sheet.cells.delete(ref);
  } else if (mode === 'formats') {
    delete cell.style;
    delete cell.styleIndex;
    if (cell.xmlNode) delete cell.xmlNode.attrs['s'];
  } else {
    cell.value = '';
    cell.formula = undefined;
    cell.type = 'empty';
  }
  rebuildSheetData(sheet);
  return true;
}

export function mergeRange(sheet: ExcelSheet, range: string): boolean {
  const normalized = normalizeRange(range);
  if (!normalized) return false;
  if (!sheet.merges.includes(normalized)) sheet.merges.push(normalized);
  const root = sheet.xmlRoot;
  if (!root) return true;
  let merges = findChild(root, 'mergeCells');
  if (!merges) {
    merges = { name: 'mergeCells', attrs: {}, text: '', children: [] };
    const at = root.children.findIndex((child) => child.name === 'conditionalFormatting' || child.name === 'dataValidations');
    root.children.splice(at < 0 ? root.children.length : at, 0, merges);
  }
  if (!merges.children.some((child) => child.attrs['ref'] === normalized)) {
    merges.children.push({ name: 'mergeCell', attrs: { ref: normalized }, text: '', children: [] });
  }
  merges.attrs['count'] = String(merges.children.length);
  return true;
}

export function unmergeRange(sheet: ExcelSheet, range: string): boolean {
  const normalized = normalizeRange(range);
  if (!normalized) return false;
  const index = sheet.merges.indexOf(normalized);
  if (index < 0) return false;
  sheet.merges.splice(index, 1);
  const root = sheet.xmlRoot;
  const merges = root ? findChild(root, 'mergeCells') : null;
  if (merges) {
    merges.children = merges.children.filter((child) => child.attrs['ref'] !== normalized);
    merges.attrs['count'] = String(merges.children.length);
    if (!merges.children.length && root) root.children = root.children.filter((child) => child !== merges);
  }
  return true;
}

export function mergeAndCenter(document: ExcelDocument, sheet: ExcelSheet, range: string): boolean {
  const normalized = normalizeRange(range);
  if (!normalized) return false;
  const topLeft = normalized.split(':')[0];
  applyCellStyle(document, sheet, topLeft, { align: 'center', verticalAlign: 'middle' });
  return mergeRange(sheet, normalized);
}

export function normalizeRange(range: string): string | null {
  const match = /^([A-Z]+\d+):([A-Z]+\d+)$/i.exec(range.trim());
  if (!match) return null;
  return `${match[1].toUpperCase()}:${match[2].toUpperCase()}`;
}

function shiftRows(sheet: ExcelSheet, row: number, delta: 1 | -1): void {
  const moves = [...sheet.cells.values()]
    .filter((cell) => cell.row >= row)
    .sort((a, b) => delta > 0 ? b.row - a.row : a.row - b.row);
  for (const cell of moves) {
    sheet.cells.delete(cell.ref);
    cell.row += delta;
    cell.ref = `${numberToColumn(cell.col)}${cell.row}`;
    sheet.cells.set(cell.ref, cell);
  }
  rebuildSheetData(sheet);
}

function shiftColumns(sheet: ExcelSheet, col: number, delta: 1 | -1): void {
  const moves = [...sheet.cells.values()]
    .filter((cell) => cell.col >= col)
    .sort((a, b) => delta > 0 ? b.col - a.col : a.col - b.col);
  for (const cell of moves) {
    sheet.cells.delete(cell.ref);
    cell.col += delta;
    cell.ref = `${numberToColumn(cell.col)}${cell.row}`;
    sheet.cells.set(cell.ref, cell);
  }
  rebuildSheetData(sheet);
}

function contiguous(sheet: ExcelSheet, row: number, col: number, step: -1 | 1, axis: 'row' | 'column'): number[] {
  const values: number[] = [];
  let currentRow = row;
  let currentCol = col;
  while (currentRow > 0 && currentCol > 0) {
    const cell = sheet.cells.get(`${numberToColumn(currentCol)}${currentRow}`);
    if (!cell || cell.type !== 'number' || !Number.isFinite(Number(cell.value.replace(/,/g, '')))) break;
    values.push(axis === 'row' ? currentRow : currentCol);
    if (axis === 'row') currentRow += step;
    else currentCol += step;
  }
  return values.reverse();
}

function inRange(cell: ExcelCell, range: string): boolean {
  const [start, end] = range.split(':');
  const first = parseCellRef(start);
  const last = parseCellRef(end);
  if (!first || !last) return false;
  return cell.row >= Math.min(first.row, last.row) && cell.row <= Math.max(first.row, last.row)
    && cell.col >= Math.min(first.col, last.col) && cell.col <= Math.max(first.col, last.col);
}

export function sheetSummary(sheet: ExcelSheet): { cells: number; merges: number; rows: number; cols: number } {
  return { cells: sheet.cells.size, merges: sheet.merges.length, rows: sheet.maxRow, cols: sheet.maxCol };
}

export function rangeSize(range: string): number {
  const normalized = normalizeRange(range);
  if (!normalized) return 0;
  return normalized.split(':').length;
}
