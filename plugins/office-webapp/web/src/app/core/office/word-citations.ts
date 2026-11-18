import { attr, descendants, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';

export type CitationType = 'book' | 'journalArticle' | 'website' | 'report';

export interface CitationSource {
  tag: string;
  type: CitationType;
  author: string;
  title: string;
  year: string;
  publisher?: string;
  journal?: string;
  url?: string;
}

const BIBLIOGRAPHY_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/bibliography';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml';
const PART_PATH = 'customXml/item1.xml';

export function parseCitationSources(entries: Map<string, Uint8Array>, document: WordDocument): CitationSource[] {
  const path = citationPath(entries);
  if (!path) return [];
  const bytes = entries.get(path);
  if (!bytes) return [];
  const root = findChild(parseXml(new TextDecoder('utf-8').decode(bytes)), 'b:Sources');
  if (!root) return [];
  document.citationPath = path;
  document.citationRoot = root;
  return findChildren(root, 'b:Source').map((node) => {
    const type = mapType(textOf(findChild(node, 'b:SourceType')));
    const authorNode = findChild(node, 'b:Author');
    const person = findChild(findChild(authorNode, 'b:Author'), 'b:Author') ?? findChild(authorNode, 'b:Author');
    const last = textOf(findChild(person, 'b:Last'));
    const first = textOf(findChild(person, 'b:First'));
    return {
      tag: textOf(findChild(node, 'b:Tag')),
      type,
      author: [last, first].filter(Boolean).join(', '),
      title: textOf(findChild(node, 'b:Title')),
      year: textOf(findChild(node, 'b:Year')),
      publisher: textOf(findChild(node, 'b:Publisher')) || undefined,
      journal: textOf(findChild(node, 'b:JournalName')) || undefined,
      url: textOf(findChild(node, 'b:URL')) || undefined,
    };
  }).filter((source) => source.tag || source.title);
}

export function addCitationSource(
  document: WordDocument, sources: CitationSource[],
  input: Omit<CitationSource, 'tag'> & { tag?: string },
): CitationSource {
  const root = ensureSourcesRoot(document);
  const tag = sanitizeTag(input.tag || `${lastName(input.author)}${input.year || 'n.d.'}`);
  const source: CitationSource = {
    ...input,
    tag: uniqueTag(tag, sources),
    author: input.author.trim(),
    title: input.title.trim(),
    year: input.year.trim(),
  };
  sources.push(source);
  if (root) root.children.push(sourceNode(source));
  else document.sources = sources;
  return source;
}

export function removeCitationSource(document: WordDocument, sources: CitationSource[], tag: string): void {
  const root = ensureSourcesRoot(document);
  if (root) root.children = root.children.filter((child) => textOf(findChild(child, 'b:Tag')) !== tag);
  const index = sources.findIndex((source) => source.tag === tag);
  if (index >= 0) sources.splice(index, 1);
}

export function apaCitation(source: CitationSource): string {
  const author = authorLabel(source.author);
  return `(${author}, ${source.year || 'n.d.'})`;
}

export function apaBibliography(source: CitationSource): string {
  const author = bibliographyAuthor(source.author);
  const year = source.year || 'n.d.';
  const title = source.type === 'journalArticle' || source.type === 'website' ? `"${source.title}"` : source.title;
  const parts = [`${author} (${year}). ${title}.`];
  if (source.journal) parts.push(source.journal + '.');
  if (source.publisher) parts.push(source.publisher + '.');
  if (source.url) parts.push(source.url);
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export function insertCitation(
  document: WordDocument, sources: CitationSource[], tags: string[], paragraphIndex: number,
): boolean {
  const block = document.blocks[paragraphIndex];
  if (!block || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return false;
  const selected = sources.filter((source) => tags.includes(source.tag));
  if (!selected.length) return false;
  const result = selected.map(apaCitation).join('; ');
  block.paragraph.xmlNode.children.push(fieldRun(` CITATION ${tags.join(' ')} `, result));
  block.paragraph.runs.push({ text: result });
  return true;
}

export function insertBibliography(document: WordDocument, sources: CitationSource[]): number {
  const body = document.xmlRoot ? findChild(document.xmlRoot, 'w:body') : null;
  if (!body || !sources.length) return 0;
  const heading: XmlNode = {
    name: 'w:p', attrs: {}, text: '', children: [
      {
        name: 'w:r', attrs: {}, text: '', children: [
          { name: 'w:rPr', attrs: {}, text: '', children: [{ name: 'w:b', attrs: {}, text: '', children: [] }] },
          { name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: 'Tài liệu tham khảo', children: [] },
        ],
      },
    ],
  };
  const entries = sources.map((source) => ({
    name: 'w:p',
    attrs: {},
    text: '',
    children: [{
      name: 'w:r', attrs: {}, text: '', children: [
        { name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: apaBibliography(source), children: [] },
      ],
    }],
  }));
  const sectPr = findChild(body, 'w:sectPr');
  const index = sectPr ? body.children.indexOf(sectPr) : body.children.length;
  body.children.splice(index, 0, heading, ...entries);
  document.blocks.push({ kind: 'paragraph', paragraph: { runs: [{ text: 'Tài liệu tham khảo', bold: true }] } });
  for (const source of sources) {
    document.blocks.push({ kind: 'paragraph', paragraph: { runs: [{ text: apaBibliography(source) }] } });
  }
  return sources.length;
}

export function citationPart(document: WordDocument): { name: string; data: string } | null {
  const path = document.citationPath ?? PART_PATH;
  const root = document.citationRoot;
  if (!root) return null;
  return { name: path, data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${serialize(root)}` };
}

function ensureSourcesRoot(document: WordDocument): XmlNode | null {
  if (document.citationRoot) return document.citationRoot;
  const root: XmlNode = {
    name: 'b:Sources',
    attrs: { 'xmlns:b': BIBLIOGRAPHY_NS, SelectedStyle: 'APA' },
    text: '',
    children: [],
  };
  document.citationRoot = root;
  document.citationPath = PART_PATH;
  addRelationship(document.packageEntries, 'rIdBibliography', REL_TYPE, '../customXml/item1.xml');
  addContentType(document.packageEntries, '/customXml/item1.xml', 'application/xml');
  return root;
}

function sourceNode(source: CitationSource): XmlNode {
  const author: XmlNode = {
    name: 'b:Author', attrs: {}, text: '', children: [{
      name: 'b:Author', attrs: {}, text: '', children: [
        { name: 'b:Last', attrs: {}, text: source.author, children: [] },
      ],
    }],
  };
  const children: XmlNode[] = [
    { name: 'b:Tag', attrs: {}, text: source.tag, children: [] },
    { name: 'b:SourceType', attrs: {}, text: mapTypeOut(source.type), children: [] },
    author,
    { name: 'b:Title', attrs: {}, text: source.title, children: [] },
    { name: 'b:Year', attrs: {}, text: source.year, children: [] },
  ];
  if (source.publisher) children.push({ name: 'b:Publisher', attrs: {}, text: source.publisher, children: [] });
  if (source.journal) children.push({ name: 'b:JournalName', attrs: {}, text: source.journal, children: [] });
  if (source.url) children.push({ name: 'b:URL', attrs: {}, text: source.url, children: [] });
  return { name: 'b:Source', attrs: {}, text: '', children };
}

function fieldRun(instr: string, result: string): XmlNode {
  return {
    name: 'w:r', attrs: {}, text: '', children: [
      { name: 'w:fldChar', attrs: { 'w:fldCharType': 'begin' }, text: '', children: [] },
      { name: 'w:instrText', attrs: { 'xml:space': 'preserve' }, text: instr, children: [] },
      { name: 'w:fldChar', attrs: { 'w:fldCharType': 'separate' }, text: '', children: [] },
      { name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: result, children: [] },
      { name: 'w:fldChar', attrs: { 'w:fldCharType': 'end' }, text: '', children: [] },
    ],
  };
}

function citationPath(entries: Map<string, Uint8Array>): string | null {
  const bytes = entries.get('word/_rels/document.xml.rels');
  if (!bytes) return null;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  for (const rel of descendants(root, 'Relationship')) {
    const type = attr(rel, 'Type') ?? '';
    const target = attr(rel, 'Target') ?? '';
    if (type.endsWith('/customXml') && target.includes('customXml')) {
      return target.replace(/^\.\.\//, '').replace(/^\.\//, '');
    }
  }
  return entries.has('customXml/item1.xml') ? 'customXml/item1.xml' : null;
}

function mapType(value: string): CitationType {
  const normalized = value.toLowerCase();
  if (normalized.includes('journal')) return 'journalArticle';
  if (normalized.includes('web')) return 'website';
  if (normalized.includes('report')) return 'report';
  return 'book';
}

function mapTypeOut(type: CitationType): string {
  return type === 'journalArticle' ? 'JournalArticle' : type === 'website' ? 'InternetSite' : type === 'report' ? 'Report' : 'Book';
}

function authorLabel(author: string): string {
  const clean = author.trim();
  if (!clean) return 'Unknown';
  if (clean.includes(',')) return clean.split(',')[0].trim();
  return clean.split(/\s+/).pop() ?? clean;
}

function bibliographyAuthor(author: string): string {
  const clean = author.trim();
  if (!clean) return 'Unknown';
  if (clean.includes(',')) return clean;
  const parts = clean.split(/\s+/);
  const last = parts.pop()!;
  return `${last}, ${parts.map((part) => `${part[0]}.`).join(' ')}`.trim().replace(/,\s*$/, '');
}

function sanitizeTag(value: string): string {
  const clean = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]/g, '');
  return clean || 'Source';
}

function uniqueTag(tag: string, sources: CitationSource[]): string {
  let candidate = tag;
  let counter = 1;
  while (sources.some((source) => source.tag === candidate)) candidate = `${tag}${++counter}`;
  return candidate;
}

function lastName(author: string): string {
  return author.includes(',') ? author.split(',')[0].trim() : author.trim().split(/\s+/).pop() ?? 'Source';
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
