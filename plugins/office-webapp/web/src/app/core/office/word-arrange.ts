import { attr, descendants, findChild, type XmlNode } from '../binary/xml';
import type { WordDocument, WordFloat, WordParagraph, WordRun } from './types';

const EMU_PER_PX = 9525;

function drawingNode(run: WordRun): XmlNode | null {
  return run.xmlNode ? descendants(run.xmlNode, 'w:drawing')[0] ?? null : null;
}

function anchorNode(run: WordRun): XmlNode | null {
  const drawing = drawingNode(run);
  return drawing ? descendants(drawing, 'wp:anchor')[0] ?? null : null;
}

function wrapNodeName(wrap: WordFloat['wrap']): string {
  switch (wrap) {
    case 'square': return 'wp:wrapSquare';
    case 'tight': return 'wp:wrapTight';
    case 'through': return 'wp:wrapThrough';
    case 'topAndBottom': return 'wp:wrapTopAndBottom';
    default: return 'wp:wrapNone';
  }
}

function rectPolygon(): XmlNode {
  return {
    name: 'wp:wrapPolygon', attrs: { edited: '0' }, text: '', children: [
      { name: 'wp:start', attrs: { x: '0', y: '0' }, text: '', children: [] },
      { name: 'wp:lineTo', attrs: { x: '0', y: '21600' }, text: '', children: [] },
      { name: 'wp:lineTo', attrs: { x: '21600', y: '21600' }, text: '', children: [] },
      { name: 'wp:lineTo', attrs: { x: '21600', y: '0' }, text: '', children: [] },
      { name: 'wp:lineTo', attrs: { x: '0', y: '0' }, text: '', children: [] },
    ],
  };
}

export function ensureFloating(run: WordRun): boolean {
  if (run.float && anchorNode(run)) return true;
  const drawing = drawingNode(run);
  if (!drawing) return false;
  const inline = descendants(drawing, 'wp:inline')[0];
  const existing = descendants(drawing, 'wp:anchor')[0];
  const source = inline ?? existing;
  if (!source) return false;
  const id = attr(descendants(source, 'wp:docPr')[0], 'id') ?? String(Date.now());
  if (existing) {
    const x = Number(descendants(descendants(existing, 'wp:positionH')[0], 'wp:posOffset')[0]?.text ?? 0);
    const y = Number(descendants(descendants(existing, 'wp:positionV')[0], 'wp:posOffset')[0]?.text ?? 0);
    run.float = {
      x: Math.round(x / EMU_PER_PX), y: Math.round(y / EMU_PER_PX),
      wrap: attr(existing, 'behindDoc') === '1' ? 'behind' : 'front',
      z: Number(attr(existing, 'relativeHeight') ?? 0), rotate: 0,
      hidden: attr(existing, 'hidden') === '1', anchorId: id,
    };
    return true;
  }
  const extent = descendants(source, 'wp:extent')[0];
  const docPr = descendants(source, 'wp:docPr')[0];
  const graphic = descendants(source, 'a:graphic')[0];
  const anchor: XmlNode = {
    name: 'wp:anchor',
    attrs: {
      distT: '0', distB: '0', distL: '0', distR: '0', simplePos: '0',
      relativeHeight: '251658240', behindDoc: '0', locked: '0', layoutInCell: '1',
      allowOverlap: '1', 'wp14:anchorId': id,
    },
    text: '',
    children: [
      { name: 'wp:simplePos', attrs: { x: '0', y: '0' }, text: '', children: [] },
      { name: 'wp:positionH', attrs: { relativeFrom: 'page' }, text: '', children: [{ name: 'wp:posOffset', attrs: {}, text: '0', children: [] }] },
      { name: 'wp:positionV', attrs: { relativeFrom: 'page' }, text: '', children: [{ name: 'wp:posOffset', attrs: {}, text: '0', children: [] }] },
      { name: 'wp:extent', attrs: { ...(extent?.attrs ?? { cx: '0', cy: '0' }) }, text: '', children: [] },
      { name: 'wp:effectExtent', attrs: { l: '0', t: '0', r: '0', b: '0' }, text: '', children: [] },
      { name: 'wp:wrapNone', attrs: {}, text: '', children: [] },
      ...(docPr ? [{ ...docPr }] : []),
      ...(graphic ? [{ ...graphic }] : []),
    ],
  };
  const index = inline ? drawing.children.indexOf(inline) : -1;
  if (index >= 0) drawing.children[index] = anchor;
  else drawing.children.push(anchor);
  run.float = { x: 0, y: 0, wrap: 'front', z: 251658240, rotate: 0, hidden: false, anchorId: id };
  return true;
}

function setOffsets(anchor: XmlNode, x: number, y: number): void {
  for (const [name, value] of [['wp:positionH', x], ['wp:positionV', y]] as const) {
    const position = descendants(anchor, name)[0];
    if (!position) continue;
    position.children = position.children.filter((child) => child.name !== 'wp:align');
    let offset = descendants(position, 'wp:posOffset')[0];
    if (!offset) {
      offset = { name: 'wp:posOffset', attrs: {}, text: '0', children: [] };
      position.children.push(offset);
    }
    offset.text = String(Math.round(value * EMU_PER_PX));
  }
}

export function setFloatPosition(run: WordRun, x: number, y: number): boolean {
  if (!ensureFloating(run) || !run.float) return false;
  run.float.x = Math.round(x);
  run.float.y = Math.round(y);
  const anchor = anchorNode(run);
  if (anchor) setOffsets(anchor, run.float.x, run.float.y);
  return true;
}

export function setFloatWrap(run: WordRun, wrap: WordFloat['wrap']): boolean {
  if (!ensureFloating(run) || !run.float) return false;
  run.float.wrap = wrap;
  const anchor = anchorNode(run);
  if (!anchor) return true;
  anchor.attrs['behindDoc'] = wrap === 'behind' ? '1' : '0';
  anchor.children = anchor.children.filter((child) => !child.name.startsWith('wp:wrap'));
  const node: XmlNode = { name: wrapNodeName(wrap), attrs: {}, text: '', children: [] };
  if (wrap === 'square' || wrap === 'tight' || wrap === 'through') node.attrs['wrapText'] = 'bothSides';
  if (wrap === 'tight' || wrap === 'through') node.children.push(rectPolygon());
  const extentIndex = anchor.children.findIndex((child) => child.name === 'wp:effectExtent');
  if (extentIndex >= 0) anchor.children.splice(extentIndex + 1, 0, node);
  else anchor.children.push(node);
  return true;
}

export function setFloatRotation(run: WordRun, degrees: number): boolean {
  if (!ensureFloating(run) || !run.float) return false;
  run.float.rotate = ((Math.round(degrees) % 360) + 360) % 360;
  run.rotate = run.float.rotate;
  const xfrm = descendants(drawingNode(run), 'a:xfrm')[0];
  if (xfrm) xfrm.attrs['rot'] = String(run.float.rotate * 60000);
  return true;
}

export function setFloatZ(run: WordRun, z: number): boolean {
  if (!ensureFloating(run) || !run.float) return false;
  run.float.z = Math.round(z);
  const anchor = anchorNode(run);
  if (anchor) anchor.attrs['relativeHeight'] = String(run.float.z);
  return true;
}

export function setFloatHidden(run: WordRun, hidden: boolean): boolean {
  if (!ensureFloating(run) || !run.float) return false;
  run.float.hidden = hidden;
  const anchor = anchorNode(run);
  if (anchor) anchor.attrs['hidden'] = hidden ? '1' : '0';
  return true;
}

export function runFloats(document: WordDocument): Array<{ run: WordRun; paragraphIndex: number }> {
  const result: Array<{ run: WordRun; paragraphIndex: number }> = [];
  document.blocks.forEach((block, paragraphIndex) => {
    const paragraphs = block.kind === 'paragraph'
      ? [block.paragraph]
      : block.rows.flatMap((row) => row.flatMap((cell) => cell));
    for (const paragraph of paragraphs) {
      for (const run of paragraph.runs) {
        if (run.float) result.push({ run, paragraphIndex });
      }
    }
  });
  return result;
}

export function nextFloatZ(document: WordDocument): number {
  const values = runFloats(document).map((item) => item.run.float?.z ?? 0);
  return values.length ? Math.max(...values) + 1 : 251658240;
}

const GROUP_URI = 'http://schemas.microsoft.com/office/word/2010/wordprocessingGroup';
const SHAPE_URI = 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape';
const PICTURE_URI = 'http://schemas.openxmlformats.org/drawingml/2006/picture';

function cloneNode(node: XmlNode): XmlNode {
  return { name: node.name, attrs: { ...node.attrs }, text: node.text, children: node.children.map(cloneNode) };
}

function runWidth(run: WordRun): number {
  return run.group?.width ?? run.textBox?.width ?? run.imageWidth ?? 160;
}

function runHeight(run: WordRun): number {
  return run.group?.height ?? run.textBox?.height ?? run.imageHeight ?? 80;
}

function shapeOf(run: WordRun): XmlNode | null {
  if (!run.xmlNode) return null;
  return descendants(run.xmlNode, 'wps:wsp')[0] ?? descendants(run.xmlNode, 'pic:pic')[0] ?? null;
}

function locateRun(document: WordDocument, run: WordRun): { paragraph: WordParagraph; node: XmlNode } | null {
  for (const block of document.blocks) {
    const paragraphs = block.kind === 'paragraph' ? [block.paragraph] : block.rows.flatMap((row) => row.flatMap((cell) => cell));
    for (const paragraph of paragraphs) {
      if (paragraph.runs.includes(run) && paragraph.xmlNode) return { paragraph, node: paragraph.xmlNode };
    }
  }
  return null;
}

function nextDocPrId(document: WordDocument): number {
  const ids = descendants(document.xmlRoot ?? null, 'wp:docPr').map((node) => Number(attr(node, 'id') ?? 0));
  return (ids.length ? Math.max(...ids) : 0) + 1;
}

function ensureGroupNamespaces(document: WordDocument): void {
  const root = document.xmlRoot;
  if (!root) return;
  const namespaces: Record<string, string> = {
    'xmlns:wpg': GROUP_URI,
    'xmlns:wps': SHAPE_URI,
    'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'xmlns:pic': PICTURE_URI,
  };
  for (const [key, value] of Object.entries(namespaces)) {
    if (!root.attrs[key]) root.attrs[key] = value;
  }
}

function setShapeTransform(shape: XmlNode, x: number, y: number, width: number, height: number, rotate = 0): void {
  const spPr = findChild(shape, shape.name === 'pic:pic' ? 'pic:spPr' : 'wps:spPr');
  if (!spPr) return;
  let xfrm = findChild(spPr, 'a:xfrm');
  if (!xfrm) {
    xfrm = { name: 'a:xfrm', attrs: {}, text: '', children: [] };
    spPr.children.unshift(xfrm);
  }
  if (rotate) xfrm.attrs['rot'] = String(Math.round(rotate) * 60000);
  const offset = { name: 'a:off', attrs: { x: String(Math.round(x * EMU_PER_PX)), y: String(Math.round(y * EMU_PER_PX)) }, text: '', children: [] };
  const extent = { name: 'a:ext', attrs: { cx: String(Math.round(width * EMU_PER_PX)), cy: String(Math.round(height * EMU_PER_PX)) }, text: '', children: [] };
  xfrm.children = [offset, extent];
}

function wrapNodeFor(wrap: WordFloat['wrap']): XmlNode {
  const name = wrapNodeName(wrap);
  const node: XmlNode = { name, attrs: {}, text: '', children: [] };
  if (wrap === 'square' || wrap === 'tight' || wrap === 'through') node.attrs['wrapText'] = 'bothSides';
  if (wrap === 'tight' || wrap === 'through') node.children.push(rectPolygon());
  return node;
}

function anchorRun(run: WordRun, shape: XmlNode, id: number, group?: { width: number; height: number; children: XmlNode[] }): XmlNode {
  const float = run.float ?? { x: 0, y: 0, wrap: 'front' as const, z: 1, rotate: 0, hidden: false };
  const width = group?.width ?? runWidth(run);
  const height = group?.height ?? runHeight(run);
  const graphicData: XmlNode = group
    ? {
      name: 'a:graphicData', attrs: { uri: GROUP_URI }, text: '', children: [{
        name: 'wpg:wgp', attrs: {}, text: '', children: [
          { name: 'wpg:cNvGrpSpPr', attrs: {}, text: '', children: [] },
          {
            name: 'wpg:grpSpPr', attrs: {}, text: '', children: [{
              name: 'a:xfrm', attrs: {}, text: '', children: [
                { name: 'a:off', attrs: { x: '0', y: '0' }, text: '', children: [] },
                { name: 'a:ext', attrs: { cx: String(Math.round(width * EMU_PER_PX)), cy: String(Math.round(height * EMU_PER_PX)) }, text: '', children: [] },
                { name: 'a:chOff', attrs: { x: '0', y: '0' }, text: '', children: [] },
                { name: 'a:chExt', attrs: { cx: String(Math.round(width * EMU_PER_PX)), cy: String(Math.round(height * EMU_PER_PX)) }, text: '', children: [] },
              ],
            }],
          },
          {
            name: 'wpg:wgpPr', attrs: {}, text: '', children: [
              { name: 'a:noFill', attrs: {}, text: '', children: [] },
              { name: 'a:ln', attrs: {}, text: '', children: [{ name: 'a:noFill', attrs: {}, text: '', children: [] }] },
            ],
          },
          ...group.children,
        ],
      }],
    }
    : {
      name: 'a:graphicData',
      attrs: { uri: shape.name === 'pic:pic' ? PICTURE_URI : SHAPE_URI },
      text: '', children: [shape],
    };
  const anchor: XmlNode = {
    name: 'wp:anchor',
    attrs: {
      distT: '0', distB: '0', distL: '0', distR: '0', simplePos: '0',
      relativeHeight: String(float.z || 1), behindDoc: float.wrap === 'behind' ? '1' : '0',
      locked: '0', layoutInCell: '1', allowOverlap: '1', 'wp14:anchorId': String(id),
    },
    text: '',
    children: [
      { name: 'wp:simplePos', attrs: { x: '0', y: '0' }, text: '', children: [] },
      { name: 'wp:positionH', attrs: { relativeFrom: 'page' }, text: '', children: [{ name: 'wp:posOffset', attrs: {}, text: String(Math.round(float.x * EMU_PER_PX)), children: [] }] },
      { name: 'wp:positionV', attrs: { relativeFrom: 'page' }, text: '', children: [{ name: 'wp:posOffset', attrs: {}, text: String(Math.round(float.y * EMU_PER_PX)), children: [] }] },
      { name: 'wp:extent', attrs: { cx: String(Math.round(width * EMU_PER_PX)), cy: String(Math.round(height * EMU_PER_PX)) }, text: '', children: [] },
      { name: 'wp:effectExtent', attrs: { l: '0', t: '0', r: '0', b: '0' }, text: '', children: [] },
      wrapNodeFor(float.wrap),
      { name: 'wp:docPr', attrs: { id: String(id), name: group ? 'Group' : (run.alt ?? 'Object') }, text: '', children: [] },
      { name: 'a:graphic', attrs: {}, text: '', children: [graphicData] },
    ],
  };
  return { name: 'w:r', attrs: {}, text: '', children: [{ name: 'w:drawing', attrs: {}, text: '', children: [anchor] }] };
}

export function groupFloatingRuns(document: WordDocument, runs: WordRun[]): WordRun | null {
  const targets = runs.filter((run) => run.float && !run.group && shapeOf(run));
  if (targets.length < 2) return null;
  const located = targets.map((run) => ({ run, ...(locateRun(document, run) ?? {}) }))
    .filter((item): item is { run: WordRun; paragraph: WordParagraph; node: XmlNode } => Boolean(item.paragraph && item.node));
  if (located.length < 2) return null;
  ensureGroupNamespaces(document);
  const x = Math.min(...targets.map((run) => run.float!.x));
  const y = Math.min(...targets.map((run) => run.float!.y));
  const right = Math.max(...targets.map((run) => run.float!.x + runWidth(run)));
  const bottom = Math.max(...targets.map((run) => run.float!.y + runHeight(run)));
  const width = Math.max(1, right - x);
  const height = Math.max(1, bottom - y);
  const children: WordRun[] = [];
  const childShapes: XmlNode[] = [];
  for (const run of targets) {
    const shape = cloneNode(shapeOf(run)!);
    const offsetX = run.float!.x - x;
    const offsetY = run.float!.y - y;
    setShapeTransform(shape, offsetX, offsetY, runWidth(run), runHeight(run), run.rotate ?? 0);
    childShapes.push(shape);
    children.push({
      text: '',
      textBox: run.textBox ? { ...run.textBox } : undefined,
      imagePath: run.imagePath,
      imageWidth: run.imageWidth,
      imageHeight: run.imageHeight,
      alt: run.alt,
      groupOffset: { x: offsetX, y: offsetY },
      rotate: run.rotate,
      xmlNode: shape,
    });
  }
  const id = nextDocPrId(document);
  const groupRun: WordRun = {
    text: '',
    float: {
      x, y, wrap: 'front', z: Math.max(...runFloats(document).map((item) => item.run.float?.z ?? 0)) + 1,
      rotate: 0, hidden: false, anchorId: String(id),
    },
    group: { width, height, children },
  };
  groupRun.xmlNode = anchorRun(groupRun, { name: 'wpg:wgp', attrs: {}, text: '', children: [] }, id, { width, height, children: childShapes });
  const host = located[0].paragraph;
  for (const item of located) {
    item.paragraph.runs = item.paragraph.runs.filter((run) => run !== item.run);
    if (item.paragraph.xmlNode && item.run.xmlNode) {
      item.paragraph.xmlNode.children = item.paragraph.xmlNode.children.filter((child) => child !== item.run.xmlNode);
    }
  }
  host.runs.push(groupRun);
  host.xmlNode?.children.push(groupRun.xmlNode);
  return groupRun;
}

export function ungroupFloatingRun(document: WordDocument, run: WordRun): WordRun[] {
  const group = run.group;
  const float = run.float;
  if (!group || !float) return [];
  const located = locateRun(document, run);
  if (!located) return [];
  ensureGroupNamespaces(document);
  const id = nextDocPrId(document);
  const children: WordRun[] = [];
  group.children.forEach((child, index) => {
    const source = child.xmlNode ? cloneNode(child.xmlNode) : null;
    if (!source) return;
    setShapeTransform(source, 0, 0, runWidth(child), runHeight(child), child.rotate ?? 0);
    const childRun: WordRun = {
      text: '',
      textBox: child.textBox ? { ...child.textBox } : undefined,
      imagePath: child.imagePath,
      imageWidth: child.imageWidth,
      imageHeight: child.imageHeight,
      alt: child.alt,
      rotate: child.rotate,
      float: {
        x: float.x + (child.groupOffset?.x ?? 0),
        y: float.y + (child.groupOffset?.y ?? 0),
        wrap: float.wrap, z: float.z, rotate: child.rotate ?? 0,
        hidden: float.hidden, anchorId: String(id + index),
      },
    };
    childRun.xmlNode = anchorRun(childRun, source, id + index);
    children.push(childRun);
  });
  located.paragraph.runs = located.paragraph.runs.filter((item) => item !== run);
  if (run.xmlNode) {
    located.node.children = located.node.children.filter((child) => child !== run.xmlNode);
  }
  located.paragraph.runs.push(...children);
  for (const child of children) {
    if (child.xmlNode) located.node.children.push(child.xmlNode);
  }
  return children;
}
