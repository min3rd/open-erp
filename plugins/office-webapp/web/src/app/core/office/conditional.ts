import { attr, findChild, findChildren, type XmlNode } from '../binary/xml';
import type { ExcelSheet } from './types';

export type ConditionalOperator =
  | 'greaterThan' | 'lessThan' | 'between' | 'equal' | 'notEqual'
  | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'containsText' | 'notContains';

export interface ConditionalRule {
  range: string;
  type: 'cellIs' | 'containsText' | 'colorScale' | 'dataBar' | 'top10' | 'expression';
  operator?: ConditionalOperator;
  formulas: string[];
  text?: string;
  /** 0-based; only for top10 rules. */
  rank?: number;
  percent?: boolean;
  bottom?: boolean;
  colors?: string[];
  style?: { background?: string; color?: string; bold?: boolean; barColor?: string };
}

export interface ConditionalStyle {
  background?: string;
  color?: string;
  fontWeight?: string;
  barRatio?: number;
  barColor?: string;
}

export function parseConditionalRules(sheet: ExcelSheet): ConditionalRule[] {
  if (!sheet.xmlRoot) return [];
  const rules: ConditionalRule[] = [];
  for (const block of findChildren(sheet.xmlRoot, 'conditionalFormatting')) {
    const range = attr(block, 'sqref');
    if (!range) continue;
    for (const node of findChildren(block, 'cfRule')) {
      rules.push(parseRule(range, node));
    }
  }
  return rules;
}

export function removeConditionalRule(sheet: ExcelSheet, index: number): boolean {
  if (!sheet.xmlRoot) return false;
  let counter = 0;
  for (const block of findChildren(sheet.xmlRoot, 'conditionalFormatting')) {
    const ruleIndex = block.children.findIndex((child) => child.name === 'cfRule' && counter++ === index);
    if (ruleIndex >= 0) {
      block.children.splice(ruleIndex, 1);
      if (!block.children.some((child) => child.name === 'cfRule')) {
        sheet.xmlRoot.children = sheet.xmlRoot.children.filter((child) => child !== block);
      }
      return true;
    }
  }
  return false;
}

export function clearConditionalRules(sheet: ExcelSheet): number {
  if (!sheet.xmlRoot) return 0;
  const blocks = findChildren(sheet.xmlRoot, 'conditionalFormatting');
  const count = blocks.reduce((sum, block) => sum + findChildren(block, 'cfRule').length, 0);
  sheet.xmlRoot.children = sheet.xmlRoot.children.filter((child) => child.name !== 'conditionalFormatting');
  return count;
}

function parseRule(range: string, node: XmlNode): ConditionalRule {
  const type = attr(node, 'type') ?? 'expression';
  const operator = attr(node, 'operator') as ConditionalOperator | undefined;
  const formulas = findChildren(node, 'formula').map((formula) => formula.text || '');
  const text = attr(node, 'text');
  const rank = attr(node, 'rank') ? Number(attr(node, 'rank')) : undefined;
  const percent = attr(node, 'percent') === '1';
  const bottom = attr(node, 'bottom') === '1';
  const colors: string[] = [];
  const colorScale = findChild(node, 'colorScale');
  for (const value of findChildren(colorScale, 'cfvo')) {
    if (attr(value, 'rgb')) colors.push(`#${attr(value, 'rgb')!.slice(-6)}`);
  }
  for (const color of findChildren(colorScale, 'color')) {
    const rgb = attr(color, 'rgb');
    if (rgb) colors.push(`#${rgb.slice(-6)}`);
  }
  const dataBar = findChild(node, 'dataBar');
  const barColor = attr(findChild(dataBar, 'color'), 'rgb');
  const base: ConditionalRule = {
    range,
    type: type as ConditionalRule['type'],
    operator,
    formulas,
    text,
    rank,
    percent,
    bottom,
    colors: colors.length ? colors : undefined,
  };
  if (type === 'cellIs') {
    base.style = { background: '#ffc7ce', color: '#9c0006', bold: operator === 'lessThan' };
  } else if (type === 'containsText') {
    base.style = { background: '#ffeb9c', color: '#9c6500' };
  } else if (type === 'dataBar') {
    base.style = { barColor: barColor ? `#${barColor.slice(-6)}` : '#638ec6' };
  } else if (type === 'top10') {
    base.style = { background: '#c6efce', color: '#006100' };
  }
  return base;
}

export function styleFor(rules: ConditionalRule[], ref: string, value: string | number | null, context: ExcelSheet): ConditionalStyle {
  let style: ConditionalStyle = {};
  for (const rule of rules) {
    if (!rangeContains(rule.range, ref)) continue;
    if (rule.type === 'colorScale') {
      const scale = colorScale(rule, context);
      if (scale) style = { ...style, ...scale };
      continue;
    }
    if (rule.type === 'dataBar') {
      style = { ...style, barColor: rule.style?.barColor ?? '#638ec6', barRatio: dataBarRatio(context) };
      continue;
    }
    if (matches(rule, value, context)) style = { ...style, ...(rule.style ?? {}) };
  }
  return style;
}

export function rangeContains(range: string, ref: string): boolean {
  for (const part of range.split(/\s+/)) {
    const match = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/i.exec(part);
    if (!match) continue;
    const a = position(match[1], match[2]);
    const b = match[3] && match[4] ? position(match[3], match[4]) : a;
    const target = /^([A-Z]+)(\d+)$/i.exec(ref);
    if (!a || !b || !target) continue;
    const at = position(target[1], target[2])!;
    if (at.row >= Math.min(a.row, b.row) && at.row <= Math.max(a.row, b.row)
      && at.col >= Math.min(a.col, b.col) && at.col <= Math.max(a.col, b.col)) return true;
  }
  return false;
}

function matches(rule: ConditionalRule, value: string | number | null, context: ExcelSheet): boolean {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? '').replace(/,/g, ''));
  const usable = typeof value === 'number' || (String(value ?? '').trim() !== '' && Number.isFinite(numeric));
  const target = number(rule.formulas[0], context);
  const upper = number(rule.formulas[1], context);
  switch (rule.type) {
    case 'cellIs':
      if (!usable) return false;
      switch (rule.operator) {
        case 'greaterThan': return numeric > target;
        case 'lessThan': return numeric < target;
        case 'greaterThanOrEqual': return numeric >= target;
        case 'lessThanOrEqual': return numeric <= target;
        case 'equal': return numeric === target;
        case 'notEqual': return numeric !== target;
        case 'between': return numeric >= Math.min(target, upper) && numeric <= Math.max(target, upper);
        default: return false;
      }
    case 'containsText': {
      const haystack = String(value ?? '').toLowerCase();
      const needle = (rule.text ?? rule.formulas[0] ?? '').toLowerCase();
      return rule.operator === 'notContains' ? !haystack.includes(needle) : haystack.includes(needle);
    }
    case 'expression':
      return evaluateExpression(rule.formulas[0] ?? '', context) === true;
    case 'top10': {
      if (!usable) return false;
      const values = numericValues(context).sort((a, b) => rule.bottom ? a - b : b - a);
      const count = Math.max(1, Math.min(values.length, Math.ceil(values.length * ((rule.rank ?? 10) / (rule.percent ? 100 : 1)))));
      return values.slice(0, count).includes(numeric);
    }
    default:
      return false;
  }
}

function colorScale(rule: ConditionalRule, context: ExcelSheet): ConditionalStyle | null {
  const values = numericValues(context);
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const colors = rule.colors ?? [];
  if (!colors.length) return null;
  const ratio = max === min ? 1 : 0.5;
  const index = Math.min(colors.length - 1, Math.round(ratio * (colors.length - 1)));
  return { background: colors[index] };
}

function dataBarRatio(context: ExcelSheet): number {
  const values = numericValues(context);
  if (!values.length) return 0;
  const max = Math.max(...values.map(Math.abs));
  const current = values[values.length - 1];
  return max === 0 ? 0 : Math.min(1, Math.abs(current) / max);
}

function numericValues(context: ExcelSheet): number[] {
  const values: number[] = [];
  context.cells.forEach((cell) => {
    const numeric = Number(cell.value.replace(/,/g, ''));
    if (cell.type === 'number' || Number.isFinite(numeric)) values.push(numeric);
  });
  return values;
}

function evaluateExpression(expression: string, context: ExcelSheet): boolean {
  const ref = /([A-Z]+\d+)\s*(=|<>|>=|<=|>|<)\s*("?[^"]*"?)/i.exec(expression);
  if (!ref) return false;
  const cell = context.cells.get(ref[1].toUpperCase());
  if (!cell) return false;
  const left = Number(cell.value.replace(/,/g, ''));
  const right = Number(ref[3].replace(/"/g, ''));
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
  switch (ref[2]) {
    case '=': return left === right;
    case '<>': return left !== right;
    case '>': return left > right;
    case '<': return left < right;
    case '>=': return left >= right;
    default: return left <= right;
  }
}

function number(formula: string | undefined, context: ExcelSheet): number {
  if (!formula) return 0;
  const ref = /^([A-Z]+\d+)$/i.exec(formula);
  if (ref) {
    const cell = context.cells.get(ref[1].toUpperCase());
    return cell ? Number(cell.value.replace(/,/g, '')) || 0 : 0;
  }
  return Number(formula) || 0;
}

function position(letters: string, digits: string): { row: number; col: number } | null {
  const row = Number(digits);
  if (!Number.isFinite(row) || row < 1) return null;
  let col = 0;
  for (const char of letters.toUpperCase()) col = col * 26 + (char.charCodeAt(0) - 64);
  return { row, col };
}
