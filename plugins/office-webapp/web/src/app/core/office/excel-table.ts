import { parsePivotSource } from './pivot';
import type { ExcelSheet } from './types';
import type { SavedSlicer, SavedTable } from './xlsx-analysis';

export interface TableRow {
  key: string;
  cells: string[];
}

export function createTableConfig(sheet: ExcelSheet, source: string, name: string): SavedTable | null {
  const range = parsePivotSource(source);
  if (!range) return null;
  const columns: string[] = [];
  for (let col = range.startCol; col <= range.endCol; col++) {
    columns.push(String(sheet.cells.get(`${columnName(col)}${range.startRow}`)?.value ?? columnName(col)));
  }
  return {
    id: `table-${Date.now().toString(36)}`,
    name: name.trim() || `Table${Math.floor(Math.random() * 1000)}`,
    source,
    columns,
  };
}

export function tableRows(sheet: ExcelSheet, table: SavedTable): TableRow[] {
  const range = parsePivotSource(table.source);
  if (!range) return [];
  const rows: TableRow[] = [];
  for (let row = range.startRow + 1; row <= range.endRow; row++) {
    const cells: string[] = [];
    let empty = true;
    for (let col = range.startCol; col <= range.endCol; col++) {
      const value = String(sheet.cells.get(`${columnName(col)}${row}`)?.value ?? '');
      if (value !== '') empty = false;
      cells.push(value);
    }
    if (!empty) rows.push({ key: String(row), cells });
  }
  return rows;
}

export function slicerValues(sheet: ExcelSheet, table: SavedTable, column: number): string[] {
  const rows = tableRows(sheet, table);
  const values = new Set<string>();
  for (const row of rows) {
    const value = row.cells[column];
    if (value !== undefined && value !== '') values.add(value);
  }
  return [...values].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

export function filterTableRows(sheet: ExcelSheet, table: SavedTable, slicers: SavedSlicer[]): TableRow[] {
  const rows = tableRows(sheet, table);
  const relevant = slicers.filter((slicer) => slicer.tableId === table.id && slicer.selected.length);
  if (!relevant.length) return rows;
  return rows.filter((row) => relevant.every((slicer) => {
    const index = table.columns.indexOf(slicer.column);
    return index < 0 || slicer.selected.includes(row.cells[index]);
  }));
}

export function activeSlicers(analysis: { slicers: SavedSlicer[] }, tableId: string): SavedSlicer[] {
  return analysis.slicers.filter((slicer) => slicer.tableId === tableId);
}

function columnName(value: number): string {
  let column = '';
  let current = value;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
}
