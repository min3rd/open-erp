import type { ExcelSheet } from './types';

export type PivotAggregate = 'SUM' | 'COUNT' | 'AVERAGE' | 'MIN' | 'MAX';

export interface PivotFieldRef {
  /** 1-based column index inside the source range. */
  column: number;
  header?: string;
}

export interface PivotValueField extends PivotFieldRef {
  aggregate: PivotAggregate;
  label?: string;
}

export interface PivotConfig {
  /** Source range, e.g. A1:D40. Header row is included. */
  source: string;
  rowField: PivotFieldRef;
  columnField?: PivotFieldRef;
  values: PivotValueField[];
}

export interface PivotResult {
  rowKeys: string[];
  columnKeys: string[];
  /** [row][column][valueIndex] */
  cells: number[][][];
  rowTotals: number[][];
  columnTotals: number[][];
  grandTotals: number[];
  valueLabels: string[];
  valueHeaders: string[];
  valueAggregates: PivotAggregate[];
  error?: string;
}

interface SourceTable {
  headers: string[];
  rows: Array<Array<string | number | boolean | null>>;
}

const REF = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/i;

export function buildPivot(sheet: ExcelSheet, config: PivotConfig): PivotResult {
  const empty: PivotResult = {
    rowKeys: [], columnKeys: [], cells: [], rowTotals: [], columnTotals: [],
    grandTotals: config.values.map(() => 0),
    valueLabels: config.values.map(valueLabel),
    valueHeaders: config.values.map((field) => field.header ?? `C${field.column}`),
    valueAggregates: config.values.map((field) => field.aggregate),
  };
  const table = readSource(sheet, config.source);
  if (typeof table === 'string') return { ...empty, error: table };
  if (table.rows.length === 0) return { ...empty, error: 'PIVOT_NO_DATA' };
  if (!config.values.length) return { ...empty, error: 'PIVOT_NO_VALUES' };

  const rowIndex = config.rowField.column - 1;
  const columnIndex = config.columnField ? config.columnField.column - 1 : null;
  if (rowIndex < 0 || rowIndex >= table.headers.length) return { ...empty, error: 'PIVOT_ROW_FIELD_INVALID' };
  if (columnIndex !== null && (columnIndex < 0 || columnIndex >= table.headers.length)) {
    return { ...empty, error: 'PIVOT_COLUMN_FIELD_INVALID' };
  }
  for (const value of config.values) {
    if (value.column < 1 || value.column > table.headers.length) {
      return { ...empty, error: 'PIVOT_VALUE_FIELD_INVALID' };
    }
  }

  const rowKeys: string[] = [];
  const columnKeys: string[] = [];
  const buckets = new Map<string, Map<string, Array<number[]>>>();
  const push = (rowKey: string, columnKey: string, values: Array<number | null>) => {
    if (!buckets.has(rowKey)) buckets.set(rowKey, new Map());
    const row = buckets.get(rowKey)!;
    if (!row.has(columnKey)) row.set(columnKey, config.values.map(() => []));
    const lists = row.get(columnKey)!;
    values.forEach((value, index) => { if (value !== null) lists[index].push(value); });
    if (!rowKeys.includes(rowKey)) rowKeys.push(rowKey);
    if (!columnKeys.includes(columnKey)) columnKeys.push(columnKey);
  };

  for (const row of table.rows) {
    const rowKey = keyOf(row[rowIndex]);
    const columnKey = columnIndex === null ? 'Total' : keyOf(row[columnIndex]);
    const values = config.values.map((field) => numeric(row[field.column - 1]));
    push(rowKey, columnKey, values);
  }

  rowKeys.sort(naturalCompare);
  columnKeys.sort(naturalCompare);

  const cells = rowKeys.map((rowKey) => columnKeys.map((columnKey) => {
    const lists = buckets.get(rowKey)?.get(columnKey);
    return config.values.map((field, index) => aggregate(lists?.[index] ?? [], field.aggregate));
  }));
  const rowTotals = rowKeys.map((rowKey) => config.values.map((field, index) => {
    const row = buckets.get(rowKey);
    const lists: number[] = [];
    row?.forEach((columns) => lists.push(...columns[index]));
    return aggregate(lists, field.aggregate);
  }));
  const columnTotals = columnKeys.map((columnKey) => config.values.map((field, index) => {
    const lists: number[] = [];
    buckets.forEach((row) => { const values = row.get(columnKey)?.[index]; if (values) lists.push(...values); });
    return aggregate(lists, field.aggregate);
  }));
  const grandTotals = config.values.map((field, index) => {
    const lists: number[] = [];
    buckets.forEach((row) => row.forEach((columns) => lists.push(...columns[index])));
    return aggregate(lists, field.aggregate);
  });

  return {
    rowKeys,
    columnKeys: columnIndex === null ? [] : columnKeys,
    cells,
    rowTotals,
    columnTotals,
    grandTotals,
    valueLabels: config.values.map(valueLabel),
    valueHeaders: config.values.map((field) => field.header ?? `C${field.column}`),
    valueAggregates: config.values.map((field) => field.aggregate),
  };
}

export function parsePivotSource(value: string): { startRow: number; startCol: number; endRow: number; endCol: number } | null {
  const match = REF.exec(value.trim());
  if (!match) return null;
  const start = refToPosition(match[1], match[2]);
  const end = refToPosition(match[3], match[4]);
  if (!start || !end) return null;
  return {
    startRow: Math.min(start.row, end.row),
    startCol: Math.min(start.col, end.col),
    endRow: Math.max(start.row, end.row),
    endCol: Math.max(start.col, end.col),
  };
}

function readSource(sheet: ExcelSheet, source: string): SourceTable | string {
  const range = parsePivotSource(source);
  if (!range) return 'PIVOT_SOURCE_INVALID';
  const headers: string[] = [];
  for (let col = range.startCol; col <= range.endCol; col++) {
    headers.push(String(sheet.cells.get(`${columnName(col)}${range.startRow}`)?.value ?? columnName(col)));
  }
  const rows: SourceTable['rows'] = [];
  for (let row = range.startRow + 1; row <= range.endRow; row++) {
    const values: SourceTable['rows'][number] = [];
    let empty = true;
    for (let col = range.startCol; col <= range.endCol; col++) {
      const cell = sheet.cells.get(`${columnName(col)}${row}`);
      const raw = cell ? cell.value : null;
      const numericValue = numeric(raw);
      const value = numericValue !== null ? numericValue : raw;
      if (value !== null && value !== '') empty = false;
      values.push(value);
    }
    if (!empty) rows.push(values);
  }
  return { headers, rows };
}

function keyOf(value: unknown): string {
  if (value === null || value === undefined || value === '') return '(blank)';
  return String(value);
}

function numeric(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function aggregate(values: number[], mode: PivotAggregate): number {
  if (mode === 'COUNT') return values.length;
  if (!values.length) return 0;
  switch (mode) {
    case 'SUM': return values.reduce((sum, value) => sum + value, 0);
    case 'AVERAGE': return values.reduce((sum, value) => sum + value, 0) / values.length;
    case 'MIN': return Math.min(...values);
    case 'MAX': return Math.max(...values);
    default: return 0;
  }
}

function valueLabel(field: PivotValueField): string {
  return field.label ?? `${field.aggregate} of ${field.header ?? `C${field.column}`}`;
}

function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, 'en', { numeric: true, sensitivity: 'base' });
}

function refToPosition(letters: string, digits: string): { row: number; col: number } | null {
  const row = Number(digits);
  if (!Number.isFinite(row) || row < 1) return null;
  let col = 0;
  for (const char of letters.toUpperCase()) col = col * 26 + (char.charCodeAt(0) - 64);
  return { row, col };
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
