import { attr, findChild, findChildren, type XmlNode } from '../binary/xml';
import type { ExcelDocument, ExcelSheet } from './types';

export interface DefinedName {
  name: string;
  formula: string;
  localSheetId?: number;
}

export function parseDefinedNames(document: ExcelDocument): DefinedName[] {
  const root = workbookNode(document);
  if (!root) return [];
  return findChildren(findChild(root, 'definedNames'), 'definedName').map((node) => ({
    name: attr(node, 'name') ?? '',
    formula: node.text,
    localSheetId: attr(node, 'localSheetId') !== undefined ? Number(attr(node, 'localSheetId')) : undefined,
  })).filter((item) => item.name);
}

export function addDefinedName(document: ExcelDocument, name: string, formula: string, localSheetId?: number): boolean {
  const root = workbookNode(document);
  const cleanName = name.trim().replace(/\s+/g, '_');
  if (!root || !cleanName || !formula.trim()) return false;
  let container = findChild(root, 'definedNames');
  if (!container) {
    container = { name: 'definedNames', attrs: {}, text: '', children: [] };
    root.children.push(container);
  }
  const existing = container.children.find((node) => attr(node, 'name') === cleanName);
  const attrs: Record<string, string> = { name: cleanName };
  if (localSheetId !== undefined) attrs['localSheetId'] = String(localSheetId);
  if (existing) {
    existing.attrs = attrs;
    existing.text = formula.trim();
  } else {
    container.children.push({ name: 'definedName', attrs, text: formula.trim(), children: [] });
  }
  return true;
}

export function removeDefinedName(document: ExcelDocument, name: string): boolean {
  const root = workbookNode(document);
  const container = root ? findChild(root, 'definedNames') : null;
  if (!container) return false;
  const before = container.children.length;
  container.children = container.children.filter((node) => attr(node, 'name') !== name);
  return container.children.length !== before;
}

export function setWorkbookProtection(document: ExcelDocument, enabled: boolean): void {
  const root = workbookNode(document);
  if (!root) return;
  root.children = root.children.filter((child) => child.name !== 'workbookProtection');
  if (enabled) {
    root.children.push({ name: 'workbookProtection', attrs: { lockStructure: '1' }, text: '', children: [] });
  }
}

export function workbookProtected(document: ExcelDocument): boolean {
  const root = workbookNode(document);
  return Boolean(root && findChild(root, 'workbookProtection'));
}

export function setSheetProtection(sheet: ExcelSheet, enabled: boolean): void {
  const root = sheet.xmlRoot;
  if (!root) return;
  root.children = root.children.filter((child) => child.name !== 'sheetProtection');
  if (enabled) {
    root.children.unshift({ name: 'sheetProtection', attrs: { sheet: '1', objects: '1', scenarios: '1' }, text: '', children: [] });
    sheet.protected = true;
  } else {
    delete sheet.protected;
  }
}

function workbookNode(document: ExcelDocument): XmlNode | null {
  const root = document.workbookRoot;
  if (!root) return null;
  return findChild(root, 'workbook') ?? root;
}
