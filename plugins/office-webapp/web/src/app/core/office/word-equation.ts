import { descendants, type XmlNode } from '../binary/xml';
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
