import { attr, descendants, findChild, type XmlNode } from '../binary/xml';
import type { WordBlock, WordDocument, WordParagraph } from './types';
import { ensureHeaderFooter, sectionAt, type HeaderFooterRef } from './word-section';

const VML_NS = 'urn:schemas-microsoft-com:vml';
const OFFICE_NS = 'urn:schemas-microsoft-com:office:office';

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

function runNode(text: string, sizePt?: number, bold?: boolean): XmlNode {
  const rPr: XmlNode[] = [];
  if (bold) rPr.push({ name: 'w:b', attrs: {}, text: '', children: [] });
  if (sizePt) rPr.push({ name: 'w:sz', attrs: { 'w:val': String(Math.round(sizePt * 2)) }, text: '', children: [] });
  const children: XmlNode[] = [];
  if (rPr.length) children.push({ name: 'w:rPr', attrs: {}, text: '', children: rPr });
  children.push({ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text, children: [] });
  return { name: 'w:r', attrs: {}, text: '', children };
}

function textParagraph(
  text: string, style: string | undefined, align: 'center' | 'left', sizePt?: number,
  bold?: boolean, before = 0, after = 120,
): XmlNode {
  const pPr: XmlNode[] = [];
  if (style) pPr.push({ name: 'w:pStyle', attrs: { 'w:val': style }, text: '', children: [] });
  pPr.push({ name: 'w:spacing', attrs: { 'w:before': String(before), 'w:after': String(after) }, text: '', children: [] });
  pPr.push({ name: 'w:jc', attrs: { 'w:val': align }, text: '', children: [] });
  return {
    name: 'w:p', attrs: {}, text: '', children: [
      { name: 'w:pPr', attrs: {}, text: '', children: pPr },
      runNode(text, sizePt, bold),
    ],
  };
}

function pageBreakParagraph(): XmlNode {
  return {
    name: 'w:p', attrs: {}, text: '', children: [{
      name: 'w:r', attrs: {}, text: '', children: [
        { name: 'w:br', attrs: { 'w:type': 'page' }, text: '', children: [] },
      ],
    }],
  };
}

function modelParagraph(node: XmlNode, style: string | undefined, align: 'center' | 'left', text: string): WordBlock {
  const paragraph: WordParagraph = { style, align, runs: [{ text }], xmlNode: node };
  return { kind: 'paragraph', paragraph };
}

export function insertCoverPage(
  document: WordDocument, title: string, subtitle: string, dateText: string,
): WordBlock[] | null {
  const body = bodyOf(document);
  if (!body) return null;
  const nodes: XmlNode[] = [
    textParagraph(title, 'Title', 'center', 30, true, 2400, 240),
    textParagraph(subtitle, 'Subtitle', 'center', 14, false, 0, 240),
    textParagraph(dateText, undefined, 'center', 11, false, 0, 0),
    pageBreakParagraph(),
  ];
  body.children.unshift(...nodes);
  const blocks: WordBlock[] = [
    modelParagraph(nodes[0], 'Title', 'center', title),
    modelParagraph(nodes[1], 'Subtitle', 'center', subtitle),
    modelParagraph(nodes[2], undefined, 'center', dateText),
    { kind: 'paragraph', paragraph: { runs: [{ text: '', pageBreak: true }], xmlNode: nodes[3] } },
  ];
  document.blocks.unshift(...blocks);
  return blocks;
}

export function insertCaption(document: WordDocument, label: string, text: string): WordBlock | null {
  const body = bodyOf(document);
  if (!body) return null;
  const cleanLabel = label.trim() || 'Hình';
  const existing = document.blocks.filter((block) => block.kind === 'paragraph'
    && block.paragraph.runs.map((run) => run.text).join('').trim().startsWith(cleanLabel)).length;
  const number = existing + 1;
  const node: XmlNode = {
    name: 'w:p', attrs: {}, text: '', children: [
      { name: 'w:pPr', attrs: {}, text: '', children: [
        { name: 'w:pStyle', attrs: { 'w:val': 'Caption' }, text: '', children: [] },
      ] },
      runNode(`${cleanLabel} `),
      { name: 'w:fldSimple', attrs: { 'w:instr': ` SEQ ${cleanLabel} \\* ARABIC ` }, text: '', children: [runNode(String(number))] },
      runNode(`: ${text.trim()}`),
    ],
  };
  insertBeforeSection(body, node);
  const block: WordBlock = {
    kind: 'paragraph',
    paragraph: {
      style: 'Caption', align: 'left', xmlNode: node,
      runs: [{ text: `${cleanLabel} ` }, { text: String(number) }, { text: `: ${text.trim()}` }],
    },
  };
  document.blocks.push(block);
  return block;
}

export function insertTableOfFigures(document: WordDocument, label: string): WordBlock[] | null {
  const body = bodyOf(document);
  if (!body) return null;
  const cleanLabel = label.trim() || 'Hình';
  const captions = document.blocks.filter((block) => block.kind === 'paragraph'
    && block.paragraph.runs.map((run) => run.text).join('').trim().startsWith(`${cleanLabel} `));
  const headingNode = textParagraph(`Danh mục ${cleanLabel.toLowerCase()}`, 'Heading1', 'left', 14, true, 0, 160);
  const nodes: XmlNode[] = [headingNode];
  const blocks: WordBlock[] = [modelParagraph(headingNode, 'Heading1', 'left', `Danh mục ${cleanLabel.toLowerCase()}`)];
  captions.forEach((caption, index) => {
    const text = caption.kind === 'paragraph' ? caption.paragraph.runs.map((run) => run.text).join('').trim() : '';
    const entry = textParagraph(`${text}  .....  ${index + 1}`, undefined, 'left', 11, false, 0, 60);
    nodes.push(entry);
    blocks.push(modelParagraph(entry, undefined, 'left', `${text}  .....  ${index + 1}`));
  });
  const anchor = body.children.map((child, index) => child.name === 'w:sectPr' ? index : -1)
    .filter((index) => index >= 0);
  const at = anchor.length ? anchor[anchor.length - 1] : body.children.length;
  body.children.splice(at, 0, ...nodes);
  document.blocks.push(...blocks);
  return blocks;
}

function watermarkParagraph(text: string): XmlNode {
  return {
    name: 'w:p', attrs: {}, text: '', children: [
      { name: 'w:r', attrs: {}, text: '', children: [{
        name: 'w:pict', attrs: {}, text: '', children: [{
          name: 'v:shape',
          attrs: {
            id: 'PowerPlusWaterMarkObject',
            type: '#_x0000_t136',
            style: 'position:absolute;margin-left:0;margin-top:0;width:400pt;height:100pt;rotation:315;z-index:-251658752;mso-position-horizontal:center;mso-position-vertical:center',
            fillcolor: '#c0c0c0',
            stroked: 'f',
          },
          text: '', children: [
            { name: 'v:fill', attrs: { opacity: '.5' }, text: '', children: [] },
            { name: 'v:textpath', attrs: { style: 'font-family:"Calibri";font-size:1pt', string: text }, text: '', children: [] },
          ],
        }],
      }] },
    ],
  };
}

function watermarkNodes(ref: HeaderFooterRef): XmlNode[] {
  return ref.xmlRoot.children.filter((child) => child.name === 'w:p'
    && descendants(child, 'v:textpath').length > 0);
}

export function setWatermark(document: WordDocument, text: string | null): boolean {
  const section = sectionAt(document);
  if (!section) return false;
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;
  const header = ensureHeaderFooter(document, section, 'header', 'default', entries);
  if (!header.xmlRoot.attrs['xmlns:v']) header.xmlRoot.attrs['xmlns:v'] = VML_NS;
  if (!header.xmlRoot.attrs['xmlns:o']) header.xmlRoot.attrs['xmlns:o'] = OFFICE_NS;
  const existing = watermarkNodes(header);
  header.xmlRoot.children = header.xmlRoot.children.filter((child) => !existing.includes(child));
  if (!text || !text.trim()) {
    delete document.watermark;
    return true;
  }
  const node = watermarkParagraph(text.trim());
  header.xmlRoot.children.push(node);
  document.watermark = text.trim();
  return true;
}

export function watermarkText(document: WordDocument): string | undefined {
  for (const section of document.sections ?? []) {
    for (const header of section.headers) {
      const path = descendants(header.xmlRoot, 'v:textpath')[0];
      const value = attr(path, 'string');
      if (value) return value;
    }
  }
  return undefined;
}
