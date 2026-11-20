import { attr, descendants, findChild, type XmlNode } from '../binary/xml';
import type { MergeRule, WordBlock, WordDocument, WordNestedTable, WordParagraph, WordRun } from './types';

export interface MergeRecipient {
  [field: string]: string;
}

export interface MailMergeState {
  sourceName: string;
  fields: string[];
  recipients: MergeRecipient[];
  selected: number[];
  previewIndex: number | null;
  highlight: boolean;
  target: 'letters' | 'envelopes' | 'labels';
  addressBlock: {
    name: string;
    company: string;
    address: string;
    city: string;
    state: string;
    postal: string;
    country: string;
  };
  greetingLine: string;
  errors: string[];
}

export function emptyMailMergeState(): MailMergeState {
  return {
    sourceName: '',
    fields: [],
    recipients: [],
    selected: [],
    previewIndex: null,
    highlight: false,
    target: 'letters',
    addressBlock: { name: '', company: '', address: '', city: '', state: '', postal: '', country: '' },
    greetingLine: 'Name',
    errors: [],
  };
}

export function parseMergeRows(rows: string[][]): { fields: string[]; recipients: MergeRecipient[] } {
  const clean = rows.filter((row) => row.some((cell) => cell.trim() !== ''));
  if (!clean.length) return { fields: [], recipients: [] };
  const fields = clean[0].map((name, index) => name.trim() || `Field${index + 1}`);
  const unique = fields.map((name, index) => fields.indexOf(name) === index ? name : `${name}_${index + 1}`);
  const recipients = clean.slice(1).map((row) => {
    const record: MergeRecipient = {};
    unique.forEach((field, index) => {
      record[field] = (row[index] ?? '').trim();
    });
    return record;
  });
  return { fields: unique, recipients };
}

function textRun(value: string): XmlNode {
  return {
    name: 'w:r', attrs: {}, text: '',
    children: [{ name: 'w:t', attrs: { 'xml:space': 'preserve' }, text: value, children: [] }],
  };
}

function fieldNode(instruction: string, result: string): XmlNode {
  return {
    name: 'w:fldSimple',
    attrs: { 'w:instr': ` ${instruction} ` },
    text: '',
    children: [textRun(result)],
  };
}

function appendField(paragraph: WordParagraph, field: string, prefix = '', suffix = ''): void {
  if (prefix) paragraph.runs.push({ text: prefix });
  paragraph.runs.push({ text: `«${field}»`, mergeField: field });
  if (suffix) paragraph.runs.push({ text: suffix });
  const node = paragraph.xmlNode;
  if (!node) return;
  if (prefix) node.children.push(textRun(prefix));
  node.children.push(fieldNode(`MERGEFIELD ${field}`, `«${field}»`));
  if (suffix) node.children.push(textRun(suffix));
}

export function insertMergeField(document: WordDocument, paragraphIndex: number, field: string): boolean {
  const block = document.blocks[paragraphIndex];
  if (!block || block.kind !== 'paragraph' || !field.trim()) return false;
  appendField(block.paragraph, field.trim());
  return true;
}

export function insertAddressBlock(document: WordDocument, paragraphIndex: number, state: MailMergeState): boolean {
  const block = document.blocks[paragraphIndex];
  if (!block || block.kind !== 'paragraph') return false;
  const paragraph = block.paragraph;
  const keys: Array<[string, string]> = [
    ['name', state.addressBlock.name], ['company', state.addressBlock.company],
    ['address', state.addressBlock.address], ['city', state.addressBlock.city],
    ['state', state.addressBlock.state], ['postal', state.addressBlock.postal],
    ['country', state.addressBlock.country],
  ];
  const chosen = keys.filter(([, field]) => field.trim());
  if (!chosen.length) return false;
  chosen.forEach(([, field], index) => {
    if (index > 0) {
      paragraph.runs.push({ text: '\n' });
      paragraph.xmlNode?.children.push({
        name: 'w:r', attrs: {}, text: '',
        children: [{ name: 'w:br', attrs: {}, text: '', children: [] }],
      });
    }
    appendField(paragraph, field.trim());
  });
  return true;
}

export function insertGreetingLine(document: WordDocument, paragraphIndex: number, state: MailMergeState): boolean {
  const block = document.blocks[paragraphIndex];
  if (!block || block.kind !== 'paragraph') return false;
  const field = state.greetingLine.trim() || state.fields[0];
  if (!field) return false;
  appendField(block.paragraph, field, 'Dear ', ',');
  return true;
}

export function insertMergeRule(document: WordDocument, paragraphIndex: number, rule: MergeRule): boolean {
  const block = document.blocks[paragraphIndex];
  if (!block || block.kind !== 'paragraph') return false;
  const paragraph = block.paragraph;
  paragraph.runs.push({ text: '', mergeRule: rule });
  if (paragraph.xmlNode) {
    paragraph.xmlNode.children.push(rule.kind === 'next'
      ? fieldNode('NEXT', '')
      : fieldNode(
        `IF ${rule.field ?? ''} ${rule.operator ?? '='} "${rule.value ?? ''}" "${rule.trueText ?? ''}" "${rule.falseText ?? ''}"`,
        rule.trueText ?? '',
      ));
  }
  return true;
}

export function mergeFieldValue(state: MailMergeState, field: string, recordIndex: number | null): string {
  if (recordIndex === null || recordIndex < 0 || recordIndex >= state.recipients.length) return `«${field}»`;
  return state.recipients[recordIndex][field] ?? '';
}

export function ruleResult(rule: MergeRule, state: MailMergeState, recordIndex: number | null): string {
  if (rule.kind === 'next') return '';
  if (recordIndex === null) return rule.trueText ?? '';
  const actual = state.recipients[recordIndex]?.[rule.field ?? ''] ?? '';
  const expected = rule.value ?? '';
  const left = Number(actual);
  const right = Number(expected);
  const numeric = Number.isFinite(left) && Number.isFinite(right);
  let match = false;
  switch (rule.operator ?? '=') {
    case '=': match = actual === expected; break;
    case '<>': match = actual !== expected; break;
    case '>': match = numeric ? left > right : actual > expected; break;
    case '<': match = numeric ? left < right : actual < expected; break;
    case '>=': match = numeric ? left >= right : actual >= expected; break;
    case '<=': match = numeric ? left <= right : actual <= expected; break;
  }
  return match ? (rule.trueText ?? '') : (rule.falseText ?? '');
}

export function checkMergeErrors(document: WordDocument, state: MailMergeState): string[] {
  const errors: string[] = [];
  if (!state.recipients.length) errors.push('NO_RECIPIENTS');
  const fields = new Set(state.fields);
  const used = new Set<string>();
  for (const block of document.blocks) {
    if (block.kind === 'paragraph') {
      for (const run of block.paragraph.runs) {
        if (run.mergeField) used.add(run.mergeField);
        if (run.mergeRule?.kind === 'if' && run.mergeRule.field) used.add(run.mergeRule.field);
      }
    }
  }
  for (const field of used) {
    if (!fields.has(field)) errors.push(`MISSING_FIELD:${field}`);
  }
  return errors;
}

function cloneNode(node: XmlNode): XmlNode {
  return {
    name: node.name,
    attrs: { ...node.attrs },
    text: node.text,
    children: node.children.map(cloneNode),
  };
}

function blockNode(block: WordBlock): XmlNode | null {
  return block.kind === 'paragraph' ? block.paragraph.xmlNode ?? null : block.xmlNode ?? null;
}

interface MergeCursor {
  recordIndex: number;
}

function cursorRecord(state: MailMergeState, cursor: MergeCursor): MergeRecipient {
  return state.recipients[cursor.recordIndex] ?? {};
}

/**
 * Fill field results in document order. The cursor advances on NEXT fields so a
 * field that follows NEXT inside the same block is filled from the next record.
 */
function setFieldResults(node: XmlNode, state: MailMergeState, cursor: MergeCursor): void {
  const applySimpleField = (current: XmlNode): boolean => {
    if (current.name !== 'w:fldSimple') return false;
    const instruction = attr(current, 'w:instr') ?? '';
    if (/^\s*NEXT\b/i.test(instruction)) {
      cursor.recordIndex += 1;
      for (const text of descendants(current, 'w:t')) text.text = '';
      return true;
    }
    const merge = /^\s*MERGEFIELD\s+(?:"([^"]+)"|(\S+))/i.exec(instruction);
    if (!merge) return false;
    const field = (merge[1] ?? merge[2]).trim();
    const text = descendants(current, 'w:t')[0];
    if (text) text.text = cursorRecord(state, cursor)[field] ?? '';
    return true;
  };
  if (applySimpleField(node)) return;
  let field: { kind: 'merge' | 'next' | 'other'; name?: string; collecting: boolean; filled: boolean } | null = null;
  const walk = (current: XmlNode): void => {
    if (applySimpleField(current)) return;
    if (current.name === 'w:fldChar') {
      const type = attr(current, 'w:fldCharType');
      if (type === 'begin') field = { kind: 'other', collecting: false, filled: false };
      else if (type === 'separate' && field) field.collecting = true;
      else if (type === 'end') {
        if (field?.kind === 'next') cursor.recordIndex += 1;
        field = null;
      }
      return;
    }
    if (field && current.name === 'w:instrText') {
      const merge = /^\s*MERGEFIELD\s+(?:"([^"]+)"|(\S+))/i.exec(current.text);
      if (merge) {
        field.kind = 'merge';
        field.name = (merge[1] ?? merge[2]).trim();
      } else if (/^\s*NEXT\b/i.test(current.text)) {
        field.kind = 'next';
      }
      return;
    }
    if (field?.collecting && current.name === 'w:t' && field.kind === 'merge' && field.name) {
      current.text = field.filled ? '' : (cursorRecord(state, cursor)[field.name] ?? '');
      field.filled = true;
      return;
    }
    if (field?.collecting && current.name === 'w:t' && field.kind === 'next') {
      current.text = '';
      return;
    }
    for (const child of current.children) walk(child);
  };
  walk(node);
}

function mergedRun(run: WordRun, state: MailMergeState, cursor: MergeCursor): WordRun {
  if (run.mergeField) {
    return { ...run, text: cursorRecord(state, cursor)[run.mergeField] ?? '', mergeField: undefined };
  }
  if (run.mergeRule) {
    if (run.mergeRule.kind === 'next') {
      cursor.recordIndex += 1;
      return { ...run, text: '', mergeRule: undefined };
    }
    return { ...run, text: ruleResult(run.mergeRule, state, cursor.recordIndex), mergeRule: undefined };
  }
  return run;
}

function mergedParagraph(paragraph: WordParagraph, state: MailMergeState, cursor: MergeCursor): WordParagraph {
  return {
    ...paragraph,
    runs: paragraph.runs.map((run) => mergedRun(run, state, cursor)),
  };
}

function mergedNested(
  items: WordNestedTable[] | undefined,
  state: MailMergeState,
  cursor: MergeCursor,
): WordNestedTable[] | undefined {
  if (!items?.length) return items;
  return items.map((item) => ({
    ...item,
    rows: item.rows.map((row) => row.map((cell) => cell.map((paragraph) =>
      mergedParagraph(paragraph, state, cursor)))),
    nested: mergedNested(item.nested, state, cursor),
  }));
}

function mergedBlock(block: WordBlock, state: MailMergeState, cursor: MergeCursor, node: XmlNode): WordBlock {
  if (block.kind === 'paragraph') {
    return { kind: 'paragraph', paragraph: { ...mergedParagraph(block.paragraph, state, cursor), xmlNode: node } };
  }
  return {
    kind: 'table',
    xmlNode: node,
    rows: block.rows.map((row) => row.map((cell) => cell.map((paragraph) =>
      mergedParagraph(paragraph, state, cursor)))),
    nested: mergedNested(block.nested, state, cursor),
    grid: block.grid,
    tableWidthPx: block.tableWidthPx,
    colWidthsPx: block.colWidthsPx,
  };
}

function pageBreakBlock(): WordBlock {
  return { kind: 'paragraph', paragraph: { runs: [{ text: '', pageBreak: true }] } };
}

function pageBreakNode(): XmlNode {
  return {
    name: 'w:p', attrs: {}, text: '',
    children: [{ name: 'w:r', attrs: {}, text: '', children: [{ name: 'w:br', attrs: { 'w:type': 'page' }, text: '', children: [] }] }],
  };
}

export function finishMerge(document: WordDocument, state: MailMergeState): number {
  const root = document.xmlRoot ? findChild(document.xmlRoot, 'w:document') ?? document.xmlRoot : null;
  const body = root ? findChild(root, 'w:body') : null;
  if (!body) return 0;
  const selected = state.selected.length ? state.selected : state.recipients.map((_, index) => index);
  if (!selected.length) return 0;
  const sectPr = findChild(body, 'w:sectPr');
  const sourceBlocks = [...document.blocks];
  const nodes: XmlNode[] = [];
  const blocks: WordBlock[] = [];
  let start = 0;
  let pass = 0;
  while (start < selected.length) {
    if (pass > 0) {
      nodes.push(pageBreakNode());
      blocks.push(pageBreakBlock());
    }
    let pointer = start;
    let lastUsed = start;
    for (const block of sourceBlocks) {
      if (pointer >= selected.length) break;
      const source = blockNode(block);
      if (!source) continue;
      const clone = cloneNode(source);
      const xmlCursor: MergeCursor = { recordIndex: pointer };
      setFieldResults(clone, state, xmlCursor);
      const modelCursor: MergeCursor = { recordIndex: pointer };
      const merged = mergedBlock(block, state, modelCursor, clone);
      nodes.push(clone);
      blocks.push(merged);
      pointer = Math.max(pointer, xmlCursor.recordIndex, modelCursor.recordIndex);
      lastUsed = Math.max(lastUsed, pointer);
    }
    const nextStart = Math.min(selected.length, lastUsed + 1);
    start = nextStart > start ? nextStart : start + 1;
    pass++;
  }
  body.children = sectPr ? [...nodes, sectPr] : nodes;
  document.blocks = blocks.length ? blocks : [{ kind: 'paragraph', paragraph: { runs: [] } }];
  return selected.length;
}

/** Labels grid: one table row per label, merge fields inserted in each cell. */
export function insertLabels(
  document: WordDocument,
  columns: number,
  rows: number,
  field: string,
): WordBlock | null {
  const width = Math.max(1, Math.min(6, Math.round(columns)));
  const height = Math.max(1, Math.min(20, Math.round(rows)));
  const root = document.xmlRoot ? findChild(document.xmlRoot, 'w:document') ?? document.xmlRoot : null;
  const body = root ? findChild(root, 'w:body') : null;
  if (!body) return null;
  const cellNode = (): XmlNode => ({
    name: 'w:tc', attrs: {}, text: '',
    children: [{
      name: 'w:p', attrs: {}, text: '', children: [fieldNode(`MERGEFIELD ${field}`, `«${field}»`)],
    }],
  });
  const table: XmlNode = {
    name: 'w:tbl', attrs: {}, text: '', children: Array.from({ length: height }, () => ({
      name: 'w:tr', attrs: {}, text: '',
      children: Array.from({ length: width }, () => cellNode()),
    })),
  };
  const sectPr = findChild(body, 'w:sectPr');
  const index = sectPr ? body.children.indexOf(sectPr) : body.children.length;
  body.children.splice(index, 0, table);
  const rowsModel = Array.from({ length: height }, () => Array.from({ length: width }, () => [{
    runs: [{ text: `«${field}»`, mergeField: field }],
  } as WordParagraph]));
  const block: WordBlock = { kind: 'table', rows: rowsModel, xmlNode: table };
  document.blocks.push(block);
  return block;
}

export function mergeFieldList(document: WordDocument): string[] {
  const fields = new Set<string>();
  for (const block of document.blocks) {
    if (block.kind !== 'paragraph') continue;
    for (const run of block.paragraph.runs) {
      if (run.mergeField) fields.add(run.mergeField);
      if (run.mergeRule?.field) fields.add(run.mergeRule.field);
    }
  }
  return [...fields];
}

export function unusedFieldWarning(state: MailMergeState): string[] {
  if (!state.recipients.length) return [];
  const missing = new Set<string>();
  for (const field of state.fields) {
    if (state.recipients.every((record) => !record[field])) missing.add(field);
  }
  return [...missing];
}
