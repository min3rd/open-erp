/**
 * Imports Word's built-in table style definitions from a real Word document
 * (`w:style w:type="table"` in word/styles.xml) plus the parts the app renderer
 * needs: header/band fills, header text colour, border edges and emphasis.
 *
 *   npx tsx scripts/import-stock-table-styles.mts <docx> [outFile]
 *
 * The XML is copied verbatim so a saved document keeps Word's own definition.
 */
import fs from 'node:fs';
import { readZip } from '../src/app/core/binary/zip.ts';
import { findChild, findChildren, parseXml, serializeXml, type XmlNode } from '../src/app/core/binary/xml.ts';

const source = process.argv[2] ?? 'D:/Projects/open-erp/plugins/office-webapp/web/.tmp/word-stock-table-all.docx';
const target = process.argv[3]
  ?? 'D:/Projects/open-erp/plugins/office-webapp/web/src/app/core/office/word-table-stock.ts';

interface ThemeFill {
  theme?: string;
  hex?: string;
  tint?: string;
  shade?: string;
}

interface StyleMeta {
  name: string;
  header?: ThemeFill;
  band?: ThemeFill;
  whole?: ThemeFill;
  headerText?: ThemeFill;
  headerBold: boolean;
  firstColBold: boolean;
  lastRowBold: boolean;
  edges: Record<string, string>;
  edgeFill?: ThemeFill;
  borderSz?: string;
}

const themeFill = (node: XmlNode | null): ThemeFill | undefined => {
  if (!node) return undefined;
  const attrs = node.attrs;
  if (!attrs['w:fill'] && !attrs['w:themeFill']) return undefined;
  return {
    ...(attrs['w:themeFill'] ? { theme: attrs['w:themeFill'] } : {}),
    ...(attrs['w:fill'] ? { hex: attrs['w:fill'].toUpperCase() } : {}),
    ...(attrs['w:themeFillTint'] ? { tint: attrs['w:themeFillTint'] } : {}),
    ...(attrs['w:themeFillShade'] ? { shade: attrs['w:themeFillShade'] } : {}),
  };
};

const colorFill = (node: XmlNode | null): ThemeFill | undefined => {
  if (!node) return undefined;
  const attrs = node.attrs;
  return {
    ...(attrs['w:themeColor'] ? { theme: attrs['w:themeColor'] } : {}),
    ...(attrs['w:val'] ? { hex: attrs['w:val'].toUpperCase() } : {}),
    ...(attrs['w:themeTint'] ? { tint: attrs['w:themeTint'] } : {}),
    ...(attrs['w:themeShade'] ? { shade: attrs['w:themeShade'] } : {}),
  };
};

const stylePr = (style: XmlNode, type: string): XmlNode | null =>
  findChildren(style, 'w:tblStylePr').find((node) => node.attrs['w:type'] === type) ?? null;

const boldOf = (node: XmlNode | null): boolean => {
  const rPr = node ? findChild(node, 'w:rPr') : null;
  return Boolean(rPr && findChild(rPr, 'w:b'));
};

const bytes = new Uint8Array(fs.readFileSync(source));
const entries = (await readZip(bytes)).entries;
const root = parseXml(new TextDecoder('utf-8').decode(entries.get('word/styles.xml')!));
const stylesRoot = findChild(root, 'w:styles') ?? root;

const styles: Record<string, string> = {};
const meta: Record<string, StyleMeta> = {};

for (const style of findChildren(stylesRoot, 'w:style')) {
  if (style.attrs['w:type'] !== 'table') continue;
  const id = style.attrs['w:styleId'];
  if (!id || id === 'TableNormal') continue;
  const name = findChild(style, 'w:name')?.attrs['w:val'] ?? id;
  const tblPr = findChild(style, 'w:tblPr');
  const borders = tblPr ? findChild(tblPr, 'w:tblBorders') : null;
  const edges: Record<string, string> = {};
  let edgeFill: ThemeFill | undefined;
  let borderSz: string | undefined;
  for (const edge of ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']) {
    const node = borders ? findChild(borders, `w:${edge}`) : null;
    if (!node) continue;
    edges[edge] = node.attrs['w:val'] ?? 'nil';
    if (!edgeFill && node.attrs['w:val'] && node.attrs['w:val'] !== 'nil') {
      edgeFill = colorFill(node);
      borderSz = node.attrs['w:sz'];
    }
  }
  const firstRow = stylePr(style, 'firstRow');
  const band = stylePr(style, 'band1Horz') ?? stylePr(style, 'band1Vert');
  const lastRow = stylePr(style, 'lastRow');
  const firstCol = stylePr(style, 'firstCol');
  const tcPr = findChild(style, 'w:tcPr');
  const whole = tcPr ? themeFill(findChild(tcPr, 'w:shd')) : undefined;
  const header = firstRow ? themeFill(findChild(findChild(firstRow, 'w:tcPr') ?? firstRow, 'w:shd')) : undefined;
  const bandFill = band ? themeFill(findChild(findChild(band, 'w:tcPr') ?? band, 'w:shd')) : undefined;
  const headerText = firstRow ? colorFill(findChild(findChild(firstRow, 'w:rPr') ?? firstRow, 'w:color')) : undefined;

  styles[id] = serializeXml(style);
  meta[id] = {
    name,
    ...(header ? { header } : {}),
    ...(bandFill ? { band: bandFill } : {}),
    ...(whole ? { whole } : {}),
    ...(headerText ? { headerText } : {}),
    headerBold: boldOf(firstRow),
    firstColBold: boldOf(firstCol),
    lastRowBold: boldOf(lastRow),
    edges,
    ...(edgeFill ? { edgeFill } : {}),
    ...(borderSz ? { borderSz } : {}),
  };
}

const ids = Object.keys(styles).sort();
const xmlLines = ids.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(styles[id])},`).join('\n');
const metaLines = ids.map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(meta[id])},`).join('\n');

const file = `/**
 * Word's built-in table style definitions, copied verbatim from a real Word 16
 * document (\`w:style\` entries of \`word/styles.xml\`). Saving a table with one of
 * these styles writes Word's own definition (real borders, banding and literal
 * colours alongside \`w:themeColor\`), so the file reopens in Word unchanged.
 *
 * Generated by scripts/import-stock-table-styles.mts — do not edit by hand.
 */
export interface StockThemeFill {
  theme?: string;
  hex?: string;
  tint?: string;
  shade?: string;
}

export interface StockTableStyleMeta {
  name: string;
  header?: StockThemeFill;
  band?: StockThemeFill;
  whole?: StockThemeFill;
  headerText?: StockThemeFill;
  headerBold: boolean;
  firstColBold: boolean;
  lastRowBold: boolean;
  edges: Record<string, string>;
  edgeFill?: StockThemeFill;
  borderSz?: string;
}

export const STOCK_TABLE_STYLES: Record<string, string> = {
${xmlLines}
};

export const STOCK_TABLE_STYLE_META: Record<string, StockTableStyleMeta> = {
${metaLines}
};
`;
fs.writeFileSync(target, file);
console.log(`imported ${ids.length} table styles from ${source}`);
console.log(ids.slice(0, 6).join(', '), '...');
