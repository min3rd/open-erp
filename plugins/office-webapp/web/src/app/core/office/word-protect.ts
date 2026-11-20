import { findChild, parseXml } from '../binary/xml';
import type { WordDocument } from './types';
import { readSettingsRoot, writeSettingsRoot } from './word-settings';

const SETTINGS_PATH = 'word/settings.xml';

export function parseProtection(entries: Map<string, Uint8Array>): boolean {
  const bytes = entries.get(SETTINGS_PATH);
  if (!bytes) return false;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const settings = findChild(root, 'w:settings') ?? root;
  const protection = findChild(settings, 'w:documentProtection');
  return Boolean(protection) && protection?.attrs['w:enforcement'] !== '0';
}

export function setDocumentProtection(document: WordDocument, enabled: boolean): boolean {
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;
  const root = readSettingsRoot(entries);
  root.children = root.children.filter((child) => child.name !== 'w:documentProtection');
  if (enabled) {
    root.children.push({
      name: 'w:documentProtection',
      attrs: { 'w:edit': 'readOnly', 'w:enforcement': '1' },
      text: '', children: [],
    });
  }
  writeSettingsRoot(document, root);
  document.protected = enabled;
  return true;
}

export function docVar(document: WordDocument, name: string): string | undefined {
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  const bytes = entries.get(SETTINGS_PATH);
  if (!bytes) return undefined;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const settings = findChild(root, 'w:settings') ?? root;
  for (const variable of findChild(settings, 'w:docVars')?.children ?? []) {
    if (variable.attrs['w:name'] === name) return variable.attrs['w:val'];
  }
  return undefined;
}

export function setDocVar(document: WordDocument, name: string, value: string): void {
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;
  const root = readSettingsRoot(entries);
  let vars = findChild(root, 'w:docVars');
  if (!vars) {
    vars = { name: 'w:docVars', attrs: {}, text: '', children: [] };
    root.children.push(vars);
  }
  vars.children = vars.children.filter((child) => child.attrs['w:name'] !== name);
  vars.children.push({ name: 'w:docVar', attrs: { 'w:name': name, 'w:val': value }, text: '', children: [] });
  writeSettingsRoot(document, root);
}
