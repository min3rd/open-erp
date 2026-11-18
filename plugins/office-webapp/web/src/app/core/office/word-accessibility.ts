import { attr, descendants, findChild, findChildren, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';

export type AccessibilityCode =
  | 'IMAGE_ALT_MISSING'
  | 'HEADING_SKIP'
  | 'EMPTY_HEADING'
  | 'TABLE_NO_HEADER';

export interface AccessibilityIssue {
  code: AccessibilityCode;
  paragraphIndex: number;
  node?: XmlNode;
  context?: string;
}

const IMAGE_NODE = 'pic:cNvPr';

export function scanAccessibility(document: WordDocument): AccessibilityIssue[] {
  const issues: AccessibilityIssue[] = [];
  let previousHeading = 0;
  document.blocks.forEach((block, index) => {
    if (block.kind !== 'paragraph') return;
    const level = block.paragraph.headingLevel ?? 0;
    const text = block.paragraph.runs.map((run) => run.text).join('').trim();
    if (level > 0) {
      if (!text) issues.push({ code: 'EMPTY_HEADING', paragraphIndex: index });
      if (previousHeading > 0 && level > previousHeading + 1) {
        issues.push({ code: 'HEADING_SKIP', paragraphIndex: index, context: `H${previousHeading} → H${level}` });
      }
      previousHeading = level;
    }
  });

  const root = document.xmlRoot;
  if (!root) return issues;

  for (const node of descendants(root, IMAGE_NODE)) {
    if (!attr(node, 'descr')) {
      issues.push({ code: 'IMAGE_ALT_MISSING', paragraphIndex: -1, node, context: attr(node, 'name') ?? '' });
    }
  }
  for (const table of descendants(root, 'w:tbl')) {
    const firstRow = findChildren(table, 'w:tr')[0];
    const header = findChild(findChild(firstRow, 'w:trPr'), 'w:tblHeader');
    if (!header) issues.push({ code: 'TABLE_NO_HEADER', paragraphIndex: -1, node: table });
  }
  return issues;
}

export function setImageAlt(node: XmlNode, alt: string): void {
  const value = alt.trim();
  if (!value) delete node.attrs['descr'];
  else node.attrs['descr'] = value;
}

export function markTableHeader(table: XmlNode): boolean {
  const firstRow = findChildren(table, 'w:tr')[0];
  if (!firstRow) return false;
  let trPr = findChild(firstRow, 'w:trPr');
  if (!trPr) {
    trPr = { name: 'w:trPr', attrs: {}, text: '', children: [] };
    firstRow.children.unshift(trPr);
  }
  if (!findChild(trPr, 'w:tblHeader')) {
    trPr.children.push({ name: 'w:tblHeader', attrs: {}, text: '', children: [] });
  }
  return true;
}

export function accessibilitySummary(issues: AccessibilityIssue[]): Record<AccessibilityCode, number> {
  const summary: Record<AccessibilityCode, number> = {
    IMAGE_ALT_MISSING: 0,
    HEADING_SKIP: 0,
    EMPTY_HEADING: 0,
    TABLE_NO_HEADER: 0,
  };
  for (const issue of issues) summary[issue.code]++;
  return summary;
}
