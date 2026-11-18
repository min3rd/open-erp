import { attr, descendants, findChild, type XmlNode } from '../binary/xml';
import type { WordBlock, WordDocument, WordParagraph } from './types';
import { setAcceptedText } from './word-markup';

export interface MergeData {
  headers: string[];
  rows: Array<Record<string, string>>;
}

export function parseMergeCsv(source: string): MergeData {
  const lines = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const split = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let quoted = false;
    for (let index = 0; index < line.length; index++) {
      const char = line[index];
      if (char === '"') {
        quoted = !quoted;
        continue;
      }
      if (char === ',' && !quoted) {
        values.push(current.trim());
        current = '';
        continue;
      }
      current += char;
    }
    values.push(current.trim());
    return values;
  };
  const headers = split(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = split(line);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => { row[header] = values[index] ?? ''; });
    return row;
  });
  return { headers, rows };
}

function bodyOf(document: WordDocument): XmlNode | null {
  return document.xmlRoot ? findChild(document.xmlRoot, 'w:body') : null;
}

function insertBeforeSection(body: XmlNode, node: XmlNode): void {
  const indexes = body.children
    .map((child, index) => (child.name === 'w:sectPr' ? index : -1))
    .filter((index) => index >= 0);
  const at = indexes.length ? indexes[indexes.length - 1] : body.children.length;
  body.children.splice(at, 0, node);
}

function fieldNode(field: string, placeholder = `«${field}»`): XmlNode {
  return {
    name: 'w:fldSimple',
    attrs: { 'w:instr': ` MERGEFIELD ${field} \\* MERGEFORMAT ` },
    text: '', children: [{
      name: 'w:r', attrs: {}, text: '', children: [
        { name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: placeholder, children: [] },
      ],
    }],
  };
}

export function insertMergeField(document: WordDocument, blockIndex: number, field: string): boolean {
  const block = document.blocks[blockIndex];
  if (!block || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return false;
  const value = field.trim();
  if (!value) return false;
  block.paragraph.xmlNode.children.push(fieldNode(value));
  block.paragraph.runs.push({ text: `«${value}»` });
  return true;
}

export function insertAddressBlock(document: WordDocument, nameField = 'Name', companyField = 'Company'): WordBlock | null {
  const body = bodyOf(document);
  if (!body) return null;
  const paragraph: XmlNode = {
    name: 'w:p', attrs: {}, text: '', children: [
      fieldNode(nameField),
      { name: 'w:r', attrs: {}, text: '', children: [{ name: 'w:br', attrs: {}, text: '', children: [] }] },
      fieldNode(companyField),
    ],
  };
  insertBeforeSection(body, paragraph);
  const block: WordBlock = {
    kind: 'paragraph',
    paragraph: { runs: [{ text: `«${nameField}»` }, { text: '\n' }, { text: `«${companyField}»` }], xmlNode: paragraph },
  };
  document.blocks.push(block);
  return block;
}

export function insertGreetingLine(document: WordDocument, blockIndex: number, prefix = 'Kính gửi', nameField = 'Name'): boolean {
  const block = document.blocks[blockIndex];
  if (!block || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return false;
  const text = `${prefix} `;
  block.paragraph.xmlNode.children.push(
    { name: 'w:r', attrs: {}, text: '', children: [{ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text, children: [] }] },
    fieldNode(nameField),
    { name: 'w:r', attrs: {}, text: '', children: [{ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: ',', children: [] }] },
  );
  block.paragraph.runs.push({ text }, { text: `«${nameField}»` }, { text: ',' });
  return true;
}

export function mergeFields(document: WordDocument, data: MergeData, recordIndex: number): number {
  const row = data.rows[recordIndex];
  if (!row) return 0;
  let replaced = 0;
  for (const block of document.blocks) {
    if (block.kind !== 'paragraph') continue;
    const current = block.paragraph.runs.map((run) => run.text).join('');
    const next = current.replace(/«([^»]+)»/g, (match, field: string) => {
      const value = row[field];
      if (value === undefined) return match;
      replaced++;
      return value;
    });
    if (next !== current) setAcceptedText(block.paragraph, next);
  }
  return replaced;
}

export function mergeFieldNames(document: WordDocument): string[] {
  const names = new Set<string>();
  for (const paragraph of paragraphs(document)) {
    for (const run of paragraph.runs) {
      for (const match of run.text.matchAll(/«([^»]+)»/g)) names.add(match[1]);
    }
  }
  return [...names];
}

export function paragraphs(document: WordDocument): WordParagraph[] {
  return document.blocks.filter((block) => block.kind === 'paragraph')
    .map((block) => (block.kind === 'paragraph' ? block.paragraph : null))
    .filter((paragraph): paragraph is WordParagraph => Boolean(paragraph));
}

export function mergeStatus(document: WordDocument, data: MergeData): { missing: string[]; records: number } {
  const fields = mergeFieldNames(document);
  return {
    missing: fields.filter((field) => !data.headers.includes(field)),
    records: data.rows.length,
  };
}

export function xmlFieldInstructions(document: WordDocument, prefix: string): string[] {
  if (!document.xmlRoot) return [];
  return descendants(document.xmlRoot, 'w:fldSimple')
    .map((node) => attr(node, 'w:instr') ?? '')
    .filter((instr) => instr.trim().startsWith(prefix))
    .map((instr) => instr.trim().slice(prefix.length).replace(/^"|"$/g, '').trim());
}
