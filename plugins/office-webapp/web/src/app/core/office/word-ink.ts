import { attr, descendants, findChild, parseXml, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';

export interface InkPoint { x: number; y: number; pressure?: number; }

export interface InkStroke {
  id: string;
  color: string;
  width: number;
  points: InkPoint[];
  paragraphIndex?: number;
  page?: number;
  createdAt?: string;
}

const INKML_NS = 'http://www.w3.org/2003/InkML';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml';
const CONTENT_TYPE = 'application/inkml+xml';
const PART_PATH = 'word/ink/ink1.xml';
const LEGACY_PART = 'customXml/ink.xml';
/** InkML channel resolution: values per inch (0.001 in per unit). */
const RESOLUTION = 1000;
const PX_PER_INCH = 96;
/**
 * Word maps the InkML canvas through its own ~1.13x/0.94x scale and per-axis
 * offsets (measured from four calibration strokes exported through Word COM).
 * Values written to the part are the inverse of that mapping so a stroke lands
 * on its drawn page rectangle in Word; parsing applies it forward again.
 */
const WORD_INK_X_SCALE = 1.132;
const WORD_INK_X_OFFSET = 0.003;
const WORD_INK_Y_SCALE = 1.238;
const WORD_INK_Y_OFFSET = 0.2216;

/**
 * Parse the ink content part. New documents use W3C InkML
 * (http://www.w3.org/2003/InkML) referenced from w:contentPart, matching
 * [MS-ODRAWXML] 2.1.4; the earlier customXml/ink.xml stroke schema is still read.
 */
export function parseInkStrokes(entries: Map<string, Uint8Array>, document: WordDocument): InkStroke[] {
  const path = inkPath(entries);
  if (!path) return [];
  const bytes = entries.get(path);
  if (!bytes) return [];
  const parsed = parseXml(new TextDecoder('utf-8').decode(bytes));
  document.inkPath = path;
  const pageWidthIn = (document.pageSize?.width ?? 816) / PX_PER_INCH;
  const pageHeightIn = (document.pageSize?.height ?? 1056) / PX_PER_INCH;

  const inkml = findChild(parsed, 'inkml:ink');
  if (inkml) return parseInkml(inkml, pageWidthIn, pageHeightIn);

  const legacy = findChild(parsed, 'ink:ink') ?? findChild(parsed, 'ink:strokes');
  if (!legacy) return [];
  return descendants(legacy, 'ink:stroke').map((node) => ({
    id: attr(node, 'id') ?? newStrokeId(),
    color: attr(node, 'color') ?? '#dc2626',
    width: Number(attr(node, 'width') ?? 2),
    createdAt: attr(node, 'createdAt'),
    page: Number(attr(node, 'page') ?? 0) || 0,
    points: descendants(node, 'ink:point').map((point) => ({
      x: Number(attr(point, 'x') ?? 0),
      y: Number(attr(point, 'y') ?? 0),
      pressure: attr(point, 'pressure') !== undefined ? Number(attr(point, 'pressure')) : undefined,
    })),
  })).filter((stroke) => stroke.points.length > 1);
}

function parseInkml(root: XmlNode, pageWidthIn: number, pageHeightIn: number): InkStroke[] {
  const pageW = pageWidthIn > 0 ? pageWidthIn : 8.5;
  const pageH = pageHeightIn > 0 ? pageHeightIn : 11;
  let resX = RESOLUTION;
  let resY = RESOLUTION;
  let forceScale = RESOLUTION;
  const channels: string[] = [];
  for (const format of descendants(root, 'inkml:traceFormat')) {
    for (const channel of descendants(format, 'inkml:channel')) {
      const name = attr(channel, 'name') ?? '';
      if (name) channels.push(name);
      if (name === 'F') {
        const max = Number(attr(channel, 'max') ?? 0);
        forceScale = max > 0 ? max : RESOLUTION;
      }
    }
  }
  for (const property of descendants(root, 'inkml:channelProperty')) {
    if ((attr(property, 'name') ?? '') !== 'resolution') continue;
    const value = Number(attr(property, 'value') ?? 0);
    if (!(value > 0)) continue;
    if (attr(property, 'channel') === 'X') resX = value;
    if (attr(property, 'channel') === 'Y') resY = value;
  }
  const order = channels.length ? channels : ['X', 'Y', 'F'];
  const calibrated = attr(root, 'oerp:calibrated') === 'word';
  const brushes = new Map<string, { color: string; widthPx: number }>();
  for (const brush of descendants(root, 'inkml:brush')) {
    const id = attr(brush, 'xml:id') ?? attr(brush, 'id');
    if (!id) continue;
    let color = '#dc2626';
    let widthPx = 2;
    for (const property of descendants(brush, 'inkml:brushProperty')) {
      const name = attr(property, 'name');
      const value = attr(property, 'value') ?? '';
      if (name === 'color' && value) color = value;
      if (name === 'width') widthPx = Math.max(0.5, (Number(value) || 0) * (PX_PER_INCH / 2.54));
    }
    brushes.set(id, { color, widthPx });
  }

  const strokes: InkStroke[] = [];
  const pages = new Map<XmlNode, number>();
  for (const group of descendants(root, 'inkml:traceGroup')) {
    const match = /^page-(\d+)$/.exec(attr(group, 'xml:id') ?? '');
    if (!match) continue;
    for (const trace of descendants(group, 'inkml:trace')) pages.set(trace, Number(match[1]));
  }
  for (const trace of descendants(root, 'inkml:trace')) {
    const id = attr(trace, 'xml:id') ?? attr(trace, 'id') ?? newStrokeId();
    if (id === 'ink-canvas') continue;
    const brushRef = (attr(trace, 'brushRef') ?? attr(trace, 'brush') ?? '').replace(/^#/, '');
    const brush = brushes.get(brushRef);
    const page = pages.get(trace) ?? 0;
    const tuples = decodeTrace(trace.text, order.length);
    const points: InkPoint[] = [];
    for (const tuple of tuples) {
      const x = (tuple[order.indexOf('X')] ?? 0) / resX;
      const y = (tuple[order.indexOf('Y')] ?? 0) / resY;
      const fIndex = order.indexOf('F');
      const force = fIndex >= 0 ? (tuple[fIndex] ?? forceScale / 2) : forceScale / 2;
      points.push({
        x: Math.max(0, Math.min(1, calibrated ? (x / pageW) * WORD_INK_X_SCALE + WORD_INK_X_OFFSET : x / pageW)),
        y: Math.max(0, Math.min(1, calibrated ? (y / pageH) * WORD_INK_Y_SCALE + WORD_INK_Y_OFFSET : y / pageH)),
        pressure: Math.max(0, Math.min(1, force / forceScale)),
      });
    }
    if (points.length > 1) {
      strokes.push({
        id,
        color: brush?.color ?? '#dc2626',
        width: brush?.widthPx ?? 2,
        page,
        points,
      });
    }
  }
  return strokes;
}

/**
 * InkML traces store tuples separated by commas; within a tuple channel values
 * are whitespace separated and may be compressed with ' (first difference) or
 * " (second difference) prefixes.
 */
function decodeTrace(text: string, channelCount: number): number[][] {
  if (!channelCount) return [];
  const tuples: number[][] = [];
  const state = Array.from({ length: channelCount }, () => ({ value: 0, delta: 0 }));
  for (const rawTuple of text.split(',')) {
    const tokens = rawTuple.match(/["']?-?\d+(?:\.\d+)?/g) ?? [];
    if (!tokens.length) continue;
    const values: number[] = [];
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index];
      const channel = index % channelCount;
      const current = state[channel];
      const prefix = token[0] === '"' || token[0] === "'" ? token[0] : '';
      const number = Number(prefix ? token.slice(1) : token);
      let value = number;
      if (prefix === "'") {
        value = current.value + number;
        current.delta = number;
      } else if (prefix === '"') {
        current.delta += number;
        value = current.value + current.delta;
      } else {
        current.delta = 0;
      }
      current.value = value;
      values.push(value);
    }
    if (values.length) tuples.push(values);
  }
  return tuples;
}

export function addInkStroke(document: WordDocument, strokes: InkStroke[], input: Omit<InkStroke, 'id'>): InkStroke {
  ensureInkPart(document);
  const stroke: InkStroke = {
    ...input,
    id: newStrokeId(),
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
  strokes.push(stroke);
  document.inkStrokes = strokes;
  return stroke;
}

export function removeInkStroke(document: WordDocument, strokes: InkStroke[], id: string): void {
  const index = strokes.findIndex((stroke) => stroke.id === id);
  if (index >= 0) strokes.splice(index, 1);
  document.inkStrokes = strokes;
}

export function clearInk(document: WordDocument, strokes: InkStroke[]): void {
  strokes.splice(0, strokes.length);
  document.inkStrokes = strokes;
}

/**
 * Build word/ink/ink1.xml as W3C InkML: definitions (context, traceFormat X/Y/F,
 * brushes) plus one traceGroup per page holding absolute X Y F triplets.
 */
export function inkPart(document: WordDocument): { name: string; data: string } | null {
  const strokes = document.inkStrokes ?? [];
  const path = document.inkPath;
  if (!path || (!strokes.length && !document.packageEntries?.has(path))) return null;
  if (path === LEGACY_PART) addContentType(document.packageEntries, '/customXml/ink.xml', CONTENT_TYPE);
  return { name: path, data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${serialize(buildInkml(document, strokes))}` };
}

function buildInkml(document: WordDocument, strokes: InkStroke[]): XmlNode {
  const pageWidthIn = (document.pageSize?.width ?? 816) / PX_PER_INCH;
  const pageHeightIn = (document.pageSize?.height ?? 1056) / PX_PER_INCH;
  const brushes = new Map<string, { id: string; color: string; widthCm: number }>();
  const brushId = (stroke: InkStroke): string => {
    const key = `${stroke.color}|${stroke.width}`;
    const existing = brushes.get(key);
    if (existing) return existing.id;
    const id = `br${brushes.size}`;
    brushes.set(key, {
      id,
      color: stroke.color,
      widthCm: Math.round(stroke.width * (2.54 / PX_PER_INCH) * 100000) / 100000,
    });
    return id;
  };
  for (const stroke of strokes) brushId(stroke);

  const byPage = new Map<number, InkStroke[]>();
  for (const stroke of strokes) {
    const page = stroke.page ?? 0;
    byPage.set(page, [...(byPage.get(page) ?? []), stroke]);
  }

  const definitions: XmlNode = {
    name: 'inkml:definitions', attrs: {}, text: '', children: [
      {
        name: 'inkml:context', attrs: { 'xml:id': 'ctx0' }, text: '', children: [
          {
            name: 'inkml:inkSource', attrs: { 'xml:id': 'inkSrc0' }, text: '', children: [
              {
                name: 'inkml:traceFormat', attrs: {}, text: '', children: [
                  channelNode('X', 'in', 32767),
                  channelNode('Y', 'in', 32767),
                  channelNode('F', 'dev', RESOLUTION),
                ],
              },
              {
                name: 'inkml:channelProperties', attrs: {}, text: '', children: [
                  propertyNode('X', 'resolution', String(RESOLUTION), '1/in'),
                  propertyNode('Y', 'resolution', String(RESOLUTION), '1/in'),
                  propertyNode('F', 'resolution', '1', '1/dev'),
                ],
              },
            ],
          },
          { name: 'inkml:timestamp', attrs: { 'xml:id': 'ts0', timeString: new Date().toISOString() }, text: '', children: [] },
        ],
      },
      ...[...brushes.values()].map((brush): XmlNode => ({
        name: 'inkml:brush', attrs: { 'xml:id': brush.id }, text: '', children: [
          brushPropertyNode('width', brush.widthCm.toFixed(5), 'cm'),
          brushPropertyNode('height', brush.widthCm.toFixed(5), 'cm'),
          brushPropertyNode('color', brush.color, undefined),
          brushPropertyNode('fitToCurve', '1', undefined),
        ],
      })),
      {
        name: 'inkml:brush', attrs: { 'xml:id': 'brCanvas' }, text: '', children: [
          brushPropertyNode('width', '0.001', 'cm'),
          brushPropertyNode('height', '0.001', 'cm'),
          brushPropertyNode('color', '#FFFFFF', undefined),
          brushPropertyNode('transparency', '255', undefined),
          brushPropertyNode('fitToCurve', '0', undefined),
        ],
      },
    ],
  };

  const canvasTrace: XmlNode = {
    name: 'inkml:trace',
    attrs: { 'xml:id': 'ink-canvas', contextRef: '#ctx0', brushRef: '#brCanvas' },
    text: [
      `0 0 ${Math.round(0.5 * RESOLUTION)}`,
      `${Math.round(pageWidthIn * RESOLUTION)} ${Math.round(pageHeightIn * RESOLUTION)} ${Math.round(0.5 * RESOLUTION)}`,
    ].join(','),
    children: [],
  };

  const groups: XmlNode[] = [...byPage.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([page, pageStrokes], index) => ({
      name: 'inkml:traceGroup',
      attrs: { 'xml:id': `page-${page}` },
      text: '',
      children: [
        ...(index === 0 ? [canvasTrace] : []),
        ...pageStrokes.map((stroke): XmlNode => ({
          name: 'inkml:trace',
          attrs: { 'xml:id': stroke.id, contextRef: '#ctx0', brushRef: `#${brushId(stroke)}` },
          text: stroke.points.map((point) => {
            const nx = Math.max(0, Math.min(1, (point.x - WORD_INK_X_OFFSET) / WORD_INK_X_SCALE));
            const ny = Math.max(0, Math.min(1, (point.y - WORD_INK_Y_OFFSET) / WORD_INK_Y_SCALE));
            const x = Math.round(nx * pageWidthIn * RESOLUTION);
            const y = Math.round(ny * pageHeightIn * RESOLUTION);
            const f = Math.round((point.pressure ?? 0.5) * RESOLUTION);
            return `${x} ${y} ${f}`;
          }).join(','),
          children: [],
        })),
      ],
    }));

  return {
    name: 'inkml:ink',
    attrs: {
      'xmlns:inkml': INKML_NS,
      'xmlns:oerp': 'http://open-erp.local/ink',
      'oerp:calibrated': 'word',
    },
    text: '',
    children: [definitions, ...groups],
  };
}

function channelNode(name: string, units: string, max: number): XmlNode {
  return { name: 'inkml:channel', attrs: { name, type: 'integer', max: String(max), units }, text: '', children: [] };
}

function propertyNode(channel: string | undefined, name: string, value: string, units: string | undefined): XmlNode {
  return {
    name: 'inkml:channelProperty',
    attrs: { ...(channel ? { channel } : {}), name, value, ...(units ? { units } : {}) },
    text: '', children: [],
  };
}

function brushPropertyNode(name: string, value: string, units: string | undefined): XmlNode {
  return {
    name: 'inkml:brushProperty',
    attrs: { name, value, ...(units ? { units } : {}) },
    text: '', children: [],
  };
}

/** Point list formatted in canvas coordinates for legacy callers (SVG text, tests). */
export function inkPointsValue(stroke: InkStroke, width = 800, height = 1000): string {
  return stroke.points.map((point) => `${(point.x * width).toFixed(1)},${(point.y * height).toFixed(1)}`).join(' ');
}

function ensureInkPart(document: WordDocument): void {
  if (document.inkPath && document.inkPath !== LEGACY_PART) {
    anchorInk(document, inkRelationshipId(document));
    return;
  }
  document.inkPath = PART_PATH;
  const id = inkRelationshipId(document);
  addRelationship(document.packageEntries, id, REL_TYPE, '../word/ink/ink1.xml');
  addContentType(document.packageEntries, '/word/ink/ink1.xml', CONTENT_TYPE);
  ensureWordNamespaces(document);
  anchorInk(document, id);
}

function ensureWordNamespaces(document: WordDocument): void {
  const root = document.xmlRoot;
  if (!root) return;
  if (!root.attrs['xmlns:r']) root.attrs['xmlns:r'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
}

/** Reuse the relationship pointing at the ink part, or add a unique one. */
function inkRelationshipId(document: WordDocument): string {
  const entries = document.packageEntries;
  const bytes = entries?.get('word/_rels/document.xml.rels');
  if (bytes) {
    const root = parseXml(new TextDecoder('utf-8').decode(bytes));
    for (const rel of descendants(root, 'Relationship')) {
      const target = attr(rel, 'Target') ?? '';
      if (target.endsWith('word/ink/ink1.xml') && attr(rel, 'Type') === REL_TYPE) {
        return attr(rel, 'Id') ?? 'rIdInk';
      }
    }
  }
  let index = 1;
  let id = 'rIdInk';
  if (bytes) {
    const xml = new TextDecoder('utf-8').decode(bytes);
    while (xml.includes(`Id="${id}"`)) id = `rIdInk${++index}`;
  }
  return id;
}

/**
 * Ink must be a DrawingML content part: w:drawing > wp:anchor > a:graphicData
 * (uri=...wordprocessingInk) > w14:contentPart, wrapped in mc:AlternateContent
 * with mc:Choice Requires="w14" ([MS-ODRAWXML] 2.2.7.6). A plain w:contentPart
 * in a run is for generic XML (MathML/SVG) and Word rejects it for ink.
 */
function anchorInk(document: WordDocument, relationshipId: string): void {
  const paragraph = inkAnchorParagraph(document);
  if (!paragraph) return;
  paragraph.children = paragraph.children.filter((child) => {
    if (child.name === 'mc:AlternateContent' && descendants(child, 'w14:contentPart').length) return false;
    if (child.name === 'w:r' && descendants(child, 'w:contentPart').length
      && !descendants(child, 'w14:contentPart').length) return false;
    return true;
  });
  if (!descendants(paragraph, 'w14:contentPart').length) {
    const run: XmlNode = { name: 'w:r', attrs: {}, text: '', children: [inkDrawing(document, relationshipId)] };
    paragraph.children.push(run);
  }
  if (descendants(paragraph, 'w:bookmarkStart').some((node) => attr(node, 'w:name') === '_InkStrokes')) return;
  const bookmarkId = String(nextNumericId(document, 'w:bookmarkStart', 'w:id'));
  paragraph.children.push(
    { name: 'w:bookmarkStart', attrs: { 'w:id': bookmarkId, 'w:name': '_InkStrokes' }, text: '', children: [] },
    { name: 'w:bookmarkEnd', attrs: { 'w:id': bookmarkId }, text: '', children: [] },
  );
}

/**
 * Prefer the cover table on page 1: anchoring inside the TOC sdt would put the
 * run in the middle of a field and make Word reflow/regenerate the TOC.
 */
function inkAnchorParagraph(document: WordDocument): XmlNode | null {
  const first = document.blocks[0];
  if (first?.kind === 'table') {
    for (let row = first.rows.length - 1; row >= 0; row--) {
      const cells = first.rows[row];
      for (let cell = cells.length - 1; cell >= 0; cell--) {
        const paragraphs = cells[cell];
        for (let index = paragraphs.length - 1; index >= 0; index--) {
          const node = paragraphs[index]?.xmlNode;
          if (node) return node;
        }
      }
    }
  }
  const block = document.blocks.find((item) => item.kind === 'paragraph' && item.paragraph.xmlNode);
  return block?.kind === 'paragraph' ? block.paragraph.xmlNode ?? null : null;
}

/** Page rectangle covered by the ink strokes, in CSS px. */
function inkBounds(document: WordDocument): { x: number; y: number; width: number; height: number } {
  const pageWidth = document.pageSize?.width ?? 816;
  const pageHeight = document.pageSize?.height ?? 1056;
  const strokes = document.inkStrokes ?? [];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let pad = 2;
  for (const stroke of strokes) {
    pad = Math.max(pad, stroke.width);
    for (const point of stroke.points) {
      minX = Math.min(minX, point.x * pageWidth);
      minY = Math.min(minY, point.y * pageHeight);
      maxX = Math.max(maxX, point.x * pageWidth);
      maxY = Math.max(maxY, point.y * pageHeight);
    }
  }
  if (!Number.isFinite(minX)) return { x: 0, y: 0, width: pageWidth, height: pageHeight };
  const x = Math.max(0, minX - pad);
  const y = Math.max(0, minY - pad);
  return {
    x,
    y,
    width: Math.max(8, Math.min(pageWidth - x, maxX - minX + pad * 2)),
    height: Math.max(8, Math.min(pageHeight - y, maxY - minY + pad * 2)),
  };
}

function inkDrawing(document: WordDocument, relationshipId: string): XmlNode {
  const bounds = inkBounds(document);
  const width = Math.round(bounds.width * 9525);
  const height = Math.round(bounds.height * 9525);
  const offsetX = Math.round(bounds.x * 9525);
  const offsetY = Math.round(bounds.y * 9525);
  const shapeId = String(nextNumericId(document, 'wp:docPr', 'id'));
  return {
    name: 'mc:AlternateContent',
    attrs: {
      'xmlns:mc': 'http://schemas.openxmlformats.org/markup-compatibility/2006',
      'xmlns:w14': 'http://schemas.microsoft.com/office/word/2010/wordml',
      'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
      'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    },
    text: '',
    children: [{
      name: 'mc:Choice', attrs: { Requires: 'w14' }, text: '', children: [{
        name: 'w:drawing', attrs: {}, text: '', children: [{
          name: 'wp:anchor',
          attrs: {
            distT: '0', distB: '0', distL: '0', distR: '0', simplePos: '0',
            relativeHeight: '1', behindDoc: '1', locked: '0', layoutInCell: '1', allowOverlap: '1',
          },
          text: '', children: [
            { name: 'wp:simplePos', attrs: { x: '0', y: '0' }, text: '', children: [] },
            { name: 'wp:positionH', attrs: { relativeFrom: 'page' }, text: '', children: [{ name: 'wp:posOffset', attrs: {}, text: String(offsetX), children: [] }] },
            { name: 'wp:positionV', attrs: { relativeFrom: 'page' }, text: '', children: [{ name: 'wp:posOffset', attrs: {}, text: String(offsetY), children: [] }] },
            { name: 'wp:extent', attrs: { cx: String(width), cy: String(height) }, text: '', children: [] },
            { name: 'wp:effectExtent', attrs: { l: '0', t: '0', r: '0', b: '0' }, text: '', children: [] },
            { name: 'wp:wrapNone', attrs: {}, text: '', children: [] },
            { name: 'wp:docPr', attrs: { id: shapeId, name: 'Ink' }, text: '', children: [] },
            {
              name: 'a:graphic', attrs: {}, text: '', children: [{
                name: 'a:graphicData',
                attrs: { uri: 'http://schemas.microsoft.com/office/word/2010/wordprocessingInk' },
                text: '', children: [{
                  name: 'w14:contentPart', attrs: { 'r:id': relationshipId }, text: '', children: [
                    {
                      name: 'w14:nvContentPartPr', attrs: {}, text: '', children: [
                        { name: 'w14:cNvPr', attrs: { id: shapeId, name: 'Ink' }, text: '', children: [] },
                        { name: 'w14:cNvContentPartPr', attrs: {}, text: '', children: [] },
                      ],
                    },
                    {
                      name: 'w14:xfrm', attrs: {}, text: '', children: [
                        { name: 'a:off', attrs: { x: '0', y: '0' }, text: '', children: [] },
                        { name: 'a:ext', attrs: { cx: String(width), cy: String(height) }, text: '', children: [] },
                      ],
                    },
                  ],
                }],
              }],
            },
          ],
        }],
      }],
    }],
  };
}

/** Next free numeric id for a repeated element (bookmarks, drawing ids). */
function nextNumericId(document: WordDocument, element: string, attribute: string): number {
  const root = document.xmlRoot;
  if (!root) return 1;
  let max = 0;
  for (const node of descendants(root, element)) {
    const value = Number(attr(node, attribute) ?? 0);
    if (Number.isFinite(value) && value > max) max = value;
  }
  return max + 1;
}

function inkPath(entries: Map<string, Uint8Array>): string | null {
  const bytes = entries.get('word/_rels/document.xml.rels');
  if (bytes) {
    const root = parseXml(new TextDecoder('utf-8').decode(bytes));
    for (const rel of descendants(root, 'Relationship')) {
      const target = attr(rel, 'Target') ?? '';
      if (target.endsWith('ink/ink1.xml') || target.endsWith('customXml/ink.xml')) {
        return target.replace(/^\.\.\//, '').replace(/^\.\//, '');
      }
    }
  }
  if (entries.has(PART_PATH)) return PART_PATH;
  if (entries.has(LEGACY_PART)) return LEGACY_PART;
  return null;
}

function addRelationship(entries: Map<string, Uint8Array> | undefined, id: string, type: string, target: string): void {
  if (!entries) return;
  const bytes = entries.get('word/_rels/document.xml.rels');
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const rel = `<Relationship Id="${id}" Type="${type}" Target="${target}" TargetMode="Internal"/>`;
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

function newStrokeId(): string {
  return `ink-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
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
