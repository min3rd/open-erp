import { attr, descendants, findChild, parseXml, serializeXml } from '../binary/xml';
import type { WordBlock, WordDocument, WordRun, WordSmartArt, WordSmartArtNode } from './types';
import { SMARTART_LAYOUT_XML } from './word-smartart-layout';

const DGM_NS = 'http://schemas.openxmlformats.org/drawingml/2006/diagram';
const A_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
const W_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const WP_NS = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const DOCUMENT_RELS = 'word/_rels/document.xml.rels';
const CONTENT_TYPES = '[Content_Types].xml';
const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const EMU_PER_PX = 9525;

const escapeXml = (value: string): string => value
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function dataXml(nodes: string[]): string {
  const layoutId = 'urn:microsoft.com/office/officeart/2005/8/layout/default';
  const emptyText = '<dgm:t><a:bodyPr/><a:lstStyle/><a:p><a:endParaRPr lang="vi-VN"/></a:p></dgm:t>';
  const docPresId = `${300 + nodes.length}`;
  const points = nodes.map((text, index) => {
    const nodeId = `${index + 1}`;
    const parId = `${100 + index}`;
    const sibId = `${200 + index}`;
    const presId = `${300 + index}`;
    const cxnId = `${400 + index}`;
    const presCxnId = `${500 + index}`;
    const points = `<dgm:pt modelId="${nodeId}"><dgm:prSet phldrT="[Text]"/><dgm:spPr/>`
      + `<dgm:t><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="vi-VN"/><a:t>${escapeXml(text)}</a:t></a:r></a:p></dgm:t></dgm:pt>`
      + `<dgm:pt modelId="${parId}" type="parTrans" cxnId="${cxnId}"><dgm:prSet/><dgm:spPr/>${emptyText}</dgm:pt>`
      + `<dgm:pt modelId="${sibId}" type="sibTrans" cxnId="${cxnId}"><dgm:prSet/><dgm:spPr/>${emptyText}</dgm:pt>`
      + `<dgm:pt modelId="${presId}" type="pres"><dgm:prSet presAssocID="${nodeId}" presName="node" `
      + `presStyleLbl="node1" presStyleIdx="${index}" presStyleCnt="${nodes.length}">`
      + '<dgm:presLayoutVars><dgm:bulletEnabled val="1"/></dgm:presLayoutVars></dgm:prSet><dgm:spPr/></dgm:pt>';
    const connections = `<dgm:cxn modelId="${cxnId}" srcId="0" destId="${nodeId}" srcOrd="${index}" destOrd="0" `
      + `parTransId="${parId}" sibTransId="${sibId}"/>`
      + `<dgm:cxn modelId="${presCxnId}" type="presOf" srcId="${nodeId}" destId="${presId}" srcOrd="0" destOrd="0" presId="${layoutId}"/>`;
    return { points, connections };
  });
  const docPres = nodes.length
    ? `<dgm:pt modelId="${docPresId}" type="pres"><dgm:prSet presAssocID="0" presName="diagram" presStyleCnt="0">`
      + '<dgm:presLayoutVars><dgm:dir/><dgm:resizeHandles val="exact"/></dgm:presLayoutVars></dgm:prSet><dgm:spPr/></dgm:pt>'
    : '';
  const docConnections = nodes.length
    ? `<dgm:cxn modelId="${600 + nodes.length}" type="presOf" srcId="0" destId="${docPresId}" srcOrd="0" destOrd="0" presId="${layoutId}"/>`
      + nodes.map((_text, index) => `<dgm:cxn modelId="${700 + index}" type="presParOf" srcId="${docPresId}" `
        + `destId="${300 + index}" srcOrd="${index}" destOrd="0" presId="${layoutId}"/>`).join('')
    : '';
  return `${XML_DECL}<dgm:dataModel xmlns:dgm="${DGM_NS}" xmlns:a="${A_NS}"><dgm:ptLst>`
    + `<dgm:pt modelId="0" type="doc"><dgm:prSet loTypeId="${layoutId}" `
    + 'loCatId="list" qsTypeId="urn:microsoft.com/office/officeart/2005/8/quickstyle/simple5" qsCatId="simple" '
    + 'csTypeId="urn:microsoft.com/office/officeart/2005/8/colors/colorful4" csCatId="colorful" phldr="1"/>'
    + `<dgm:spPr/>${emptyText}</dgm:pt>${points.map((item) => item.points).join('')}${docPres}</dgm:ptLst><dgm:cxnLst>`
    + `${points.map((item) => item.connections).join('')}${docConnections}</dgm:cxnLst>`
    + '<dgm:bg/><dgm:whole/></dgm:dataModel>';
}

function layoutXml(): string {
  return `${XML_DECL}${SMARTART_LAYOUT_XML}`;
}

function readText(bytes?: Uint8Array): string {
  return bytes ? new TextDecoder('utf-8').decode(bytes) : '';
}

function addRelationship(entries: Map<string, Uint8Array>, id: string, type: string, target: string): void {
  const current = readText(entries.get(DOCUMENT_RELS));
  const relationship = `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${type}" Target="${target}"/>`;
  const xml = current
    ? current.replace('</Relationships>', `${relationship}</Relationships>`)
    : `${XML_DECL}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${relationship}</Relationships>`;
  entries.set(DOCUMENT_RELS, new TextEncoder().encode(xml));
}

function addContentType(entries: Map<string, Uint8Array>, partName: string, contentType: string): void {
  const current = readText(entries.get(CONTENT_TYPES));
  if (!current || current.includes(`PartName="${partName}"`)) return;
  const override = `<Override PartName="${partName}" ContentType="${contentType}"/>`;
  const xml = current.includes('</Types>')
    ? current.replace('</Types>', `${override}</Types>`)
    : current.replace(/<Types([^>]*)\/>/, `<Types$1>${override}</Types>`);
  entries.set(CONTENT_TYPES, new TextEncoder().encode(xml));
}

function nextDiagramNumber(entries: Map<string, Uint8Array>): number {
  let index = 1;
  while (entries.has(`word/diagrams/data${index}.xml`)) index++;
  return index;
}

function smartArtNodes(root: ReturnType<typeof parseXml>): WordSmartArtNode[] {
  return descendants(root, 'dgm:pt')
    .filter((point) => !point.attrs['type'])
    .map((point) => {
      const text = descendants(point, 'a:t').map((node) => node.text).join('');
      return { text, node: point };
    })
    .filter((node) => node.text.length || node.node);
}

export function parseWordSmartArt(
  node: ReturnType<typeof parseXml>, relationships: Map<string, string>, entries: Map<string, Uint8Array>,
): WordSmartArt | undefined {
  const relIds = descendants(node, 'dgm:relIds')[0];
  if (!relIds) return undefined;
  const dataTarget = relationships.get(attr(relIds, 'r:dm') ?? '');
  if (!dataTarget) return undefined;
  const normalize = (target: string): string => {
    const clean = target.replace(/^\.\//, '');
    if (clean.startsWith('/')) return clean.slice(1);
    return clean.startsWith('word/') ? clean : `word/${clean}`;
  };
  const dataPath = normalize(dataTarget);
  const bytes = entries.get(dataPath);
  const dataRoot = bytes ? parseXml(new TextDecoder('utf-8').decode(bytes)) : undefined;
  if (!dataRoot) return undefined;
  const layoutPath = normalize(relationships.get(attr(relIds, 'r:lo') ?? '') ?? `diagrams/layout1.xml`);
  const quickStylePath = normalize(relationships.get(attr(relIds, 'r:qs') ?? '') ?? `diagrams/quickStyle1.xml`);
  const colorsPath = normalize(relationships.get(attr(relIds, 'r:cs') ?? '') ?? `diagrams/colors1.xml`);
  const layoutBytes = entries.get(layoutPath);
  const styleBytes = entries.get(quickStylePath);
  const colorsBytes = entries.get(colorsPath);
  const extent = descendants(node, 'wp:extent')[0];
  return {
    dataPath,
    layoutPath,
    quickStylePath,
    colorsPath,
    widthPx: Math.round(Number(attr(extent ?? null, 'cx') ?? 0) / EMU_PER_PX) || 480,
    heightPx: Math.round(Number(attr(extent ?? null, 'cy') ?? 0) / EMU_PER_PX) || 240,
    nodes: smartArtNodes(dataRoot),
    dataRoot,
    layoutRoot: layoutBytes ? parseXml(new TextDecoder('utf-8').decode(layoutBytes)) : undefined,
    quickStyleRoot: styleBytes ? parseXml(new TextDecoder('utf-8').decode(styleBytes)) : undefined,
    colorsRoot: colorsBytes ? parseXml(new TextDecoder('utf-8').decode(colorsBytes)) : undefined,
  };
}

export function insertWordSmartArt(document: WordDocument, texts: string[], widthPx = 480, heightPx = 240): WordBlock | null {
  const body = document.xmlRoot ? findChild(document.xmlRoot, 'w:body') : null;
  const entries = document.packageEntries;
  if (!document.xmlRoot || !body || !entries) return null;
  const values = texts.map((text) => text.trim()).filter(Boolean);
  if (!values.length) return null;
  const number = nextDiagramNumber(entries);
  const dataPath = `word/diagrams/data${number}.xml`;
  const layoutPath = `word/diagrams/layout${number}.xml`;
  entries.set(dataPath, new TextEncoder().encode(dataXml(values)));
  entries.set(layoutPath, new TextEncoder().encode(layoutXml()));
  const dataRel = `rIdDgmData${number}`;
  const layoutRel = `rIdDgmLayout${number}`;
  addRelationship(entries, dataRel, 'diagramData', `diagrams/data${number}.xml`);
  addRelationship(entries, layoutRel, 'diagramLayout', `diagrams/layout${number}.xml`);
  addContentType(entries, `/${dataPath}`, 'application/vnd.openxmlformats-officedocument.drawingml.diagramData+xml');
  addContentType(entries, `/${layoutPath}`, 'application/vnd.openxmlformats-officedocument.drawingml.diagramLayout+xml');

  const width = Math.max(120, Math.round(widthPx));
  const height = Math.max(80, Math.round(heightPx));
  const cx = String(width * EMU_PER_PX);
  const cy = String(height * EMU_PER_PX);
  const docPrId = descendants(document.xmlRoot, 'wp:docPr').length + 1;
  const runXml = `<w:r xmlns:w="${W_NS}" xmlns:wp="${WP_NS}" xmlns:a="${A_NS}" xmlns:r="${R_NS}" xmlns:dgm="${DGM_NS}">`
    + `<w:drawing><wp:inline><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${docPrId}" name="SmartArt${docPrId}"/>`
    + `<a:graphic><a:graphicData uri="${DGM_NS}"><dgm:relIds r:dm="${dataRel}" r:lo="${layoutRel}"/>`
    + '</a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
  const runNode = parseXml(runXml);
  const paragraph = { name: 'w:p', attrs: {}, text: '', children: [runNode] };
  const finalIndex = body.children.map((child) => child.name).lastIndexOf('w:sectPr');
  body.children.splice(finalIndex < 0 ? body.children.length : finalIndex, 0, paragraph);
  const dataRoot = parseXml(dataXml(values));
  const run: WordRun = {
    text: '',
    xmlNode: runNode,
    smartArt: {
      dataPath, layoutPath,
      widthPx: width, heightPx: height,
      nodes: smartArtNodes(dataRoot), dataRoot,
    },
  };
  const block: WordBlock = { kind: 'paragraph', paragraph: { runs: [run], xmlNode: paragraph } };
  document.blocks.push(block);
  return block;
}

export function updateWordSmartArt(run: WordRun, texts: string[]): boolean {
  const smartArt = run.smartArt;
  if (!smartArt) return false;
  const values = texts.map((text) => text.trim()).filter(Boolean);
  if (!values.length) return false;
  const dataRoot = parseXml(dataXml(values));
  smartArt.dataRoot = dataRoot;
  smartArt.nodes = smartArtNodes(dataRoot);
  return true;
}

/** Serialize all SmartArt parts referenced by runs (top-level, tables and groups). */
export function smartArtParts(document: WordDocument): Array<{ name: string; data: string }> {
  const parts = new Map<string, string>();
  const addRun = (run: WordRun): void => {
    const smartArt = run.smartArt;
    if (!smartArt?.dataRoot) return;
    parts.set(smartArt.dataPath, XML_DECL + serializeXml(smartArt.dataRoot));
    if (smartArt.layoutPath) parts.set(smartArt.layoutPath, smartArt.layoutRoot ? XML_DECL + serializeXml(smartArt.layoutRoot) : layoutXml());
    if (run.group) for (const child of run.group.children) addRun(child);
  };
  const addRows = (rows: Array<Array<Array<{ runs: WordRun[] }>>>): void => {
    for (const row of rows) for (const cell of row) for (const paragraph of cell) {
      for (const run of paragraph.runs) addRun(run);
    }
  };
  for (const block of document.blocks) {
    if (block.kind === 'paragraph') {
      for (const run of block.paragraph.runs) addRun(run);
    } else {
      addRows(block.rows as never);
      for (const nested of block.nested ?? []) addRows(nested.rows as never);
    }
  }
  return [...parts].map(([name, data]) => ({ name, data }));
}
