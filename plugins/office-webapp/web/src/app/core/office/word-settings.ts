import { findChild, parseXml, serializeXml, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';

const SETTINGS_PATH = 'word/settings.xml';
const SETTINGS_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml';
const SETTINGS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings';
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

/** Parse word/settings.xml, creating an empty settings root when the part is absent. */
export function readSettingsRoot(entries: Map<string, Uint8Array>): XmlNode {
  const bytes = entries.get(SETTINGS_PATH);
  if (bytes) {
    const parsed = parseXml(new TextDecoder('utf-8').decode(bytes));
    return findChild(parsed, 'w:settings') ?? parsed;
  }
  return { name: 'w:settings', attrs: { 'xmlns:w': W_NS }, text: '', children: [] };
}

/** Serialize the settings root and make sure the package wires the part. */
export function writeSettingsRoot(document: WordDocument, root: XmlNode): void {
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;
  entries.set(SETTINGS_PATH, new TextEncoder().encode(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + serializeXml(root)));
  ensureRelationship(entries);
  ensureContentType(entries);
}

function ensureRelationship(entries: Map<string, Uint8Array>): void {
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

function ensureContentType(entries: Map<string, Uint8Array>): void {
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

export function parseAutoHyphenation(entries: Map<string, Uint8Array>): boolean {
  const bytes = entries.get(SETTINGS_PATH);
  if (!bytes) return false;
  const settings = findChild(parseXml(new TextDecoder('utf-8').decode(bytes)), 'w:settings');
  const node = settings ? findChild(settings, 'w:autoHyphenation') : null;
  return Boolean(node) && node?.attrs['w:val'] !== '0';
}

const AUTO_HYPHEN_AFTER = new Set([
  'w:characterSpacingControl', 'w:printTwoOnOne', 'w:strictFirstAndLastChars', 'w:noLineBreaksAfter',
  'w:noLineBreaksBefore', 'w:savePreviewPicture', 'w:footnotePr', 'w:endnotePr', 'w:compat', 'w:docVars',
  'w:rsids', 'w:mathPr', 'w:themeFontLang', 'w:clrSchemeMapping', 'w:shapeDefaults',
  'w:decimalSymbol', 'w:listSeparator',
]);

export function setAutoHyphenation(document: WordDocument, enabled: boolean): void {
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;
  const root = readSettingsRoot(entries);
  root.children = root.children.filter((child) => child.name !== 'w:autoHyphenation');
  if (enabled) {
    // CT_Settings is ordered: place autoHyphenation after defaultTabStop (schema order Word validates).
    let index = root.children.findIndex((child) => child.name === 'w:defaultTabStop');
    if (index >= 0) index += 1;
    else index = root.children.findIndex((child) => AUTO_HYPHEN_AFTER.has(child.name));
    if (index < 0) index = root.children.length;
    root.children.splice(index, 0, { name: 'w:autoHyphenation', attrs: { 'w:val': '1' }, text: '', children: [] });
  }
  writeSettingsRoot(document, root);
  document.autoHyphenation = enabled;
}
