import { serializeXml } from '../binary/xml';
import { readZip, writeZip, type ZipWriteEntry } from '../binary/zip';
import { buildCommentsParts, ensureCommentsRelationships } from './comments';
import { headerFooterParts } from './word-section';
import { notesParts } from './word-notes';
import { citationPart } from './word-citations';
import { inkPart } from './word-ink';
import { smartArtParts } from './word-smartart';
import { buildSyntheticWordPackage } from './word-synthetic';
import type { WordDocument } from './types';

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

function isZipBytes(buffer: ArrayBuffer | null | undefined): boolean {
  if (!buffer || buffer.byteLength < 4) return false;
  const view = new Uint8Array(buffer, 0, 4);
  return view[0] === 0x50 && view[1] === 0x4b && view[2] === 0x03 && view[3] === 0x04;
}

export async function saveDocx(doc: WordDocument, original?: ArrayBuffer | null): Promise<Uint8Array> {
  let entries: ZipWriteEntry[];
  let zipEntriesMap: Map<string, Uint8Array>;
  if (isZipBytes(original) && !doc.readOnlyLegacy && doc.sourceFormat !== 'odt') {
    if (!doc.xmlRoot) throw new Error('OFFICE_DOCX_SAVE_FAILED');
    const zip = await readZip(original!);
    entries = toEntries(zip);
    zipEntriesMap = zip.entries;
  } else {
    if (!doc.xmlRoot || !doc.packageEntries?.has('_rels/.rels')) {
      buildSyntheticWordPackage(doc);
    }
    if (!doc.xmlRoot || !doc.packageEntries) throw new Error('OFFICE_DOCX_SAVE_FAILED');
    zipEntriesMap = new Map(doc.packageEntries);
    entries = [...zipEntriesMap.entries()].map(([name, data]) => ({ name, data }));
  }
  replaceEntry(entries, 'word/document.xml', XML_DECL + serializeXml(doc.xmlRoot));
  if (doc.comments && doc.comments.length) {
    for (const part of buildCommentsParts(doc.comments)) replaceEntry(entries, part.name, part.data);
    ensureCommentsRelationships(zipEntriesMap, (name, data) => replaceEntry(entries, name, data));
  }
  for (const part of headerFooterParts(doc)) replaceEntry(entries, part.name, part.data);
  for (const part of notesParts(doc)) replaceEntry(entries, part.name, part.data);
  const bibliography = citationPart(doc);
  if (bibliography) replaceEntry(entries, bibliography.name, bibliography.data);
  const ink = inkPart(doc);
  if (ink) replaceEntry(entries, ink.name, ink.data);
  for (const part of smartArtParts(doc)) replaceEntry(entries, part.name, part.data);
  for (const name of ['word/_rels/document.xml.rels', '[Content_Types].xml']) {
    const bytes = doc.packageEntries?.get(name);
    if (bytes) replaceBinary(entries, name, bytes);
  }
  for (const [name, bytes] of doc.packageEntries ?? []) {
    if (name.startsWith('word/media/')
      || name === 'word/numbering.xml'
      || name === 'word/settings.xml'
      || name === 'word/styles.xml'
      || name === 'word/theme/theme1.xml') {
      replaceBinary(entries, name, bytes);
    }
  }
  ensureContentTypes(entries);
  return writeZip(entries);
}

const CT_NS = 'http://schemas.openxmlformats.org/package/2006/content-types';
const PART_TYPES: Array<[string, string]> = [
  ['/word/document.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml'],
  ['/word/styles.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml'],
  ['/word/numbering.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml'],
  ['/word/settings.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml'],
  ['/word/comments.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml'],
  ['/word/footnotes.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml'],
  ['/word/endnotes.xml', 'application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml'],
  ['/word/theme/theme1.xml', 'application/vnd.openxmlformats-officedocument.theme+xml'],
];

/** A minimal docx (or synthetic fixture) can arrive with empty/absent content types; Word rejects that. */
function ensureContentTypes(entries: ZipWriteEntry[]): void {
  const found = entries.find((entry) => entry.name === '[Content_Types].xml');
  let xml = found ? new TextDecoder('utf-8').decode(found.data) : '';
  if (!xml.includes('<Types')) xml = `<Types xmlns="${CT_NS}"></Types>`;
  const add = (fragment: string, marker: string): void => {
    if (xml.includes(marker)) return;
    if (xml.includes('</Types>')) xml = xml.replace('</Types>', `${fragment}</Types>`);
    else xml = xml.replace(/<Types([^>]*)\/>/, `<Types$1>${fragment}</Types>`);
  };
  add('<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>', 'Extension="rels"');
  add('<Default Extension="xml" ContentType="application/xml"/>', 'Extension="xml"');
  for (const [partName, contentType] of PART_TYPES) {
    if (!entries.some((entry) => `/${entry.name}` === partName)) continue;
    add(`<Override PartName="${partName}" ContentType="${contentType}"/>`, `PartName="${partName}"`);
  }
  replaceBinary(entries, '[Content_Types].xml', new TextEncoder().encode(xml));
}

function replaceBinary(entries: ZipWriteEntry[], name: string, data: Uint8Array): void {
  const found = entries.find((entry) => entry.name === name);
  if (found) found.data = data;
  else entries.push({ name, data });
}

function toEntries(zip: Awaited<ReturnType<typeof readZip>>): ZipWriteEntry[] {
  return zip.order.map((name) => ({ name, data: zip.entries.get(name) ?? new Uint8Array() }));
}

function replaceEntry(entries: ZipWriteEntry[], name: string, xml: string): void {
  const data = new TextEncoder().encode(xml);
  const found = entries.find((entry) => entry.name === name);
  if (found) found.data = data;
  else entries.push({ name, data });
}
