import { serializeXml } from '../binary/xml';
import { readZip, writeZip, type ZipWriteEntry } from '../binary/zip';
import { buildCommentsParts, ensureCommentsRelationships } from './comments';
import { headerFooterParts } from './word-section';
import { notesParts } from './word-notes';
import { citationPart } from './word-citations';
import { inkPart } from './word-ink';
import type { WordDocument } from './types';

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

export async function saveDocx(doc: WordDocument, original: ArrayBuffer): Promise<Uint8Array> {
  if (!doc.xmlRoot) throw new Error('OFFICE_DOCX_SAVE_FAILED');
  const zip = await readZip(original);
  const entries = toEntries(zip);
  replaceEntry(entries, 'word/document.xml', XML_DECL + serializeXml(doc.xmlRoot));
  if (doc.comments && doc.comments.length) {
    for (const part of buildCommentsParts(doc.comments)) replaceEntry(entries, part.name, part.data);
    ensureCommentsRelationships(zip.entries, (name, data) => replaceEntry(entries, name, data));
  }
  for (const part of headerFooterParts(doc)) replaceEntry(entries, part.name, part.data);
  for (const part of notesParts(doc)) replaceEntry(entries, part.name, part.data);
  const bibliography = citationPart(doc);
  if (bibliography) replaceEntry(entries, bibliography.name, bibliography.data);
  const ink = inkPart(doc);
  if (ink) replaceEntry(entries, ink.name, ink.data);
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
  return writeZip(entries);
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
