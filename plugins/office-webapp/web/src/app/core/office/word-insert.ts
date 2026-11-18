import { attr, descendants, findChild, serializeXml, type XmlNode } from '../binary/xml';
import { ensureFloating } from './word-arrange';
import type { WordBlock, WordDocument, WordParagraph, WordRun } from './types';

const EMU_PER_PX = 9525;
const CONTENT_TYPES = '[Content_Types].xml';
const DOCUMENT_RELS = 'word/_rels/document.xml.rels';
const REL_IMAGE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image';
const IMAGE_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  tif: 'image/tiff',
  tiff: 'image/tiff',
  svg: 'image/svg+xml',
};

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

export function insertWordTable(document: WordDocument, rows: number, cols: number): WordBlock | null {
  const body = bodyOf(document);
  if (!body) return null;
  const rowCount = Math.max(1, Math.min(10, Math.round(rows)));
  const colCount = Math.max(1, Math.min(10, Math.round(cols)));
  const cellWidth = Math.floor(9360 / colCount);
  const grid = Array.from({ length: colCount }, () => ({
    name: 'w:gridCol', attrs: { 'w:w': String(cellWidth) }, text: '', children: [],
  }));
  const tableRows: XmlNode[] = [];
  const blockRows: WordParagraph[][][] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const cells: XmlNode[] = [];
    const modelCells: WordParagraph[][] = [];
    for (let colIndex = 0; colIndex < colCount; colIndex++) {
      cells.push({
        name: 'w:tc', attrs: {}, text: '', children: [
          { name: 'w:tcPr', attrs: {}, text: '', children: [
            { name: 'w:tcW', attrs: { 'w:w': String(cellWidth), 'w:type': 'dxa' }, text: '', children: [] },
          ] },
          { name: 'w:p', attrs: {}, text: '', children: [] },
        ],
      });
      modelCells.push([{ runs: [] }]);
    }
    tableRows.push({ name: 'w:tr', attrs: {}, text: '', children: cells });
    blockRows.push(modelCells);
  }
  const table: XmlNode = {
    name: 'w:tbl', attrs: {}, text: '', children: [
      { name: 'w:tblPr', attrs: {}, text: '', children: [
        { name: 'w:tblW', attrs: { 'w:w': '0', 'w:type': 'auto' }, text: '', children: [] },
        { name: 'w:tblBorders', attrs: {}, text: '', children: [
          { name: 'w:top', attrs: { 'w:val': 'single', 'w:sz': '4', 'w:space': '0', 'w:color': 'auto' }, text: '', children: [] },
          { name: 'w:left', attrs: { 'w:val': 'single', 'w:sz': '4', 'w:space': '0', 'w:color': 'auto' }, text: '', children: [] },
          { name: 'w:bottom', attrs: { 'w:val': 'single', 'w:sz': '4', 'w:space': '0', 'w:color': 'auto' }, text: '', children: [] },
          { name: 'w:right', attrs: { 'w:val': 'single', 'w:sz': '4', 'w:space': '0', 'w:color': 'auto' }, text: '', children: [] },
          { name: 'w:insideH', attrs: { 'w:val': 'single', 'w:sz': '4', 'w:space': '0', 'w:color': 'auto' }, text: '', children: [] },
          { name: 'w:insideV', attrs: { 'w:val': 'single', 'w:sz': '4', 'w:space': '0', 'w:color': 'auto' }, text: '', children: [] },
        ] },
      ] },
      { name: 'w:tblGrid', attrs: {}, text: '', children: grid },
      ...tableRows,
    ],
  };
  insertBeforeSection(body, table);
  const block: WordBlock = {
    kind: 'table',
    rows: blockRows,
    grid: Array.from({ length: colCount }, () => Math.round(10000 / colCount) / 100),
    widthPct: 100,
    xmlNode: table,
  };
  document.blocks.push(block);
  return block;
}

export interface InsertImageInput {
  bytes: Uint8Array;
  extension: string;
  widthPx: number;
  heightPx: number;
  fileName: string;
}

export function insertWordImage(document: WordDocument, input: InsertImageInput): WordBlock | null {
  const body = bodyOf(document);
  const root = document.xmlRoot;
  if (!body || !root) return null;
  const extension = normalizeExtension(input.extension);
  const mime = IMAGE_MIME[extension] ?? 'application/octet-stream';
  const widthPx = Math.max(1, Math.round(input.widthPx || 320));
  const heightPx = Math.max(1, Math.round(input.heightPx || 200));
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;

  const mediaPath = nextMediaPath(entries, extension);
  const relId = nextRelationshipId(entries);
  entries.set(mediaPath, input.bytes);
  writeRelationships(entries, relId, mediaPath.replace(/^word\//, ''));
  writeContentType(entries, extension, mime);
  ensureNamespaces(root);

  const docPrId = nextDocPrId(root);
  const cx = String(widthPx * EMU_PER_PX);
  const cy = String(heightPx * EMU_PER_PX);
  const run: XmlNode = {
    name: 'w:r', attrs: {}, text: '', children: [{
      name: 'w:drawing', attrs: {}, text: '', children: [{
        name: 'wp:inline', attrs: {}, text: '', children: [
          { name: 'wp:extent', attrs: { cx, cy }, text: '', children: [] },
          { name: 'wp:docPr', attrs: { id: String(docPrId), name: input.fileName, descr: input.fileName }, text: '', children: [] },
          { name: 'a:graphic', attrs: {}, text: '', children: [
            { name: 'a:graphicData', attrs: { uri: 'http://schemas.openxmlformats.org/drawingml/2006/picture' }, text: '', children: [
              { name: 'pic:pic', attrs: {}, text: '', children: [
                { name: 'pic:nvPicPr', attrs: {}, text: '', children: [
                  { name: 'pic:cNvPr', attrs: { id: String(docPrId), name: input.fileName }, text: '', children: [] },
                  { name: 'pic:cNvPicPr', attrs: {}, text: '', children: [] },
                ] },
                { name: 'pic:blipFill', attrs: {}, text: '', children: [
                  { name: 'a:blip', attrs: { 'r:embed': relId }, text: '', children: [] },
                  { name: 'a:stretch', attrs: {}, text: '', children: [{ name: 'a:fillRect', attrs: {}, text: '', children: [] }] },
                ] },
                { name: 'pic:spPr', attrs: {}, text: '', children: [
                  { name: 'a:xfrm', attrs: {}, text: '', children: [
                    { name: 'a:off', attrs: { x: '0', y: '0' }, text: '', children: [] },
                    { name: 'a:ext', attrs: { cx, cy }, text: '', children: [] },
                  ] },
                  { name: 'a:prstGeom', attrs: { prst: 'rect' }, text: '', children: [{ name: 'a:avLst', attrs: {}, text: '', children: [] }] },
                ] },
              ] },
            ] },
          ] },
        ],
      }],
    }],
  };
  insertBeforeSection(body, { name: 'w:p', attrs: {}, text: '', children: [run] });
  const block: WordBlock = {
    kind: 'paragraph',
    paragraph: {
      runs: [{
        text: '', imagePath: mediaPath, imageWidth: widthPx, imageHeight: heightPx, alt: input.fileName,
      }],
    },
  };
  document.blocks.push(block);
  return block;
}

export function insertWordVideo(document: WordDocument, url: string, title = 'Video'): WordBlock | null {
  const body = bodyOf(document);
  const root = document.xmlRoot;
  if (!body || !root || !url.trim()) return null;
  ensureNamespaces(root);
  const widthPx = 480;
  const heightPx = 270;
  const cx = String(widthPx * EMU_PER_PX);
  const cy = String(heightPx * EMU_PER_PX);
  const docPrId = nextDocPrId(root);
  const paragraph: XmlNode = {
    name: 'w:p', attrs: {}, text: '', children: [{
      name: 'w:r', attrs: {}, text: '', children: [{
        name: 'w:drawing', attrs: {}, text: '', children: [{
          name: 'wp:inline', attrs: {}, text: '', children: [
            { name: 'wp:extent', attrs: { cx, cy }, text: '', children: [] },
            { name: 'wp:docPr', attrs: { id: String(docPrId), name: title }, text: '', children: [] },
            { name: 'wp15:webVideoPr', attrs: { href: url.trim(), embeddedUrl: url.trim() }, text: '', children: [] },
          ],
        }],
      }],
    }],
  };
  insertBeforeSection(body, paragraph);
  const block: WordBlock = {
    kind: 'paragraph',
    paragraph: { runs: [{ text: '', videoUrl: url.trim(), imageWidth: widthPx, imageHeight: heightPx }], xmlNode: paragraph },
  };
  document.blocks.push(block);
  return block;
}

export interface WordShapeInput {
  shape?: 'rect' | 'roundRect' | 'ellipse' | 'line';
  text?: string;
  fill?: string;
  widthPx?: number;
  heightPx?: number;
}

const SHAPE_PRESET: Record<string, string> = {
  rect: 'rect', roundRect: 'roundRect', ellipse: 'ellipse', line: 'line',
};

export function insertWordShape(document: WordDocument, input: WordShapeInput): WordBlock | null {
  const body = bodyOf(document);
  const root = document.xmlRoot;
  if (!body || !root) return null;
  ensureNamespaces(root);
  const shape = input.shape ?? 'rect';
  const width = Math.max(24, Math.round(input.widthPx ?? 240));
  const height = shape === 'line' ? 6 : Math.max(24, Math.round(input.heightPx ?? 120));
  const cx = String(width * EMU_PER_PX);
  const cy = String(height * EMU_PER_PX);
  const docPrId = nextDocPrId(root);
  const fill = (input.fill ?? '#EAF1FB').replace('#', '').toUpperCase();
  const text = input.text ?? '';
  const spPrChildren: XmlNode[] = [
    { name: 'a:xfrm', attrs: {}, text: '', children: [
      { name: 'a:off', attrs: { x: '0', y: '0' }, text: '', children: [] },
      { name: 'a:ext', attrs: { cx, cy }, text: '', children: [] },
    ] },
    { name: 'a:prstGeom', attrs: { prst: SHAPE_PRESET[shape] ?? 'rect' }, text: '', children: [{ name: 'a:avLst', attrs: {}, text: '', children: [] }] },
  ];
  if (shape !== 'line') {
    spPrChildren.push({ name: 'a:solidFill', attrs: {}, text: '', children: [{ name: 'a:srgbClr', attrs: { val: fill }, text: '', children: [] }] });
  }
  spPrChildren.push({
    name: 'a:ln', attrs: { w: '12700' }, text: '', children: [
      { name: 'a:solidFill', attrs: {}, text: '', children: [{ name: 'a:srgbClr', attrs: { val: shape === 'line' ? fill : '8EAADB' }, text: '', children: [] }] },
    ],
  });
  const shapeChildren: XmlNode[] = [
    { name: 'wps:cNvSpPr', attrs: { txBox: text ? '1' : '0' }, text: '', children: [] },
    { name: 'wps:spPr', attrs: {}, text: '', children: spPrChildren },
  ];
  if (text) {
    shapeChildren.push({
      name: 'wps:txbx', attrs: {}, text: '', children: [{
        name: 'w:txbxContent', attrs: {}, text: '', children: [{
          name: 'w:p', attrs: {}, text: '', children: [{
            name: 'w:r', attrs: {}, text: '', children: [
              { name: 'w:t', attrs: { 'xml:space': 'preserve' }, text, children: [] },
            ],
          }],
        }],
      }],
    });
  }
  shapeChildren.push({
    name: 'wps:bodyPr', attrs: { rot: '0', wrap: 'square', lIns: '91440', tIns: '45720', rIns: '91440', bIns: '45720' },
    text: '', children: [],
  });
  const runNode: XmlNode = {
    name: 'w:r', attrs: {}, text: '', children: [{
      name: 'w:drawing', attrs: {}, text: '', children: [{
        name: 'wp:inline', attrs: {}, text: '', children: [
          { name: 'wp:extent', attrs: { cx, cy }, text: '', children: [] },
          { name: 'wp:docPr', attrs: { id: String(docPrId), name: `${shape}${docPrId}` }, text: '', children: [] },
          { name: 'a:graphic', attrs: {}, text: '', children: [{
            name: 'a:graphicData',
            attrs: { uri: 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape' },
            text: '', children: [{ name: 'wps:wsp', attrs: {}, text: '', children: shapeChildren }],
          }] },
        ],
      }],
    }],
  };
  const paragraph: XmlNode = { name: 'w:p', attrs: {}, text: '', children: [runNode] };
  insertBeforeSection(body, paragraph);
  const run: WordRun = {
    text: '', textBox: { text, width, height, shape, fill: `#${fill}` }, xmlNode: runNode,
  };
  ensureFloating(run);
  const block: WordBlock = {
    kind: 'paragraph',
    paragraph: { runs: [run], xmlNode: paragraph },
  };
  document.blocks.push(block);
  return block;
}

export function insertTextBox(document: WordDocument, text: string, widthPx = 320, heightPx = 120): WordBlock | null {
  return insertWordShape(document, { shape: 'rect', text, widthPx, heightPx });
}

function normalizeExtension(value: string): string {
  const extension = value.toLowerCase().replace(/^\./, '');
  return extension === 'jpeg' ? 'jpg' : extension;
}

function nextMediaPath(entries: Map<string, Uint8Array>, extension: string): string {
  let index = 1;
  const names = new Set(entries.keys());
  while (names.has(`word/media/image${index}.${extension}`)) index++;
  return `word/media/image${index}.${extension}`;
}

function nextRelationshipId(entries: Map<string, Uint8Array>): string {
  const rels = readText(entries.get(DOCUMENT_RELS));
  let index = 1;
  while (rels.includes(`Id="rIdImg${index}"`)) index++;
  return `rIdImg${index}`;
}

function writeRelationships(entries: Map<string, Uint8Array>, relId: string, target: string): void {
  const rels = readText(entries.get(DOCUMENT_RELS))
    || '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  const relationship = `<Relationship Id="${relId}" Type="${REL_IMAGE}" Target="${target}"/>`;
  entries.set(DOCUMENT_RELS, new TextEncoder().encode(
    rels.includes('</Relationships>')
      ? rels.replace('</Relationships>', `${relationship}</Relationships>`)
      : `${rels}${relationship}`,
  ));
}

function writeContentType(entries: Map<string, Uint8Array>, extension: string, mime: string): void {
  let types = readText(entries.get(CONTENT_TYPES));
  if (!types) {
    types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>';
  }
  if (!types.includes(`Extension="${extension}"`)) {
    const entry = `<Default Extension="${extension}" ContentType="${mime}"/>`;
    types = types.includes('</Types>')
      ? types.replace('</Types>', `${entry}</Types>`)
      : `${types}${entry}`;
  }
  entries.set(CONTENT_TYPES, new TextEncoder().encode(types));
}

function ensureNamespaces(root: XmlNode): void {
  const namespaces: Record<string, string> = {
    'xmlns:r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'xmlns:pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
    'xmlns:wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
    'xmlns:wp15': 'http://schemas.microsoft.com/office/word/2012/wordml',
    'xmlns:wps': 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape',
    'xmlns:v': 'urn:schemas-microsoft-com:vml',
    'xmlns:o': 'urn:schemas-microsoft-com:office:office',
  };
  for (const [name, uri] of Object.entries(namespaces)) {
    if (!root.attrs[name]) root.attrs[name] = uri;
  }
}

function nextDocPrId(root: XmlNode): number {
  const ids = descendants(root, 'wp:docPr')
    .map((node) => Number(attr(node, 'id') ?? 0))
    .filter((value) => Number.isFinite(value));
  return (ids.length ? Math.max(...ids) : 0) + 1;
}

function readText(bytes: Uint8Array | undefined): string {
  return bytes ? new TextDecoder('utf-8').decode(bytes) : '';
}

export function wordXml(document: WordDocument): string {
  return document.xmlRoot ? serializeXml(document.xmlRoot) : '';
}
