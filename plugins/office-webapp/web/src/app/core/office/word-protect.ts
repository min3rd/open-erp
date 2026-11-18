import { findChild, parseXml, serializeXml, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';

const SETTINGS_PATH = 'word/settings.xml';
const SETTINGS_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml';
const SETTINGS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings';
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function settingsRoot(entries: Map<string, Uint8Array>): XmlNode {
  const bytes = entries.get(SETTINGS_PATH);
  if (bytes) {
    const parsed = parseXml(new TextDecoder('utf-8').decode(bytes));
    return findChild(parsed, 'w:settings') ?? parsed;
  }
  return { name: 'w:settings', attrs: { 'xmlns:w': W_NS }, text: '', children: [] };
}

function writeSettings(document: WordDocument, root: XmlNode): void {
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;
  entries.set(SETTINGS_PATH, new TextEncoder().encode(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + serializeXml(root)));
  ensureSettingsRelationship(entries);
  ensureSettingsContentType(entries);
}

function ensureSettingsRelationship(entries: Map<string, Uint8Array>): void {
  const path = 'word/_rels/document.xml.rels';
  let rels = entries.get(path) ? new TextDecoder('utf-8').decode(entries.get(path)) : '';
  if (!rels) {
    rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  }
  if (!rels.includes('settings.xml')) {
    rels = rels.replace('</Relationships>',
      `<Relationship Id="rIdSettings" Type="${SETTINGS_REL}" Target="settings.xml"/></Relationships>`);
  }
  entries.set(path, new TextEncoder().encode(rels));
}

function ensureSettingsContentType(entries: Map<string, Uint8Array>): void {
  const path = '[Content_Types].xml';
  let types = entries.get(path) ? new TextDecoder('utf-8').decode(entries.get(path)) : '';
  if (!types) {
    types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>';
  }
  if (!types.includes('/word/settings.xml')) {
    types = types.replace('</Types>', `<Override PartName="/word/settings.xml" ContentType="${SETTINGS_TYPE}"/></Types>`);
  }
  entries.set(path, new TextEncoder().encode(types));
}

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
  const root = settingsRoot(entries);
  root.children = root.children.filter((child) => child.name !== 'w:documentProtection');
  if (enabled) {
    root.children.push({
      name: 'w:documentProtection',
      attrs: { 'w:edit': 'readOnly', 'w:enforcement': '1' },
      text: '', children: [],
    });
  }
  writeSettings(document, root);
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
  const root = settingsRoot(entries);
  let vars = findChild(root, 'w:docVars');
  if (!vars) {
    vars = { name: 'w:docVars', attrs: {}, text: '', children: [] };
    root.children.push(vars);
  }
  vars.children = vars.children.filter((child) => child.attrs['w:name'] !== name);
  vars.children.push({ name: 'w:docVar', attrs: { 'w:name': name, 'w:val': value }, text: '', children: [] });
  writeSettings(document, root);
}
