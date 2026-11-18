import { attr, descendants, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import type { ExcelDocument } from './types';
import type { PivotConfig } from './pivot';
import type { ChartConfig } from './chart';

export interface SavedPivotConfig extends PivotConfig {
  id: string;
  title?: string;
}

export interface SavedChartConfig extends ChartConfig {
  id: string;
}

export interface SavedTable {
  id: string;
  name: string;
  source: string;
  columns: string[];
}

export interface SavedSlicer {
  id: string;
  tableId: string;
  column: string;
  selected: string[];
}

export interface ExcelAnalysis {
  pivots: SavedPivotConfig[];
  charts: SavedChartConfig[];
  tables: SavedTable[];
  slicers: SavedSlicer[];
}

const ANALYSIS_NS = 'http://open-erp.local/office/analysis';
const REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const REL_TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml';
const PART_PATH = 'customXml/analysis.xml';

export function parseExcelAnalysis(entries: Map<string, Uint8Array>, document: ExcelDocument): ExcelAnalysis {
  const nativeTables = parseNativeTables(entries);
  const empty: ExcelAnalysis = { pivots: [], charts: [], tables: nativeTables, slicers: [] };
  const path = analysisPath(entries);
  if (!path) return empty;
  const bytes = entries.get(path);
  if (!bytes) return empty;
  const root = findChild(parseXml(new TextDecoder('utf-8').decode(bytes)), 'analysis:workbook');
  if (!root) return empty;
  document.analysisRoot = root;
  document.analysisPath = path;
  const json = textOf(findChild(root, 'analysis:json'));
  try {
    const parsed = JSON.parse(json) as Partial<ExcelAnalysis>;
    return {
      pivots: Array.isArray(parsed.pivots) ? parsed.pivots : [],
      charts: Array.isArray(parsed.charts) ? parsed.charts : [],
      tables: mergeTables(Array.isArray(parsed.tables) ? parsed.tables : [], nativeTables),
      slicers: Array.isArray(parsed.slicers) ? parsed.slicers : [],
    };
  } catch {
    return empty;
  }
}

export function parseNativeTables(entries: Map<string, Uint8Array>): SavedTable[] {
  const tables: SavedTable[] = [];
  const names = [...entries.keys()].filter((name) => /^xl\/tables\/table\d+\.xml$/.test(name)).sort();
  for (const name of names) {
    const bytes = entries.get(name);
    if (!bytes) continue;
    const root = parseXml(new TextDecoder('utf-8').decode(bytes));
    const table = findChild(root, 'table') ?? root;
    const source = (attr(table, 'ref') ?? '').replace(/\$/g, '');
    const display = attr(table, 'displayName') ?? attr(table, 'name') ?? name;
    if (!source) continue;
    tables.push({
      id: `table-${display}`,
      name: display,
      source,
      columns: findChildren(table, 'tableColumn').map((column) => attr(column, 'name') ?? ''),
    });
  }
  return tables;
}

function mergeTables(saved: SavedTable[], native: SavedTable[]): SavedTable[] {
  const merged = [...saved];
  for (const table of native) {
    if (!merged.some((item) => item.name === table.name || item.source === table.source)) merged.push(table);
  }
  return merged;
}

export function saveAnalysis(document: ExcelDocument, analysis: ExcelAnalysis): void {
  const root = ensureRoot(document);
  const json = escapeXml(JSON.stringify(analysis));
  root.children = [{ name: 'analysis:json', attrs: {}, text: json, children: [] }];
}

export function upsertPivot(document: ExcelDocument, analysis: ExcelAnalysis, config: SavedPivotConfig): void {
  const index = analysis.pivots.findIndex((item) => item.id === config.id);
  if (index >= 0) analysis.pivots[index] = config;
  else analysis.pivots.push(config);
  saveAnalysis(document, analysis);
}

export function upsertChart(document: ExcelDocument, analysis: ExcelAnalysis, config: SavedChartConfig): void {
  const index = analysis.charts.findIndex((item) => item.id === config.id);
  if (index >= 0) analysis.charts[index] = config;
  else analysis.charts.push(config);
  saveAnalysis(document, analysis);
}

export function removePivot(document: ExcelDocument, analysis: ExcelAnalysis, id: string): void {
  analysis.pivots = analysis.pivots.filter((item) => item.id !== id);
  saveAnalysis(document, analysis);
}

export function removeChart(document: ExcelDocument, analysis: ExcelAnalysis, id: string): void {
  analysis.charts = analysis.charts.filter((item) => item.id !== id);
  saveAnalysis(document, analysis);
}

export function analysisPart(document: ExcelDocument): { name: string; data: string } | null {
  if (!document.analysisRoot) return null;
  return {
    name: document.analysisPath ?? PART_PATH,
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>${serialize(document.analysisRoot)}`,
  };
}

function ensureRoot(document: ExcelDocument): XmlNode {
  if (document.analysisRoot) return document.analysisRoot;
  const root: XmlNode = { name: 'analysis:workbook', attrs: { 'xmlns:analysis': ANALYSIS_NS }, text: '', children: [] };
  document.analysisRoot = root;
  document.analysisPath = PART_PATH;
  addRelationship(document.packageEntries, 'rIdAnalysis', REL_TYPE, '../customXml/analysis.xml');
  addContentType(document.packageEntries, '/customXml/analysis.xml', 'application/xml');
  return root;
}

function analysisPath(entries: Map<string, Uint8Array>): string | null {
  const bytes = entries.get('xl/_rels/workbook.xml.rels');
  if (bytes) {
    const root = parseXml(new TextDecoder('utf-8').decode(bytes));
    for (const rel of descendants(root, 'Relationship')) {
      const target = attr(rel, 'Target') ?? '';
      if (target.endsWith('customXml/analysis.xml')) return target.replace(/^\.\.\//, '').replace(/^\.\//, '');
    }
  }
  return entries.has(PART_PATH) ? PART_PATH : null;
}

function addRelationship(entries: Map<string, Uint8Array> | undefined, id: string, type: string, target: string): void {
  if (!entries) return;
  const bytes = entries.get('xl/_rels/workbook.xml.rels');
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const rel = `<Relationship Id="${id}" Type="${type}" Target="${target}"/>`;
  let xml = bytes ? new TextDecoder('utf-8').decode(bytes) : `${declaration}<Relationships xmlns="${REL_NS}"></Relationships>`;
  if (!xml.includes(`Id="${id}"`)) xml = xml.replace('</Relationships>', `${rel}</Relationships>`);
  entries.set('xl/_rels/workbook.xml.rels', new TextEncoder().encode(xml));
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

function serialize(node: XmlNode): string {
  if (node.name === '#document') return node.children.map(serialize).join('');
  const attrs = Object.entries(node.attrs).map(([key, value]) => ` ${key}="${escapeAttr(value)}"`).join('');
  const body = `${escapeXml(node.text)}${node.children.map(serialize).join('')}`;
  return `<${node.name}${attrs}>${body}</${node.name}>`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return escapeXml(value).replace(/"/g, '&quot;');
}
