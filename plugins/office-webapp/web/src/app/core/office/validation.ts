import { attr, findChild, findChildren, textOf, type XmlNode } from '../binary/xml';
import type { ExcelSheet } from './types';

export type ValidationType = 'list' | 'whole' | 'decimal' | 'date' | 'time' | 'textLength' | 'custom' | 'none';

export interface ValidationRule {
  ranges: string[];
  type: ValidationType;
  operator: string;
  formula1?: string;
  formula2?: string;
  allowBlank: boolean;
  showErrorMessage: boolean;
  errorTitle?: string;
  errorMessage?: string;
  promptTitle?: string;
  promptMessage?: string;
}

export interface ValidationResult {
  valid: boolean;
  code?: string;
  params?: Record<string, string | number>;
}

export function parseValidations(sheet: ExcelSheet): ValidationRule[] {
  if (!sheet.xmlRoot) return [];
  const container = findChild(sheet.xmlRoot, 'dataValidations');
  if (!container) return [];
  return findChildren(container, 'dataValidation').map((node) => ({
    ranges: (attr(node, 'sqref') ?? '').split(/\s+/).filter(Boolean),
    type: (attr(node, 'type') as ValidationType) ?? 'none',
    operator: attr(node, 'operator') ?? 'between',
    formula1: textValue(findChild(node, 'formula1')),
    formula2: textValue(findChild(node, 'formula2')),
    allowBlank: attr(node, 'allowBlank') !== '0',
    showErrorMessage: attr(node, 'showErrorMessage') !== '0',
    errorTitle: attr(node, 'errorTitle'),
    errorMessage: attr(node, 'errorMessage'),
    promptTitle: attr(node, 'promptTitle'),
    promptMessage: attr(node, 'promptMessage'),
  }));
}

export function validate(rule: ValidationRule, value: string): ValidationResult {
  if (value.trim() === '') return { valid: rule.allowBlank, code: rule.allowBlank ? undefined : 'VALIDATION_REQUIRED' };
  switch (rule.type) {
    case 'list': {
      const items = listItems(rule);
      const caseSensitive = false;
      const valid = items.some((item) => caseSensitive ? item === value : item.toLowerCase() === value.trim().toLowerCase());
      return valid ? { valid: true } : { valid: false, code: 'VALIDATION_LIST', params: { value } };
    }
    case 'whole': {
      const numeric = Number(value);
      if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
        return { valid: false, code: 'VALIDATION_WHOLE', params: { value } };
      }
      return compare(numeric, rule, 'VALIDATION_WHOLE');
    }
    case 'decimal': {
      const numeric = Number(value.replace(/,/g, ''));
      if (!Number.isFinite(numeric)) return { valid: false, code: 'VALIDATION_DECIMAL', params: { value } };
      return compare(numeric, rule, 'VALIDATION_DECIMAL');
    }
    case 'textLength': {
      const length = value.length;
      return compare(length, rule, 'VALIDATION_LENGTH');
    }
    case 'date': {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return { valid: false, code: 'VALIDATION_DATE', params: { value } };
      return compare(numeric, rule, 'VALIDATION_DATE');
    }
    case 'time': {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return { valid: false, code: 'VALIDATION_TIME', params: { value } };
      return compare(numeric, rule, 'VALIDATION_TIME');
    }
    case 'custom': {
      const valid = value.trim().toLowerCase() === 'true' || value.trim() === '1';
      return valid ? { valid: true } : { valid: false, code: 'VALIDATION_CUSTOM' };
    }
    default:
      return { valid: true };
  }
}

export function listItems(rule: ValidationRule): string[] {
  const raw = rule.formula1 ?? '';
  if (raw.startsWith('"') && raw.endsWith('"')) {
    return raw.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function compare(value: number, rule: ValidationRule, code: string): ValidationResult {
  const low = bound(rule.formula1);
  const high = bound(rule.formula2);
  const operator = rule.operator;
  const valid = operator === 'notBetween'
    ? value < Math.min(low, high) || value > Math.max(low, high)
    : operator === 'equal' ? value === low
    : operator === 'notEqual' ? value !== low
    : operator === 'greaterThan' ? value > low
    : operator === 'lessThan' ? value < low
    : operator === 'greaterThanOrEqual' ? value >= low
    : operator === 'lessThanOrEqual' ? value <= low
    : value >= Math.min(low, high) && value <= Math.max(low, high);
  return valid ? { valid: true } : { valid: false, code, params: { value, min: low, max: high } };
}

function bound(formula: string | undefined): number {
  if (!formula) return 0;
  const parsed = Number(formula);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textValue(node: XmlNode | null): string | undefined {
  if (!node) return undefined;
  const value = textOf(node).trim();
  return value === '' ? undefined : value;
}
