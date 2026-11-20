import { attr, descendants, findChild, findChildren, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';

export type EquationKind = 'fraction' | 'sqrt' | 'superscript' | 'subscript' | 'linear';

export interface EquationInput {
  kind: EquationKind;
  numerator?: string;
  denominator?: string;
  base?: string;
  exponent?: string;
  subscript?: string;
  text?: string;
}

export interface WordEquation {
  paragraphIndex: number;
  kind: EquationKind;
  label: string;
  node: XmlNode;
}

const MATH_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';

export function insertEquation(
  document: WordDocument, input: EquationInput, paragraphIndex: number,
): WordEquation | null {
  const block = document.blocks[paragraphIndex];
  if (!block || block.kind !== 'paragraph' || !block.paragraph.xmlNode) return null;
  const node = buildEquation(input);
  block.paragraph.xmlNode.children.push(node);
  return {
    paragraphIndex,
    kind: input.kind,
    label: equationLabel(node),
    node,
  };
}

export function buildEquation(input: EquationInput): XmlNode {
  const oMath: XmlNode = { name: 'm:oMath', attrs: { 'xmlns:m': MATH_NS }, text: '', children: [] };
  const text = (value: string | undefined, fallback: string) => mathText(value?.trim() || fallback);
  switch (input.kind) {
    case 'fraction':
      oMath.children.push({
        name: 'm:f', attrs: {}, text: '', children: [
          { name: 'm:num', attrs: {}, text: '', children: [text(input.numerator, 'a')] },
          { name: 'm:den', attrs: {}, text: '', children: [text(input.denominator, 'b')] },
        ],
      });
      break;
    case 'sqrt':
      oMath.children.push({
        name: 'm:rad', attrs: {}, text: '', children: [
          { name: 'm:radPr', attrs: {}, text: '', children: [{ name: 'm:degHide', attrs: { 'm:val': '1' }, text: '', children: [] }] },
          { name: 'm:deg', attrs: {}, text: '', children: [] },
          { name: 'm:e', attrs: {}, text: '', children: [text(input.text, 'x')] },
        ],
      });
      break;
    case 'superscript':
      oMath.children.push({
        name: 'm:sSup', attrs: {}, text: '', children: [
          { name: 'm:e', attrs: {}, text: '', children: [text(input.base, 'x')] },
          { name: 'm:sup', attrs: {}, text: '', children: [text(input.exponent, '2')] },
        ],
      });
      break;
    case 'subscript':
      oMath.children.push({
        name: 'm:sSub', attrs: {}, text: '', children: [
          { name: 'm:e', attrs: {}, text: '', children: [text(input.base, 'x')] },
          { name: 'm:sub', attrs: {}, text: '', children: [text(input.subscript, 'i')] },
        ],
      });
      break;
    default:
      oMath.children.push(text(input.text, 'x + y = z'));
  }
  return oMath;
}

export function parseEquations(document: WordDocument): WordEquation[] {
  const equations: WordEquation[] = [];
  document.blocks.forEach((block, index) => {
    if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) return;
    for (const node of descendants(block.paragraph.xmlNode, 'm:oMath')) {
      equations.push({ paragraphIndex: index, kind: equationKind(node), label: equationLabel(node), node });
    }
  });
  return equations;
}

export function deleteEquation(document: WordDocument, node: XmlNode): boolean {
  for (const block of document.blocks) {
    if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) continue;
    if (removeNode(block.paragraph.xmlNode, node)) return true;
  }
  return false;
}

export function equationLabel(node: XmlNode): string {
  const kind = equationKind(node);
  if (kind === 'fraction') {
    return `${textOfChild(node, 'm:num') || 'a'}/${textOfChild(node, 'm:den') || 'b'}`;
  }
  if (kind === 'sqrt') return `√(${textOfChild(node, 'm:e') || 'x'})`;
  if (kind === 'superscript') return `${textOfChild(node, 'm:e') || 'x'}^${textOfChild(node, 'm:sup') || '2'}`;
  if (kind === 'subscript') return `${textOfChild(node, 'm:e') || 'x'}_${textOfChild(node, 'm:sub') || 'i'}`;
  return descendants(node, 'm:t').map((item) => item.text).join('') || 'x + y = z';
}

function equationKind(node: XmlNode): EquationKind {
  const names = new Set(collectNames(node));
  if (names.has('m:f')) return 'fraction';
  if (names.has('m:rad')) return 'sqrt';
  if (names.has('m:sSup')) return 'superscript';
  if (names.has('m:sSub')) return 'subscript';
  return 'linear';
}

function collectNames(node: XmlNode): string[] {
  const names = [node.name];
  for (const child of node.children) names.push(...collectNames(child));
  return names;
}

function textOfChild(node: XmlNode, name: string): string {
  const scope = descendants(node, name)[0];
  return scope ? descendants(scope, 'm:t').map((item) => item.text).join('') : '';
}

function mathText(value: string): XmlNode {
  return {
    name: 'm:r', attrs: {}, text: '', children: [
      { name: 'm:t', attrs: { 'xml:space': 'preserve' }, text: value, children: [] },
    ],
  };
}

export function ommlToMathMl(node: XmlNode, display = false): string {
  const inner = renderOmmlNode(node);
  const mode = display ? ' display="block"' : '';
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${mode}>${inner}</math>`;
}

function renderOmmlNode(node: XmlNode): string {
  if (node.name === 'm:oMathPara') {
    return findChildren(node, 'm:oMath').map(renderOmmlNode).join('') || node.children.map(renderOmmlNode).join('');
  }
  if (node.name === 'm:oMath') {
    return `<mrow>${node.children.map(renderOmmlNode).join('')}</mrow>`;
  }
  if (node.name === 'm:r') {
    const text = findChildren(node, 'm:t').map((item) => item.text).join('')
      || descendants(node, 'w:t').map((item) => item.text).join('');
    if (!text) return '';
    return renderMathRunText(text);
  }
  if (node.name === 'm:t') {
    return node.text ? renderMathRunText(node.text) : '';
  }
  if (node.name === 'm:f') {
    const num = findChild(node, 'm:num');
    const den = findChild(node, 'm:den');
    return `<mfrac><mrow>${num ? num.children.map(renderOmmlNode).join('') : ''}</mrow><mrow>${den ? den.children.map(renderOmmlNode).join('') : ''}</mrow></mfrac>`;
  }
  if (node.name === 'm:rad') {
    const degHide = attr(findChild(findChild(node, 'm:radPr'), 'm:degHide'), 'm:val');
    const deg = findChild(node, 'm:deg');
    const base = findChild(node, 'm:e');
    const degXml = deg ? deg.children.map(renderOmmlNode).join('') : '';
    const baseXml = base ? base.children.map(renderOmmlNode).join('') : '';
    if (degHide === '1' || !degXml) return `<msqrt>${baseXml}</msqrt>`;
    return `<mroot><mrow>${baseXml}</mrow><mrow>${degXml}</mrow></mroot>`;
  }
  if (node.name === 'm:sSup') {
    const base = findChild(node, 'm:e');
    const sup = findChild(node, 'm:sup');
    return `<msup><mrow>${base ? base.children.map(renderOmmlNode).join('') : ''}</mrow><mrow>${sup ? sup.children.map(renderOmmlNode).join('') : ''}</mrow></msup>`;
  }
  if (node.name === 'm:sSub') {
    const base = findChild(node, 'm:e');
    const sub = findChild(node, 'm:sub');
    return `<msub><mrow>${base ? base.children.map(renderOmmlNode).join('') : ''}</mrow><mrow>${sub ? sub.children.map(renderOmmlNode).join('') : ''}</mrow></msub>`;
  }
  if (node.name === 'm:sSubSup') {
    const base = findChild(node, 'm:e');
    const sub = findChild(node, 'm:sub');
    const sup = findChild(node, 'm:sup');
    return `<msubsup><mrow>${base ? base.children.map(renderOmmlNode).join('') : ''}</mrow><mrow>${sub ? sub.children.map(renderOmmlNode).join('') : ''}</mrow><mrow>${sup ? sup.children.map(renderOmmlNode).join('') : ''}</mrow></msubsup>`;
  }
  if (node.name === 'm:nary') {
    const chr = attr(findChild(findChild(node, 'm:naryPr'), 'm:chr'), 'm:val') ?? '∫';
    const sub = findChild(node, 'm:sub');
    const sup = findChild(node, 'm:sup');
    const base = findChild(node, 'm:e');
    const subXml = sub ? sub.children.map(renderOmmlNode).join('') : '';
    const supXml = sup ? sup.children.map(renderOmmlNode).join('') : '';
    const op = subXml && supXml
      ? `<msubsup><mo>${escapeMathText(chr)}</mo><mrow>${subXml}</mrow><mrow>${supXml}</mrow></msubsup>`
      : subXml
        ? `<msub><mo>${escapeMathText(chr)}</mo><mrow>${subXml}</mrow></msub>`
        : supXml
          ? `<msup><mo>${escapeMathText(chr)}</mo><mrow>${supXml}</mrow></msup>`
          : `<mo>${escapeMathText(chr)}</mo>`;
    return `<mrow>${op}<mrow>${base ? base.children.map(renderOmmlNode).join('') : ''}</mrow></mrow>`;
  }
  if (node.name === 'm:d') {
    const dPr = findChild(node, 'm:dPr');
    const beg = attr(findChild(dPr, 'm:begChr'), 'm:val') ?? '(';
    const end = attr(findChild(dPr, 'm:endChr'), 'm:val') ?? ')';
    const sep = attr(findChild(dPr, 'm:sepChr'), 'm:val') ?? ',';
    const parts = findChildren(node, 'm:e').map((e) => `<mrow>${e.children.map(renderOmmlNode).join('')}</mrow>`);
    return `<mrow><mo>${escapeMathText(beg)}</mo>${parts.join(`<mo>${escapeMathText(sep)}</mo>`)}<mo>${escapeMathText(end)}</mo></mrow>`;
  }
  if (node.name === 'm:m') {
    const rows = findChildren(node, 'm:mr').map((row) =>
      `<mtr>${findChildren(row, 'm:e').map((cell) => `<mtd>${cell.children.map(renderOmmlNode).join('')}</mtd>`).join('')}</mtr>`);
    return `<mtable>${rows.join('')}</mtable>`;
  }
  if (node.name === 'm:acc') {
    const chr = attr(findChild(findChild(node, 'm:accPr'), 'm:chr'), 'm:val') ?? '^';
    const base = findChild(node, 'm:e');
    return `<mover><mrow>${base ? base.children.map(renderOmmlNode).join('') : ''}</mrow><mo>${escapeMathText(chr)}</mo></mover>`;
  }
  if (node.name === 'm:bar') {
    const pos = attr(findChild(findChild(node, 'm:barPr'), 'm:pos'), 'm:val') ?? 'top';
    const base = findChild(node, 'm:e');
    const tag = pos === 'bot' ? 'munder' : 'mover';
    return `<${tag}><mrow>${base ? base.children.map(renderOmmlNode).join('') : ''}</mrow><mo>‾</mo></${tag}>`;
  }
  if (node.name === 'm:func') {
    const name = findChild(node, 'm:fName');
    const base = findChild(node, 'm:e');
    return `<mrow><mi>${escapeMathText(name ? descendants(name, 'm:t').map((t) => t.text).join('') : '')}</mi><mrow>${base ? base.children.map(renderOmmlNode).join('') : ''}</mrow></mrow>`;
  }
  if (node.name.endsWith('Pr')) return '';
  return node.children.map(renderOmmlNode).join('');
}

function renderMathRunText(text: string): string {
  const parts = text.match(/(\d+(?:\.\d+)?|[+\-−×÷=<>≤≥≠±∑∏∫√()\[\]{},.;:]+|\s+|[^\d+\-−×÷=<>≤≥≠±∑∏∫√()\[\]{},.;:\s]+)/g) ?? [text];
  return parts.map((part) => {
    if (/^\s+$/.test(part)) return '<mspace width="0.2em"/>';
    if (/^\d/.test(part)) return `<mn>${escapeMathText(part)}</mn>`;
    if (/^[+\-−×÷=<>≤≥≠±∑∏∫√()\[\]{},.;:]+$/.test(part)) return `<mo>${escapeMathText(part)}</mo>`;
    return `<mi>${escapeMathText(part)}</mi>`;
  }).join('');
}

function escapeMathText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function removeNode(root: XmlNode, target: XmlNode): boolean {
  const index = root.children.indexOf(target);
  if (index >= 0) {
    root.children.splice(index, 1);
    return true;
  }
  for (const child of root.children) {
    if (removeNode(child, target)) return true;
  }
  return false;
}
