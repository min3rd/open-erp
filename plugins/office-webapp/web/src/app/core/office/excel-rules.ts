import { attr, findChild, type XmlNode } from '../binary/xml';
import type { ExcelSheet } from './types';

export interface ConditionalRuleInput {
  range: string;
  type: 'cellIs' | 'containsText' | 'dataBar' | 'colorScale';
  operator?: 'greaterThan' | 'lessThan' | 'between' | 'equal' | 'notEqual' | 'greaterThanOrEqual' | 'lessThanOrEqual';
  value?: string;
  value2?: string;
  text?: string;
  color?: string;
}

export interface ValidationRuleInput {
  ranges: string;
  type: 'list' | 'whole' | 'decimal' | 'textLength';
  operator?: 'between' | 'notBetween' | 'equal' | 'notEqual' | 'greaterThan' | 'lessThan';
  formula1: string;
  formula2?: string;
  allowBlank?: boolean;
  errorMessage?: string;
}

export function addConditionalRule(sheet: ExcelSheet, input: ConditionalRuleInput): boolean {
  if (!sheet.xmlRoot) return false;
  let block = findChild(sheet.xmlRoot, 'conditionalFormatting');
  const existing = block;
  if (!block || attr(block, 'sqref') !== input.range) {
    block = { name: 'conditionalFormatting', attrs: { sqref: input.range }, text: '', children: [] };
    insertBeforeTail(sheet.xmlRoot, block);
  }
  const rule: XmlNode = {
    name: 'cfRule',
    attrs: { type: input.type, priority: '1' },
    text: '',
    children: [],
  };
  if (input.operator) rule.attrs['operator'] = input.operator;
  if (input.text) rule.attrs['text'] = input.text;
  if (input.type === 'colorScale') {
    rule.attrs['type'] = 'colorScale';
    rule.children.push({
      name: 'colorScale', attrs: {}, text: '', children: [
        { name: 'cfvo', attrs: { type: 'min' }, text: '', children: [] },
        { name: 'cfvo', attrs: { type: 'max' }, text: '', children: [] },
        { name: 'color', attrs: { rgb: normalizeColor(input.color ?? '#f8696b') }, text: '', children: [] },
      ],
    });
  } else if (input.type === 'dataBar') {
    rule.children.push({
      name: 'dataBar', attrs: {}, text: '', children: [
        { name: 'cfvo', attrs: { type: 'min' }, text: '', children: [] },
        { name: 'cfvo', attrs: { type: 'max' }, text: '', children: [] },
        { name: 'color', attrs: { rgb: normalizeColor(input.color ?? '#638ec6') }, text: '', children: [] },
      ],
    });
  } else {
    if (input.value) rule.children.push({ name: 'formula', attrs: {}, text: input.value, children: [] });
    if (input.value2) rule.children.push({ name: 'formula', attrs: {}, text: input.value2, children: [] });
  }
  block.children.push(rule);
  if (!existing) { /* inserted above */ }
  return true;
}

export function addValidationRule(sheet: ExcelSheet, input: ValidationRuleInput): boolean {
  if (!sheet.xmlRoot) return false;
  let container = findChild(sheet.xmlRoot, 'dataValidations');
  if (!container) {
    container = { name: 'dataValidations', attrs: { count: '1' }, text: '', children: [] };
    insertBeforeTail(sheet.xmlRoot, container);
  }
  const rule: XmlNode = {
    name: 'dataValidation',
    attrs: {
      type: input.type,
      operator: input.operator ?? 'between',
      sqref: input.ranges,
      allowBlank: input.allowBlank === false ? '0' : '1',
      showErrorMessage: '1',
    },
    text: '',
    children: [{ name: 'formula1', attrs: {}, text: input.formula1, children: [] }],
  };
  if (input.errorMessage) rule.attrs['errorMessage'] = input.errorMessage;
  if (input.formula2) rule.children.push({ name: 'formula2', attrs: {}, text: input.formula2, children: [] });
  container.children.push(rule);
  container.attrs['count'] = String(container.children.length);
  return true;
}

function insertBeforeTail(root: XmlNode, node: XmlNode): void {
  const tail = root.children.findIndex((child) => child.name === 'tableParts' || child.name === 'extLst');
  if (tail < 0) root.children.push(node);
  else root.children.splice(tail, 0, node);
}

function normalizeColor(color: string): string {
  const hex = color.replace('#', '').toUpperCase();
  return `FF${hex.padStart(6, '0').slice(-6)}`;
}
