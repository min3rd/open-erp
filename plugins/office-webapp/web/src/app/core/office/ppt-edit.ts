import { attr, descendants, findChild, findChildren, parseXml, type XmlNode } from '../binary/xml';
import type { PptComment, PptDocument, PptSlide } from './types';

const EMU_PER_PX = 9525;
const NOTES_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml';
const COMMENTS_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.comments+xml';
const AUTHORS_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.commentAuthors+xml';
const REL_PREFIX = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';

export function addSlide(doc: PptDocument, duplicateIndex?: number): PptSlide {
  if (!doc.presentationRoot) throw new Error('OFFICE_PPTX_SAVE_FAILED');
  const source = duplicateIndex === undefined ? null : doc.slides[duplicateIndex];
  const number = nextPartNumber(doc, 'ppt/slides/slide');
  const path = `ppt/slides/slide${number}.xml`;
  const root = source?.xmlRoot ? cloneSlideRoot(source) : blankSlide();
  const shapes = source ? cloneShapes(source, root) : [];
  const layoutPath = source?.layoutPath ?? doc.slides.find((slide) => slide.layoutPath)?.layoutPath;
  const slide: PptSlide = { index: doc.slides.length + 1, shapes, path, xmlRoot: root, layoutPath };
  if (layoutPath) {
    const relPath = slideRelsPath(path);
    addRelationship(doc, relPath, 'rIdLayout', `${REL_PREFIX}/slideLayout`, relativePath(path, layoutPath));
  }
  const relId = nextPresentationRelId(doc);
  addPresentationRelationship(doc, relId, `${REL_PREFIX}/slide`, relativePath('ppt/presentation.xml', path));
  addSlideId(doc, relId);
  doc.slides.push(slide);
  reindex(doc);
  return slide;
}

export function deleteSlide(doc: PptDocument, index: number): boolean {
  const slide = doc.slides[index];
  if (!slide) return false;
  const relId = presentationRelId(doc, slide.path);
  if (relId) {
    removeSlideId(doc, relId);
    removePresentationRelationship(doc, relId);
  }
  if (slide.path) {
    doc.removedParts ??= new Set();
    doc.removedParts.add(slide.path);
    doc.removedParts.add(slideRelsPath(slide.path));
  }
  doc.slides.splice(index, 1);
  if (!doc.slides.length) doc.slides.push(blankSlideModel(doc));
  reindex(doc);
  return true;
}

export function moveSlide(doc: PptDocument, from: number, to: number): boolean {
  if (from < 0 || from >= doc.slides.length || to < 0 || to >= doc.slides.length || from === to) return false;
  const [slide] = doc.slides.splice(from, 1);
  doc.slides.splice(to, 0, slide);
  reindex(doc);
  reorderSlideIds(doc);
  return true;
}

export function toggleSlideHidden(doc: PptDocument, index: number): boolean {
  const slide = doc.slides[index];
  if (!slide?.xmlRoot) return false;
  slide.hidden = !slide.hidden;
  if (slide.hidden) slide.xmlRoot.attrs['show'] = '0';
  else delete slide.xmlRoot.attrs['show'];
  return true;
}

export function setSlideSize(doc: PptDocument, widthPx: number, heightPx: number): void {
  const root = doc.presentationRoot;
  const sizeNode = root ? findChild(root, 'p:sldSz') : null;
  if (!sizeNode) return;
  const width = Math.round(widthPx);
  const height = Math.round(heightPx);
  sizeNode.attrs['cx'] = String(width * EMU_PER_PX);
  sizeNode.attrs['cy'] = String(height * EMU_PER_PX);
  doc.width = width;
  doc.height = height;
}

export function setSlideBackground(doc: PptDocument, index: number, color: string | null): boolean {
  const slide = doc.slides[index];
  const root = slide?.xmlRoot;
  const cSld = root ? findChild(root, 'p:cSld') : null;
  if (!cSld) return false;
  cSld.children = cSld.children.filter((child) => child.name !== 'p:bg');
  if (color) {
    cSld.children.unshift({
      name: 'p:bg', attrs: {}, text: '', children: [{
        name: 'p:bgPr', attrs: {}, text: '', children: [
          { name: 'a:solidFill', attrs: {}, text: '', children: [
            { name: 'a:srgbClr', attrs: { val: color.replace('#', '').toUpperCase() }, text: '', children: [] },
          ] },
          { name: 'a:effectLst', attrs: {}, text: '', children: [] },
        ],
      }],
    });
    slide.background = color.startsWith('#') ? color.toUpperCase() : `#${color.toUpperCase()}`;
  } else {
    delete slide.background;
  }
  return true;
}

export function setSlideNotes(doc: PptDocument, index: number, text: string): boolean {
  const slide = doc.slides[index];
  if (!slide?.path) return false;
  const entries = doc.packageEntries ?? new Map<string, Uint8Array>();
  doc.packageEntries = entries;
  if (!slide.notesPath) {
    const number = nextPartNumber(doc, 'ppt/notesSlides/notesSlide');
    slide.notesPath = `ppt/notesSlides/notesSlide${number}.xml`;
    addRelationship(doc, slideRelsPath(slide.path), 'rIdNotes', `${REL_PREFIX}/notesSlide`,
      relativePath(slide.path, slide.notesPath));
    ensureOverride(entries, `/${slide.notesPath}`, NOTES_TYPE);
  }
  slide.notes = text;
  entries.set(slide.notesPath, new TextEncoder().encode(notesXml(text)));
  return true;
}

export function addSlideComment(doc: PptDocument, index: number, text: string, author: string, date: string): boolean {
  const slide = doc.slides[index];
  if (!slide?.path || !text.trim()) return false;
  const entries = doc.packageEntries ?? new Map<string, Uint8Array>();
  doc.packageEntries = entries;
  if (!slide.commentsPath) {
    const number = nextPartNumber(doc, 'ppt/comments/comment');
    slide.commentsPath = `ppt/comments/comment${number}.xml`;
    addRelationship(doc, slideRelsPath(slide.path), 'rIdComments', `${REL_PREFIX}/comments`,
      relativePath(slide.path, slide.commentsPath));
    ensureOverride(entries, `/${slide.commentsPath}`, COMMENTS_TYPE);
  }
  const comments = slide.comments ?? [];
  const authorId = ensureAuthor(doc, author);
  const comment: PptComment = {
    id: (comments.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1,
    author, text, date,
  };
  comments.push(comment);
  slide.comments = comments;
  entries.set(slide.commentsPath, new TextEncoder().encode(commentsXml(comments, authorId)));
  return true;
}

export function deleteSlideComment(doc: PptDocument, index: number, commentId: number): boolean {
  const slide = doc.slides[index];
  if (!slide?.commentsPath || !slide.comments) return false;
  const comments = slide.comments.filter((comment) => comment.id !== commentId);
  slide.comments = comments;
  const authorId = ensureAuthor(doc, 'Author');
  doc.packageEntries?.set(slide.commentsPath, new TextEncoder().encode(commentsXml(comments, authorId)));
  return true;
}

function blankSlide(): XmlNode {
  return {
    name: 'p:sld',
    attrs: {
      'xmlns:p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    },
    text: '', children: [{
      name: 'p:cSld', attrs: {}, text: '', children: [{
        name: 'p:spTree', attrs: {}, text: '', children: [
          { name: 'p:nvGrpSpPr', attrs: {}, text: '', children: [
            { name: 'p:cNvPr', attrs: { id: '1', name: '' }, text: '', children: [] },
            { name: 'p:cNvGrpSpPr', attrs: {}, text: '', children: [] },
            { name: 'p:nvPr', attrs: {}, text: '', children: [] },
          ] },
          { name: 'p:grpSpPr', attrs: {}, text: '', children: [
            { name: 'a:xfrm', attrs: {}, text: '', children: [
              { name: 'a:off', attrs: { x: '0', y: '0' }, text: '', children: [] },
              { name: 'a:ext', attrs: { cx: '0', cy: '0' }, text: '', children: [] },
              { name: 'a:chOff', attrs: { x: '0', y: '0' }, text: '', children: [] },
              { name: 'a:chExt', attrs: { cx: '0', cy: '0' }, text: '', children: [] },
            ] },
          ] },
        ],
      }],
    }, {
      name: 'p:clrMapOvr', attrs: {}, text: '', children: [{ name: 'a:masterClrMapping', attrs: {}, text: '', children: [] }],
    }],
  };
}

function blankSlideModel(doc: PptDocument): PptSlide {
  const number = nextPartNumber(doc, 'ppt/slides/slide');
  const path = `ppt/slides/slide${number}.xml`;
  return { index: 1, shapes: [], path, xmlRoot: blankSlide() };
}

function cloneSlideRoot(slide: PptSlide): XmlNode {
  return slide.xmlRoot ? cloneNode(slide.xmlRoot) : blankSlide();
}

function cloneNode(node: XmlNode): XmlNode {
  return { name: node.name, attrs: { ...node.attrs }, text: node.text, children: node.children.map(cloneNode) };
}

function cloneShapes(source: PptSlide, clonedRoot: XmlNode): PptSlide['shapes'] {
  const originalTexts = source.xmlRoot ? descendants(source.xmlRoot, 'a:t') : [];
  const clonedTexts = descendants(clonedRoot, 'a:t');
  return source.shapes.map((shape) => {
    const copy: PptSlide['shapes'][number] = JSON.parse(JSON.stringify(shape));
    if (shape.textNode) {
      const index = originalTexts.indexOf(shape.textNode);
      if (index >= 0 && clonedTexts[index]) copy.textNode = clonedTexts[index];
    }
    if (shape.diagramRoot) copy.diagramRoot = cloneNode(shape.diagramRoot);
    return copy;
  });
}

function notesXml(text: string): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
    + '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>'
    + '<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
    + '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes Placeholder"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
    + '<p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/><a:lstStyle/>'
    + `<a:p><a:r><a:t>${escapeXml(text)}</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:notes>`;
}

function commentsXml(comments: PptComment[], authorId: number): string {
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<p:cmLst xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
    + comments.map((comment) => `<p:cm authorId="${authorId}" dt="${comment.date ?? new Date().toISOString()}" idx="${comment.id}">`
      + `<p:pos x="10" y="10"/><p:text>${escapeXml(comment.text)}</p:text></p:cm>`).join('')
    + '</p:cmLst>';
}

function ensureAuthor(doc: PptDocument, author: string): number {
  const entries = doc.packageEntries;
  if (!entries) return 0;
  const path = 'ppt/commentAuthors.xml';
  const existing = entries.get(path);
  const root = existing ? parseExisting(existing) : null;
  const authors = root ? findChildren(findChild(root, 'p:cmAuthorLst'), 'p:cmAuthor') : [];
  const found = authors.find((node) => attr(node, 'name') === author);
  if (found) return Number(attr(found, 'id') ?? 0);
  const id = authors.length;
  const list = root ? findChild(root, 'p:cmAuthorLst') : null;
  const node: XmlNode = {
    name: 'p:cmAuthor',
    attrs: { id: String(id), name: author, initials: (author[0] ?? 'A').toUpperCase(), lastIdx: '1', clrIdx: '0' },
    text: '', children: [],
  };
  if (list) list.children.push(node);
  else {
    entries.set(path, new TextEncoder().encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<p:cmAuthorLst xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
      + `<p:cmAuthor id="${id}" name="${escapeXml(author)}" initials="${(author[0] ?? 'A').toUpperCase()}" lastIdx="1" clrIdx="0"/>`
      + '</p:cmAuthorLst>'));
    ensureOverride(entries, '/ppt/commentAuthors.xml', AUTHORS_TYPE);
    addPresentationRelationship(doc, 'rIdCommentAuthors', `${REL_PREFIX}/commentAuthors`, 'commentAuthors.xml');
    return id;
  }
  entries.set(path, new TextEncoder().encode(serializeNode(root!)));
  return id;
}

function parseExisting(bytes: Uint8Array): XmlNode {
  return parseXml(new TextDecoder('utf-8').decode(bytes));
}

function serializeNode(node: XmlNode): string {
  if (node.name === '#document') return node.children.map(serializeNode).join('');
  const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${escapeXml(value)}"`).join('');
  return `<${node.name}${attrs}>${escapeXml(node.text)}${node.children.map(serializeNode).join('')}</${node.name}>`;
}

function addSlideId(doc: PptDocument, relId: string): void {
  const root = doc.presentationRoot;
  const list = root ? findChild(root, 'p:sldIdLst') : null;
  if (!list) return;
  const id = list.children.reduce((max, child) => Math.max(max, Number(attr(child, 'id') ?? 0)), 255) + 1;
  list.children.push({ name: 'p:sldId', attrs: { id: String(id), 'r:id': relId }, text: '', children: [] });
}

function removeSlideId(doc: PptDocument, relId: string): void {
  const list = doc.presentationRoot ? findChild(doc.presentationRoot, 'p:sldIdLst') : null;
  if (!list) return;
  list.children = list.children.filter((child) => attr(child, 'r:id') !== relId);
}

function reorderSlideIds(doc: PptDocument): void {
  const list = doc.presentationRoot ? findChild(doc.presentationRoot, 'p:sldIdLst') : null;
  if (!list) return;
  const order = doc.slides.map((slide) => presentationRelId(doc, slide.path)).filter(Boolean) as string[];
  list.children.sort((a, b) => order.indexOf(attr(a, 'r:id') ?? '') - order.indexOf(attr(b, 'r:id') ?? ''));
}

function addPresentationRelationship(doc: PptDocument, id: string, type: string, target: string): void {
  let rels = doc.presentationRelsRaw ?? '';
  if (!rels) {
    rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  }
  if (!rels.includes(`Id="${id}"`)) {
    rels = rels.replace('</Relationships>', `<Relationship Id="${id}" Type="${type}" Target="${target}"/></Relationships>`);
  }
  doc.presentationRelsRaw = rels;
  doc.packageEntries?.set('ppt/_rels/presentation.xml.rels', new TextEncoder().encode(rels));
}

function removePresentationRelationship(doc: PptDocument, id: string): void {
  if (!doc.presentationRelsRaw) return;
  doc.presentationRelsRaw = doc.presentationRelsRaw.replace(new RegExp(`<Relationship[^>]*Id="${id}"[^>]*/>`), '');
  doc.packageEntries?.set('ppt/_rels/presentation.xml.rels', new TextEncoder().encode(doc.presentationRelsRaw));
}

function presentationRelId(doc: PptDocument, path: string | undefined): string | null {
  if (!path) return null;
  const rels = doc.presentationRelsRaw ?? '';
  const target = relativePath('ppt/presentation.xml', path);
  const match = new RegExp(`<Relationship[^>]*Id="([^"]+)"[^>]*Target="${escapeRegExp(target)}"`).exec(rels)
    ?? new RegExp(`<Relationship[^>]*Target="${escapeRegExp(target)}"[^>]*Id="([^"]+)"`).exec(rels);
  return match ? match[1] : null;
}

function nextPresentationRelId(doc: PptDocument): string {
  const rels = doc.presentationRelsRaw ?? '';
  let index = 1;
  while (rels.includes(`Id="rIdSlide${index}"`)) index++;
  return `rIdSlide${index}`;
}

function addRelationship(doc: PptDocument, relsPath: string, id: string, type: string, target: string): void {
  const entries = doc.packageEntries;
  if (!entries) return;
  let rels = entries.get(relsPath) ? new TextDecoder('utf-8').decode(entries.get(relsPath)) : '';
  if (!rels) {
    rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  }
  if (!rels.includes(`Id="${id}"`)) {
    rels = rels.replace('</Relationships>', `<Relationship Id="${id}" Type="${type}" Target="${target}"/></Relationships>`);
  }
  entries.set(relsPath, new TextEncoder().encode(rels));
}

function ensureOverride(entries: Map<string, Uint8Array>, partName: string, type: string): void {
  const path = '[Content_Types].xml';
  let types = entries.get(path) ? new TextDecoder('utf-8').decode(entries.get(path)) : '';
  if (!types) {
    types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>';
  }
  if (!types.includes(`PartName="${partName}"`)) {
    types = types.replace('</Types>', `<Override PartName="${partName}" ContentType="${type}"/></Types>`);
  }
  entries.set(path, new TextEncoder().encode(types));
}

function nextPartNumber(doc: PptDocument, prefix: string): number {
  let index = 1;
  const entries = doc.packageEntries;
  while (entries?.has(`${prefix}${index}.xml`)
    || doc.slides.some((slide) => slide.path === `${prefix}${index}.xml`)) index++;
  return index;
}

function slideRelsPath(path: string): string {
  const slash = path.lastIndexOf('/');
  return `${path.slice(0, slash)}/_rels/${path.slice(slash + 1)}.rels`;
}

function relativePath(basePart: string, target: string): string {
  const base = basePart.slice(0, basePart.lastIndexOf('/')).split('/');
  const parts = target.split('/');
  let common = 0;
  while (common < base.length && common < parts.length && base[common] === parts[common]) common++;
  return `${'../'.repeat(base.length - common)}${parts.slice(common).join('/')}`;
}

function reindex(doc: PptDocument): void {
  doc.slides.forEach((slide, index) => { slide.index = index + 1; });
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
