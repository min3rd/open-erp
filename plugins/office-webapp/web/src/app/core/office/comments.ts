import { attr, descendants, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';

export interface WordComment {
  id: number;
  parentId: number | null;
  author: string;
  initials: string;
  date: string;
  text: string;
  resolved: boolean;
  paragraphIndex: number;
  paraId?: string;
}

const COMMENTS_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const W14_NS = 'http://schemas.microsoft.com/office/word/2010/wordml';

export function parseWordComments(entries: Map<string, Uint8Array>, document: WordDocument): WordComment[] {
  const bytes = entries.get('word/comments.xml');
  if (!bytes) return [];
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const paragraphs = findChild(root, 'w:comments') ?? root;
  const anchors = anchorMap(document);
  const extended = parseExtended(entries.get('word/commentsExtended.xml'));
  const parentByPara = new Map<string, string>();
  const doneByPara = new Map<string, boolean>();
  for (const node of extended) {
    const paraId = attr(node, 'w15:paraId') ?? attr(node, 'w14:paraId');
    const parent = attr(node, 'w15:paraIdParent') ?? attr(node, 'w14:paraIdParent');
    if (paraId && parent) parentByPara.set(paraId, parent);
    if (paraId) doneByPara.set(paraId, attr(node, 'w15:done') === '1' || attr(node, 'w14:done') === '1');
  }

  const byPara = new Map<string, number>();
  const comments: WordComment[] = [];
  for (const node of findChildren(paragraphs, 'w:comment')) {
    const id = Number(attr(node, 'w:id') ?? '-1');
    if (!Number.isFinite(id) || id < 0) continue;
    const paragraphNodes = findChildren(node, 'w:p');
    const last = paragraphNodes[paragraphNodes.length - 1];
    const paraId = last?.attrs['w14:paraId'] ?? last?.attrs['w15:paraId'];
    if (paraId) byPara.set(paraId, id);
    const text = paragraphNodes.map((paragraph) => textOf(paragraph)).join('\n').trim()
      || descendants(node, 'w:t').map((textNode) => textNode.text).join('').trim();
    comments.push({
      id,
      parentId: null,
      author: attr(node, 'w:author') ?? '',
      initials: attr(node, 'w:initials') ?? '',
      date: attr(node, 'w:date') ?? '',
      text,
      resolved: paraId ? doneByPara.get(paraId) === true : false,
      paragraphIndex: anchors.get(String(id)) ?? -1,
      paraId,
    });
  }
  for (const comment of comments) {
    if (!comment.paraId) continue;
    const parentPara = parentByPara.get(comment.paraId);
    if (parentPara && byPara.has(parentPara)) comment.parentId = byPara.get(parentPara)!;
  }
  for (const comment of comments) {
    if (comment.parentId === null) continue;
    const parent = comments.find((item) => item.id === comment.parentId);
    if (parent && parent.paragraphIndex < 0) comment.paragraphIndex = parent.paragraphIndex;
  }
  return comments;
}

export function parseExtended(bytes: Uint8Array | undefined): XmlNode[] {
  if (!bytes) return [];
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  return findChildren(root, 'w15:commentsEx').length
    ? findChildren(findChild(root, 'w15:commentsEx'), 'w15:commentEx')
    : findChildren(root, 'w15:commentEx');
}

function anchorMap(document: WordDocument): Map<string, number> {
  const map = new Map<string, number>();
  document.blocks.forEach((block, index) => {
    if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) return;
    for (const node of descendants(block.paragraph.xmlNode, 'w:commentRangeStart')) {
      const id = attr(node, 'w:id');
      if (id !== undefined && !map.has(id)) map.set(id, index);
    }
  });
  return map;
}

export function createComment(
  comments: WordComment[], input: { author: string; initials: string; text: string; paragraphIndex: number },
  now = new Date(),
): WordComment {
  const id = comments.reduce((max, comment) => Math.max(max, comment.id), -1) + 1;
  const paraId = randomParaId();
  const comment: WordComment = {
    id,
    parentId: null,
    author: input.author,
    initials: input.initials,
    date: now.toISOString(),
    text: input.text,
    resolved: false,
    paragraphIndex: input.paragraphIndex,
    paraId,
  };
  comments.push(comment);
  return comment;
}

export function replyToComment(
  comments: WordComment[], parent: WordComment, input: { author: string; initials: string; text: string },
  now = new Date(),
): WordComment {
  const id = comments.reduce((max, comment) => Math.max(max, comment.id), -1) + 1;
  const reply: WordComment = {
    id,
    parentId: parent.id,
    author: input.author,
    initials: input.initials,
    date: now.toISOString(),
    text: input.text,
    resolved: parent.resolved,
    paragraphIndex: parent.paragraphIndex,
    paraId: randomParaId(),
  };
  comments.push(reply);
  return reply;
}

export function setResolved(comments: WordComment[], id: number, resolved: boolean): void {
  const target = comments.find((comment) => comment.id === id);
  if (!target) return;
  for (const comment of comments) {
    if (comment.id === id || comment.parentId === id) comment.resolved = resolved;
  }
}

export function deleteThread(comments: WordComment[], id: number): number[] {
  const removed: number[] = [];
  const root = comments.find((comment) => comment.id === id);
  if (!root) return removed;
  for (let index = comments.length - 1; index >= 0; index--) {
    const comment = comments[index];
    if (comment.id === id || comment.parentId === id) {
      removed.push(comment.id);
      comments.splice(index, 1);
    }
  }
  return removed;
}

export function threadOf(comments: WordComment[]): Array<{ root: WordComment; replies: WordComment[] }> {
  return comments
    .filter((comment) => comment.parentId === null)
    .sort((a, b) => a.paragraphIndex - b.paragraphIndex || a.id - b.id)
    .map((root) => ({
      root,
      replies: comments.filter((comment) => comment.parentId === root.id).sort((a, b) => a.id - b.id),
    }));
}

export function buildCommentsXml(comments: WordComment[]): string {
  const parts = comments.map((comment) => {
    const paragraphs = comment.text.split(/\r?\n/).map((line) => `<w:p w14:paraId="${comment.paraId ?? randomParaId()}"><w:r><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`);
    return `<w:comment w:id="${comment.id}" w:author="${escapeXml(comment.author)}" w:initials="${escapeXml(comment.initials)}" w:date="${escapeXml(comment.date)}">${paragraphs.join('')}</w:comment>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<w:comments xmlns:w="${COMMENTS_NS}" xmlns:w14="${W14_NS}">${parts.join('')}</w:comments>`;
}

export function buildCommentsExtendedXml(comments: WordComment[]): string {
  const parts = comments.filter((comment) => comment.paraId).map((comment) => {
    const parentPara = comment.parentId === null
      ? null
      : comments.find((item) => item.id === comment.parentId)?.paraId;
    const parent = parentPara ? ` w15:paraIdParent="${parentPara}"` : '';
    const done = comment.resolved ? ' w15:done="1"' : '';
    return `<w15:commentEx w15:paraId="${comment.paraId}"${parent}${done}/>`;
  });
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
    + `<w15:commentsEx xmlns:w15="http://schemas.microsoft.com/office/word/2012/wordml">${parts.join('')}</w15:commentsEx>`;
}

/** Insert commentRangeStart/End + reference into the anchored paragraph. */
export function applyCommentAnchor(document: WordDocument, comment: WordComment): void {
  if (comment.parentId !== null) return;
  const block = document.blocks[comment.paragraphIndex];
  if (!block || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return;
  const paragraph = block.paragraph.xmlNode;
  const id = String(comment.id);
  const already = descendants(paragraph, 'w:commentRangeStart').some((node) => attr(node, 'w:id') === id);
  if (already) return;
  const insertAt = paragraph.children.findIndex((child) => child.name !== 'w:pPr');
  const start: XmlNode = { name: 'w:commentRangeStart', attrs: { 'w:id': id }, text: '', children: [] };
  if (insertAt < 0) paragraph.children.push(start);
  else paragraph.children.splice(insertAt, 0, start);
  const end: XmlNode = { name: 'w:commentRangeEnd', attrs: { 'w:id': id }, text: '', children: [] };
  const reference: XmlNode = {
    name: 'w:r', attrs: {}, text: '', children: [
      { name: 'w:commentReference', attrs: { 'w:id': id }, text: '', children: [] },
    ],
  };
  paragraph.children.push(end, reference);
}

/** Remove all anchors/references belonging to a deleted thread. */
export function removeCommentAnchors(document: WordDocument, ids: number[]): void {
  const idSet = new Set(ids.map(String));
  for (const block of document.blocks) {
    if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) continue;
    stripAnchors(block.paragraph.xmlNode, idSet);
  }
}

function stripAnchors(node: XmlNode, ids: Set<string>): void {
  node.children = node.children.filter((child) => {
    if ((child.name === 'w:commentRangeStart' || child.name === 'w:commentRangeEnd' || child.name === 'w:commentReference')) {
      const id = attr(child, 'w:id');
      if (id !== undefined && ids.has(id)) return false;
    }
    if (child.name === 'w:r') {
      const reference = findChild(child, 'w:commentReference');
      const id = attr(reference, 'w:id');
      if (id !== undefined && ids.has(id)) return false;
    }
    stripAnchors(child, ids);
    return true;
  });
}

/** Ensure comments/commentsExtended parts, relationships and content types exist. */
export function buildCommentsParts(comments: WordComment[]): Array<{ name: string; data: string }> {
  return [
    { name: 'word/comments.xml', data: buildCommentsXml(comments) },
    { name: 'word/commentsExtended.xml', data: buildCommentsExtendedXml(comments) },
  ];
}

export function ensureCommentsRelationships(entries: Map<string, Uint8Array>, writer: (name: string, data: string) => void): void {
  const relsBytes = entries.get('word/_rels/document.xml.rels');
  if (relsBytes) {
    let rels = new TextDecoder('utf-8').decode(relsBytes);
    if (!rels.includes('comments.xml')) {
      rels = rels.replace('</Relationships>',
        '<Relationship Id="rIdComments" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>'
        + '</Relationships>');
    }
    if (!rels.includes('commentsExtended.xml')) {
      rels = rels.replace('</Relationships>',
        '<Relationship Id="rIdCommentsExtended" Type="http://schemas.microsoft.com/office/2011/relationships/commentsExtended" Target="commentsExtended.xml"/>'
        + '</Relationships>');
    }
    writer('word/_rels/document.xml.rels', rels);
  } else {
    writer('word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
      + '<Relationship Id="rIdComments" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments" Target="comments.xml"/>'
      + '<Relationship Id="rIdCommentsExtended" Type="http://schemas.microsoft.com/office/2011/relationships/commentsExtended" Target="commentsExtended.xml"/>'
      + '</Relationships>');
  }
  const typesBytes = entries.get('[Content_Types].xml');
  if (typesBytes) {
    let types = new TextDecoder('utf-8').decode(typesBytes);
    if (!types.includes('/word/comments.xml')) {
      types = types.replace('</Types>',
        '<Override PartName="/word/comments.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml"/>'
        + '<Override PartName="/word/commentsExtended.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.commentsExtended+xml"/>'
        + '</Types>');
    }
    writer('[Content_Types].xml', types);
  }
}

export function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function randomParaId(): string {
  return Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0').toUpperCase();
}
