import { attr, descendants, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';
import type { WordSectionInfo } from './word-section';

export type NoteKind = 'footnote' | 'endnote';
export type NoteNumberFormat = 'decimal' | 'lowerRoman' | 'upperRoman' | 'lowerLetter' | 'upperLetter';
export type NoteRestart = 'continuous' | 'eachSect' | 'eachPage';

export interface WordNote {
  id: number;
  kind: NoteKind;
  text: string;
  refParagraph: number;
  numbering: number;
}

export interface WordNotes {
  footnotes: WordNote[];
  endnotes: WordNote[];
  footnoteFormat: NoteNumberFormat;
  endnoteFormat: NoteNumberFormat;
  footnoteRestart: NoteRestart;
  endnoteRestart: NoteRestart;
  roots: { footnote: XmlNode | null; endnote: XmlNode | null };
}

const NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const CONTENT_TYPE = {
  footnote: 'application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml',
  endnote: 'application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml',
};

export function parseWordNotes(document: WordDocument, entries: Map<string, Uint8Array>): WordNotes {
  const rels = parseRelationships(entries);
  const footnotePart = parsePart('footnote', resolvePath(rels, 'footnotes.xml'), entries, document);
  const endnotePart = parsePart('endnote', resolvePath(rels, 'endnotes.xml'), entries, document);
  const section = document.sections?.[0];
  return {
    footnotes: footnotePart.notes,
    endnotes: endnotePart.notes,
    footnoteFormat: readFormat(section, 'footnote'),
    endnoteFormat: readFormat(section, 'endnote'),
    footnoteRestart: readRestart(section, 'footnote'),
    endnoteRestart: readRestart(section, 'endnote'),
    roots: { footnote: footnotePart.root, endnote: endnotePart.root },
  };
}

export function ensureNote(
  document: WordDocument, notes: WordNotes, kind: NoteKind, text: string, paragraphIndex: number,
): WordNote | null {
  const block = document.blocks[paragraphIndex];
  if (!block || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return null;
  const root = ensureNotesRoot(document, notes, kind);
  if (!root) return null;
  const list = kind === 'footnote' ? notes.footnotes : notes.endnotes;
  const id = list.reduce((max, note) => Math.max(max, note.id), 0) + 1;
  const noteNode: XmlNode = {
    name: kind === 'footnote' ? 'w:footnote' : 'w:endnote',
    attrs: { 'w:id': String(id) },
    text: '',
    children: [{
      name: 'w:p', attrs: {}, text: '', children: [
        {
          name: 'w:r', attrs: {}, text: '', children: [
            { name: 'w:t', attrs: { 'xml:space': 'preserve' }, text, children: [] },
          ],
        },
      ],
    }],
  };
  root.children.push(noteNode);

  const reference: XmlNode = {
    name: 'w:r',
    attrs: {},
    text: '',
    children: [
      { name: 'w:rPr', attrs: {}, text: '', children: [{ name: 'w:rStyle', attrs: { 'w:val': kind === 'footnote' ? 'FootnoteReference' : 'EndnoteReference' }, text: '', children: [] }] },
      { name: kind === 'footnote' ? 'w:footnoteReference' : 'w:endnoteReference', attrs: { 'w:id': String(id) }, text: '', children: [] },
    ],
  };
  block.paragraph.xmlNode.children.push(reference);

  const note: WordNote = {
    id,
    kind,
    text,
    refParagraph: paragraphIndex,
    numbering: list.length + 1,
  };
  list.push(note);
  return note;
}

export function deleteNote(document: WordDocument, notes: WordNotes, kind: NoteKind, id: number): boolean {
  const root = notes.roots[kind];
  if (!root) return false;
  const name = kind === 'footnote' ? 'w:footnote' : 'w:endnote';
  root.children = root.children.filter((child) => !(child.name === name && attr(child, 'w:id') === String(id)));
  const list = kind === 'footnote' ? notes.footnotes : notes.endnotes;
  const index = list.findIndex((note) => note.id === id);
  if (index >= 0) list.splice(index, 1);
  for (const block of document.blocks) {
    if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) continue;
    block.paragraph.xmlNode.children = block.paragraph.xmlNode.children.filter((child) => {
      if (child.name !== 'w:r') return true;
      const reference = findChild(child, kind === 'footnote' ? 'w:footnoteReference' : 'w:endnoteReference');
      return !reference || attr(reference, 'w:id') !== String(id);
    });
  }
  relabel(list);
  return true;
}

export function setNoteNumbering(
  section: WordSectionInfo | null, notes: WordNotes, kind: NoteKind,
  format: NoteNumberFormat, restart: NoteRestart,
): void {
  if (kind === 'footnote') {
    notes.footnoteFormat = format;
    notes.footnoteRestart = restart;
  } else {
    notes.endnoteFormat = format;
    notes.endnoteRestart = restart;
  }
  if (!section) return;
  const name = kind === 'footnote' ? 'w:footnotePr' : 'w:endnotePr';
  let node = findChild(section.node, name);
  if (!node) {
    node = { name, attrs: {}, text: '', children: [] };
    section.node.children.unshift(node);
  }
  const fmt: XmlNode = { name: 'w:numFmt', attrs: { 'w:val': format }, text: '', children: [] };
  const restartNode: XmlNode = { name: 'w:numRestart', attrs: { 'w:val': restart }, text: '', children: [] };
  node.children = [fmt, restartNode];
}

export function notesParts(document: WordDocument): Array<{ name: string; data: string }> {
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const parts: Array<{ name: string; data: string }> = [];
  const notes = document.notes;
  if (!notes) return parts;
  for (const kind of ['footnote', 'endnote'] as NoteKind[]) {
    const root = notes.roots[kind];
    if (!root) continue;
    parts.push({
      name: kind === 'footnote' ? 'word/footnotes.xml' : 'word/endnotes.xml',
      data: declaration + serialize(root),
    });
  }
  return parts;
}

function parsePart(
  kind: NoteKind, path: string | null, entries: Map<string, Uint8Array>, document: WordDocument,
): { notes: WordNote[]; root: XmlNode | null } {
  if (!path) return { notes: [], root: null };
  const bytes = entries.get(path);
  if (!bytes) return { notes: [], root: null };
  const root = findChild(parseXml(new TextDecoder('utf-8').decode(bytes)), kind === 'footnote' ? 'w:footnotes' : 'w:endnotes');
  if (!root) return { notes: [], root: null };
  const references = referenceMap(document, kind);
  const name = kind === 'footnote' ? 'w:footnote' : 'w:endnote';
  const notes: WordNote[] = [];
  for (const node of findChildren(root, name)) {
    const type = attr(node, 'w:type');
    if (type === 'separator' || type === 'continuationSeparator' || type === 'continuationNotice') continue;
    const id = Number(attr(node, 'w:id'));
    if (!Number.isFinite(id) || id < 0) continue;
    notes.push({
      id,
      kind,
      text: findChildren(node, 'w:p').map((paragraph) => textOf(paragraph)).join('\n').trim(),
      refParagraph: references.get(id) ?? -1,
      numbering: notes.length + 1,
    });
  }
  return { notes, root };
}

export function referenceMap(document: WordDocument, kind: NoteKind): Map<number, number> {
  const map = new Map<number, number>();
  const name = kind === 'footnote' ? 'w:footnoteReference' : 'w:endnoteReference';
  document.blocks.forEach((block, index) => {
    if (block.kind === 'paragraph') {
      if (block.paragraph.xmlNode) {
        for (const node of descendants(block.paragraph.xmlNode, name)) {
          const id = Number(attr(node, 'w:id'));
          if (Number.isFinite(id)) map.set(id, index);
        }
      } else {
        for (const run of block.paragraph.runs) {
          if (run.noteRef?.kind === kind) map.set(run.noteRef.id, index);
        }
      }
      return;
    }
    for (const row of block.rows) {
      for (const cell of row) {
        for (const paragraph of cell) {
          if (paragraph.xmlNode) {
            for (const node of descendants(paragraph.xmlNode, name)) {
              const id = Number(attr(node, 'w:id'));
              if (Number.isFinite(id)) map.set(id, index);
            }
          }
          for (const run of paragraph.runs) {
            if (run.noteRef?.kind === kind) map.set(run.noteRef.id, index);
          }
        }
      }
    }
  });
  return map;
}

export function formatNoteNumber(value: number, format: NoteNumberFormat | string = 'decimal'): string {
  const n = Math.max(1, Math.round(value));
  if (format === 'lowerRoman' || format === 'upperRoman') {
    const romans: Array<[number, string]> = [
      [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'],
      [100, 'c'], [90, 'xc'], [50, 'l'], [40, 'xl'],
      [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
    ];
    let left = n;
    let out = '';
    for (const [unit, sym] of romans) {
      while (left >= unit) { out += sym; left -= unit; }
    }
    return format === 'upperRoman' ? out.toUpperCase() : out;
  }
  if (format === 'lowerLetter' || format === 'upperLetter') {
    const code = 97 + ((n - 1) % 26);
    const ch = String.fromCharCode(code);
    return format === 'upperLetter' ? ch.toUpperCase() : ch;
  }
  return String(n);
}

function ensureNotesRoot(document: WordDocument, notes: WordNotes, kind: NoteKind): XmlNode | null {
  const existing = notes.roots[kind];
  if (existing) return existing;
  const rootName = kind === 'footnote' ? 'w:footnotes' : 'w:endnotes';
  const root: XmlNode = { name: rootName, attrs: { 'xmlns:w': NS }, text: '', children: [] };
  const nodeName = kind === 'footnote' ? 'w:footnote' : 'w:endnote';
  const separator: XmlNode = {
    name: nodeName,
    attrs: { 'w:type': 'separator', 'w:id': '-1' },
    text: '',
    children: [{ name: 'w:p', attrs: {}, text: '', children: [{ name: 'w:r', attrs: {}, text: '', children: [{ name: 'w:separator', attrs: {}, text: '', children: [] }] }] }],
  };
  const continuation: XmlNode = {
    name: nodeName,
    attrs: { 'w:type': 'continuationSeparator', 'w:id': '0' },
    text: '',
    children: [{ name: 'w:p', attrs: {}, text: '', children: [{ name: 'w:r', attrs: {}, text: '', children: [{ name: 'w:continuationSeparator', attrs: {}, text: '', children: [] }] }] }],
  };
  root.children.push(separator, continuation);
  notes.roots[kind] = root;

  const relId = kind === 'footnote' ? 'rIdFootnotes' : 'rIdEndnotes';
  addRelationship(document.packageEntries, relId, `${REL_TYPE}/${kind === 'footnote' ? 'footnotes' : 'endnotes'}`,
    kind === 'footnote' ? 'footnotes.xml' : 'endnotes.xml');
  addContentType(document.packageEntries,
    kind === 'footnote' ? '/word/footnotes.xml' : '/word/endnotes.xml', CONTENT_TYPE[kind]);
  return root;
}

function readFormat(section: WordSectionInfo | undefined, kind: NoteKind): NoteNumberFormat {
  if (!section) return 'decimal';
  const props = findChild(section.node, kind === 'footnote' ? 'w:footnotePr' : 'w:endnotePr');
  return (attr(findChild(props, 'w:numFmt'), 'w:val') as NoteNumberFormat) ?? 'decimal';
}

function readRestart(section: WordSectionInfo | undefined, kind: NoteKind): NoteRestart {
  if (!section) return 'continuous';
  const props = findChild(section.node, kind === 'footnote' ? 'w:footnotePr' : 'w:endnotePr');
  return (attr(findChild(props, 'w:numRestart'), 'w:val') as NoteRestart) ?? 'continuous';
}

function relabel(list: WordNote[]): void {
  list.sort((a, b) => a.id - b.id).forEach((note, index) => { note.numbering = index + 1; });
}

function parseRelationships(entries: Map<string, Uint8Array>): Map<string, string> {
  const map = new Map<string, string>();
  const bytes = entries.get('word/_rels/document.xml.rels');
  if (!bytes) return map;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  for (const rel of descendants(root, 'Relationship')) {
    const id = attr(rel, 'Id');
    const target = attr(rel, 'Target');
    if (id && target) map.set(id, target);
  }
  return map;
}

function resolvePath(rels: Map<string, string>, file: string): string | null {
  for (const target of rels.values()) {
    if (target.endsWith(file)) {
      const clean = target.replace(/^\.\//, '');
      return clean.startsWith('word/') ? clean : `word/${clean}`;
    }
  }
  return null;
}

function addRelationship(entries: Map<string, Uint8Array> | undefined, id: string, type: string, target: string): void {
  if (!entries) return;
  const bytes = entries.get('word/_rels/document.xml.rels');
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const rel = `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`;
  let xml = bytes ? new TextDecoder('utf-8').decode(bytes) : `${declaration}<Relationships xmlns="${REL_NS}"></Relationships>`;
  if (!xml.includes(`Id="${id}"`)) xml = xml.replace('</Relationships>', `${rel}</Relationships>`);
  entries.set('word/_rels/document.xml.rels', new TextEncoder().encode(xml));
}

function addContentType(entries: Map<string, Uint8Array> | undefined, partName: string, contentType: string): void {
  if (!entries) return;
  const bytes = entries.get('[Content_Types].xml');
  if (!bytes) return;
  let xml = new TextDecoder('utf-8').decode(bytes);
  if (xml.includes(`PartName="${partName}"`)) return;
  const override = `<Override PartName="${partName}" ContentType="${contentType}"/>`;
  if (xml.includes('</Types>')) xml = xml.replace('</Types>', `${override}</Types>`);
  else if (/<Types[^>]*\/>/.test(xml)) xml = xml.replace(/<Types([^>]*)\/>/, `<Types$1>${override}</Types>`);
  entries.set('[Content_Types].xml', new TextEncoder().encode(xml));
}

function serialize(node: XmlNode): string {
  if (node.name === '#document') return node.children.map(serialize).join('');
  const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${escapeAttr(value)}"`).join('');
  const body = `${escapeText(node.text)}${node.children.map(serialize).join('')}`;
  return `<${node.name}${attrs}>${body}</${node.name}>`;
}

function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeText(value).replace(/"/g, '&quot;');
}
