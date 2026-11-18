import { attr, descendants, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import { readZip, type ZipArchive } from '../binary/zip';
import { parseAnimations, parseTransition } from './ppt-effects';
import type { PptDocument, PptShape, PptSlide } from './types';

const EMU_PER_PX = 9525;

export async function parsePptx(buffer: ArrayBuffer | Uint8Array): Promise<PptDocument> {
  const zip = await readZip(buffer);
  const presentationBytes = zip.entries.get('ppt/presentation.xml');
  if (!presentationBytes) throw new Error('OFFICE_PPTX_PARSE_FAILED');
  const presentation = parseXml(new TextDecoder('utf-8').decode(presentationBytes));
  const root = findChild(presentation, 'p:presentation') ?? presentation;
  const rels = parseRelations(zip.entries.get('ppt/_rels/presentation.xml.rels'));
  const sizeNode = findChild(root, 'p:sldSz');
  const width = emuToPx(Number(attr(sizeNode, 'cx') ?? 12192000));
  const height = emuToPx(Number(attr(sizeNode, 'cy') ?? 6858000));
  const slideIds = findChildren(findChild(root, 'p:sldIdLst'), 'p:sldId');
  const slides: PptSlide[] = [];
  const warnings: string[] = [];

  for (const [index, slideId] of slideIds.entries()) {
    const relId = attr(slideId, 'r:id');
    const target = relId ? rels.get(relId) : undefined;
    const path = target ? normalizeTarget(target) : `ppt/slides/slide${index + 1}.xml`;
    const bytes = zip.entries.get(path);
    if (!bytes) {
      warnings.push(`SLIDE_MISSING:${index + 1}`);
      slides.push({ index: index + 1, shapes: [], path });
      continue;
    }
    const slideRels = parseRelations(zip.entries.get(relsPath(path)));
    slides.push(parseSlide(index + 1, bytes, path, zip, slideRels));
  }

  if (slides.length === 0) slides.push({ index: 1, shapes: [] });
  return {
    slides, width, height, warnings, packageEntries: zip.entries,
    presentationRoot: root,
    presentationRelsRaw: zip.entries.get('ppt/_rels/presentation.xml.rels')
      ? new TextDecoder('utf-8').decode(zip.entries.get('ppt/_rels/presentation.xml.rels'))
      : '',
    presentationRels: rels,
    removedParts: new Set(),
  };
}

function parseSlide(index: number, bytes: Uint8Array, path: string, zip: ZipArchive, rels: Map<string, string>): PptSlide {
  const doc = parseXml(new TextDecoder('utf-8').decode(bytes));
  const root = findChild(doc, 'p:sld') ?? doc;
  const tree = findChild(root, 'p:cSld');
  const spTree = findChild(tree, 'p:spTree');
  const shapes: PptShape[] = [];

  for (const node of findChildren(spTree, 'p:sp')) {
    const shape = parseShape(node);
    if (shape) shapes.push(shape);
  }
  for (const node of findChildren(spTree, 'p:pic')) {
    shapes.push(parsePicture(node, rels, path));
  }
  for (const node of findChildren(spTree, 'p:graphicFrame')) {
    const frame = parseGraphicFrame(node, rels, zip, path);
    if (frame) shapes.push(frame);
  }
  const relsPathValue = relsPath(path);
  const notesPath = findRelationshipTarget(zip, relsPathValue, '/notesSlide');
  const commentsPath = findRelationshipTarget(zip, relsPathValue, '/comments');
  const layoutPath = findRelationshipTarget(zip, relsPathValue, '/slideLayout');
  const notes = notesPath ? notesText(zip, notesPath) : undefined;
  const comments = commentsPath ? parseComments(zip, commentsPath) : undefined;
  const backgroundNode = findChild(tree, 'p:bg');
  const background = attr(descendants(backgroundNode, 'a:srgbClr')[0], 'val');
  const layoutName = layoutPath ? slideLayoutName(zip, layoutPath) : undefined;
  return {
    index,
    shapes,
    path,
    xmlRoot: root,
    transition: parseTransition(root),
    animations: parseAnimations(root),
    hidden: attr(root, 'show') === '0',
    notes,
    notesPath: notesPath ?? undefined,
    comments,
    commentsPath: commentsPath ?? undefined,
    background: background ? `#${background.toUpperCase()}` : undefined,
    layoutPath: layoutPath ?? undefined,
    layoutName,
  };
}

function parsePicture(node: XmlNode, rels: Map<string, string>, basePart: string): PptShape {
  const props = findChild(node, 'p:spPr');
  const xfrm = findChild(props, 'a:xfrm');
  const off = findChild(xfrm, 'a:off');
  const ext = findChild(xfrm, 'a:ext');
  const cNvPr = findChild(findChild(node, 'p:nvPicPr'), 'p:cNvPr');
  const video = findChild(findChild(findChild(node, 'p:nvPicPr'), 'p:nvPr'), 'a:videoFile');
  const audio = findChild(findChild(findChild(node, 'p:nvPicPr'), 'p:nvPr'), 'a:audioFile');
  const link = attr(video ?? audio, 'r:link');
  const mediaTarget = link ? rels.get(link) : undefined;
  const kind: PptShape['kind'] = video ? 'video' : audio ? 'audio' : 'image';
  return {
    id: attr(cNvPr, 'id') ?? `pic-${Math.random().toString(36).slice(2)}`,
    name: attr(cNvPr, 'name'),
    text: kind === 'video' ? '[video]' : kind === 'audio' ? '[audio]' : '[image]',
    x: emuToPx(Number(attr(off, 'x') ?? 0)),
    y: emuToPx(Number(attr(off, 'y') ?? 0)),
    width: emuToPx(Number(attr(ext, 'cx') ?? 0)),
    height: emuToPx(Number(attr(ext, 'cy') ?? 0)),
    kind,
    mediaPath: mediaTarget ? resolvePart(basePart, mediaTarget) : undefined,
  };
}

function parseGraphicFrame(node: XmlNode, rels: Map<string, string>, zip: ZipArchive, basePart: string): PptShape | null {
  const xfrm = findChild(node, 'p:xfrm');
  const off = findChild(xfrm, 'a:off');
  const ext = findChild(xfrm, 'a:ext');
  const cNvPr = findChild(findChild(node, 'p:nvGraphicFramePr'), 'p:cNvPr');
  const data = findChild(findChild(node, 'a:graphic'), 'a:graphicData');
  if (!data) return null;
  const uri = attr(data, 'uri') ?? '';
  const base: PptShape = {
    id: attr(cNvPr, 'id') ?? `frame-${Math.random().toString(36).slice(2)}`,
    name: attr(cNvPr, 'name'),
    text: '[graphic]',
    x: emuToPx(Number(attr(off, 'x') ?? 0)),
    y: emuToPx(Number(attr(off, 'y') ?? 0)),
    width: emuToPx(Number(attr(ext, 'cx') ?? 0)),
    height: emuToPx(Number(attr(ext, 'cy') ?? 0)),
  };

  const diagram = findChild(data, 'dgm:relIds');
  if (diagram) {
    const relId = attr(diagram, 'r:dm');
    const target = relId ? rels.get(relId) : undefined;
    const diagramPath = target ? resolvePart(basePart, target) : undefined;
    const diagramBytes = diagramPath ? zip.entries.get(diagramPath) : undefined;
    const diagramRoot = diagramBytes
      ? parseXml(new TextDecoder('utf-8').decode(diagramBytes))
      : undefined;
    const smartArtNodes = diagramRoot
      ? descendants(diagramRoot, 'a:t').map((node) => ({ text: node.text, node }))
      : [];
    const texts = unique(smartArtNodes.map((item) => item.text).filter(Boolean));
    return {
      ...base,
      kind: 'smartart',
      text: texts.length ? texts.join(' · ') : '[SmartArt]',
      diagramPath,
      diagramRoot,
      smartArtNodes,
    };
  }

  const chart = findChild(data, 'c:chart');
  if (chart) {
    const relId = attr(chart, 'r:id');
    const target = relId ? rels.get(relId) : undefined;
    const chartBytes = target ? zip.entries.get(resolvePart(basePart, target)) : undefined;
    const titles = chartBytes
      ? descendants(parseXml(new TextDecoder('utf-8').decode(chartBytes)), 'a:t').map((item) => item.text).filter(Boolean)
      : [];
    return {
      ...base,
      kind: 'chart',
      text: titles.length ? `[chart] ${titles.slice(0, 3).join(' · ')}` : '[chart]',
    };
  }

  const table = findChild(data, 'a:tbl');
  if (table) {
    const rows = findChildren(table, 'a:tr').map((row) =>
      findChildren(row, 'a:tc').map((cell) => textOf(cell)).filter(Boolean).join(' | '));
    return { ...base, kind: 'table', text: rows.join('\n') || '[table]' };
  }
  return null;
}

export function mediaMimeType(path: string): string {
  const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    m4v: 'video/mp4',
    webm: 'video/webm',
    ogv: 'video/ogg',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    wmv: 'video/x-ms-wmv',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    wma: 'audio/x-ms-wma',
    aac: 'audio/aac',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
  };
  return map[extension] ?? 'application/octet-stream';
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function relsPath(partPath: string): string {
  const slash = partPath.lastIndexOf('/');
  const directory = partPath.slice(0, slash);
  const file = partPath.slice(slash + 1);
  return `${directory}/_rels/${file}.rels`;
}

function findRelationshipTarget(zip: ZipArchive, relsPathValue: string, typeSuffix: string): string | null {
  const bytes = zip.entries.get(relsPathValue);
  if (!bytes) return null;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const base = relsPathValue.replace('/_rels/', '/').replace(/\.rels$/, '');
  for (const relationship of descendants(root, 'Relationship')) {
    if (!(attr(relationship, 'Type') ?? '').endsWith(typeSuffix)) continue;
    const target = attr(relationship, 'Target');
    if (target) return resolvePart(base, target);
  }
  return null;
}

function notesText(zip: ZipArchive, path: string): string | undefined {
  const bytes = zip.entries.get(path);
  if (!bytes) return undefined;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  return descendants(root, 'a:t').map((node) => node.text).join('').trim();
}

function parseComments(zip: ZipArchive, path: string): PptSlide['comments'] {
  const bytes = zip.entries.get(path);
  if (!bytes) return [];
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const authorBytes = zip.entries.get('ppt/commentAuthors.xml');
  const authors = new Map<string, string>();
  if (authorBytes) {
    const authorRoot = parseXml(new TextDecoder('utf-8').decode(authorBytes));
    for (const author of descendants(authorRoot, 'p:cmAuthor')) {
      const id = attr(author, 'id');
      const name = attr(author, 'name');
      if (id !== undefined && name) authors.set(id, name);
    }
  }
  return descendants(root, 'p:cm').map((node) => ({
    id: Number(attr(node, 'idx') ?? 0),
    author: authors.get(attr(node, 'authorId') ?? '') ?? 'Author',
    text: textOf(findChild(node, 'p:text')),
    date: attr(node, 'dt'),
  })).filter((comment) => comment.text);
}

function slideLayoutName(zip: ZipArchive, path: string): string | undefined {
  const bytes = zip.entries.get(path);
  if (!bytes) return undefined;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const layout = findChild(root, 'p:sldLayout') ?? root;
  const name = attr(findChild(layout, 'p:cSld'), 'name');
  if (name) return name;
  return path.split('/').pop()?.replace(/\.xml$/, '');
}

function parseShape(node: XmlNode): PptShape | null {
  const spPr = findChild(node, 'p:spPr');
  const xfrm = findChild(spPr, 'a:xfrm');
  const off = findChild(xfrm, 'a:off');
  const ext = findChild(xfrm, 'a:ext');
  const cNvPr = findChild(findChild(node, 'p:nvSpPr'), 'p:cNvPr');
  const txBody = findChild(node, 'p:txBody');
  const paragraphNodes = findChildren(txBody, 'a:p');
  const paragraphs = paragraphNodes.map((paragraph) => textOf(paragraph)).filter((text) => text.length > 0);
  const text = paragraphs.join('\n');
  const textNode = paragraphNodes.length > 0 ? descendants(paragraphNodes[0], 'a:t')[0] ?? null : null;

  const firstRun = findChild(findChild(txBody, 'a:p'), 'a:r');
  const rPr = findChild(firstRun, 'a:rPr');
  const size = attr(rPr, 'sz');
  const solid = findChild(rPr, 'a:solidFill');
  const color = attr(findChild(solid, 'a:srgbClr'), 'val');

  if (!text && !off && !ext) return null;
  return {
    id: attr(cNvPr, 'id') ?? `shape-${Math.random().toString(36).slice(2)}`,
    name: attr(cNvPr, 'name'),
    text,
    x: emuToPx(Number(attr(off, 'x') ?? 0)),
    y: emuToPx(Number(attr(off, 'y') ?? 0)),
    width: emuToPx(Number(attr(ext, 'cx') ?? 0)),
    height: emuToPx(Number(attr(ext, 'cy') ?? 0)),
    fontSizePt: size ? Number(size) / 100 : undefined,
    color: color ? `#${color}` : undefined,
    bold: attr(rPr, 'b') === '1',
    textNode: textNode ?? undefined,
  };
}

function parseRelations(bytes: Uint8Array | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!bytes) return map;
  const doc = parseXml(new TextDecoder('utf-8').decode(bytes));
  for (const rel of descendants(doc, 'Relationship')) {
    const id = attr(rel, 'Id');
    const target = attr(rel, 'Target');
    if (id && target) map.set(id, target);
  }
  return map;
}

function normalizeTarget(target: string): string {
  const clean = target.replace(/^\.\//, '');
  if (clean.startsWith('/')) return clean.slice(1);
  return clean.startsWith('ppt/') ? clean : `ppt/${clean}`;
}

function resolvePart(basePart: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  const baseDir = basePart.slice(0, basePart.lastIndexOf('/'));
  const stack: string[] = [];
  for (const segment of `${baseDir}/${target}`.split('/')) {
    if (!segment || segment === '.') continue;
    if (segment === '..') stack.pop();
    else stack.push(segment);
  }
  return stack.join('/');
}

function emuToPx(value: number): number {
  return Math.round(value / EMU_PER_PX);
}
