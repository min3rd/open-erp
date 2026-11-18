import { type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';

const RELS_PATH = 'word/_rels/document.xml.rels';

export function insertHyperlink(document: WordDocument, blockIndex: number, text: string, url: string): boolean {
  const block = document.blocks[blockIndex];
  if (!block || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return false;
  const value = text.trim() || url;
  if (!value || !url.trim()) return false;
  const relId = ensureHyperlinkRel(document, url);
  const run: XmlNode = {
    name: 'w:r', attrs: {}, text: '', children: [
      { name: 'w:rPr', attrs: {}, text: '', children: [
        { name: 'w:color', attrs: { 'w:val': '0563C1' }, text: '', children: [] },
        { name: 'w:u', attrs: { 'w:val': 'single' }, text: '', children: [] },
      ] },
      { name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: value, children: [] },
    ],
  };
  block.paragraph.xmlNode.children.push({
    name: 'w:hyperlink', attrs: { 'r:id': relId }, text: '', children: [run],
  });
  block.paragraph.runs.push({ text: value, link: url.trim(), color: '#0563C1', underline: true });
  return true;
}

export function ensureHyperlinkRel(document: WordDocument, url: string): string {
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;
  let rels = entries.get(RELS_PATH) ? new TextDecoder('utf-8').decode(entries.get(RELS_PATH)) : '';
  if (!rels) {
    rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  }
  const existing = new RegExp(`<Relationship[^>]*Type="[^"]*\\/hyperlink"[^>]*Target="${escapeRegExp(escapeAttr(url.trim()))}"`).exec(rels);
  if (existing) return /Id="([^"]+)"/.exec(existing[0])?.[1] ?? 'rIdLink1';
  let index = 1;
  while (rels.includes(`Id="rIdLink${index}"`)) index++;
  const relId = `rIdLink${index}`;
  rels = rels.replace('</Relationships>',
    `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escapeAttr(url.trim())}" TargetMode="External"/></Relationships>`);
  entries.set(RELS_PATH, new TextEncoder().encode(rels));
  return relId;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
