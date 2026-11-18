import { findChild, serializeXml } from '../binary/xml';
import { readZip, writeZip, type ZipWriteEntry } from '../binary/zip';
import type { ExcelDocument } from './types';
import { analysisPart, type SavedTable } from './xlsx-analysis';

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
const TABLE_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml';

export async function saveXlsx(doc: ExcelDocument, original: ArrayBuffer): Promise<Uint8Array> {
  const zip = await readZip(original);
  let entries = zip.order.map((name) => ({ name, data: zip.entries.get(name) ?? new Uint8Array() }));
  for (const name of ['xl/_rels/workbook.xml.rels', '[Content_Types].xml']) {
    const bytes = doc.packageEntries?.get(name);
    if (!bytes) continue;
    const entry = entries.find((item) => item.name === name);
    if (entry) entry.data = bytes;
    else entries.push({ name, data: bytes });
  }
  for (const name of ['xl/styles.xml', 'xl/sharedStrings.xml']) {
    const bytes = doc.packageEntries?.get(name);
    if (!bytes) continue;
    const entry = entries.find((item) => item.name === name);
    if (entry) entry.data = bytes;
    else entries.push({ name, data: bytes });
  }
  if (doc.workbookRoot) {
    const root = findChild(doc.workbookRoot, 'workbook') ?? doc.workbookRoot;
    const data = new TextEncoder().encode(XML_DECL + serializeXml(root));
    const entry = entries.find((item) => item.name === 'xl/workbook.xml');
    if (entry) entry.data = data;
    else entries.push({ name: 'xl/workbook.xml', data });
  }
  for (const [name, bytes] of doc.packageEntries ?? []) {
    if (/^xl\/comments\d*\.xml$/.test(name) || /^xl\/drawings\/vmlDrawing\d*\.vml$/.test(name)
      || /^xl\/worksheets\/_rels\/.*\.rels$/.test(name)) {
      const entry = entries.find((item) => item.name === name);
      if (entry) entry.data = bytes;
      else entries.push({ name, data: bytes });
    }
  }
  const tables = doc.analysis?.tables ?? [];
  if (tables.length) {
    entries = entries.filter((entry) => !/^xl\/tables\/table\d+\.xml$/.test(entry.name));
    writeTableParts(doc, entries, tables);
  }
  for (const sheet of doc.sheets) {
    if (!sheet.path || !sheet.xmlRoot) continue;
    const data = new TextEncoder().encode(XML_DECL + serializeXml(sheet.xmlRoot));
    const entry = entries.find((item) => item.name === sheet.path);
    if (entry) entry.data = data;
    else entries.push({ name: sheet.path, data });
  }
  const analysis = analysisPart(doc);
  if (analysis) {
    const entry = entries.find((item) => item.name === analysis.name);
    if (entry) entry.data = new TextEncoder().encode(analysis.data);
    else entries.push({ name: analysis.name, data: new TextEncoder().encode(analysis.data) });
  }
  return writeZip(entries);
}

function writeTableParts(doc: ExcelDocument, entries: ZipWriteEntry[], tables: SavedTable[]): void {
  const sheet = doc.sheets[0];
  if (!sheet?.xmlRoot) return;
  if (!sheet.xmlRoot.attrs['xmlns:r']) {
    sheet.xmlRoot.attrs['xmlns:r'] = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  }
  sheet.xmlRoot.children = sheet.xmlRoot.children.filter((child) => child.name !== 'tableParts');
  const parts = tables.map((table, index) => ({
    id: index + 1,
    relId: `rIdTable${index + 1}`,
    name: uniqueTableName(table.name, index, tables),
  }));
  const node = {
    name: 'tableParts',
    attrs: { count: String(tables.length) },
    text: '',
    children: parts.map((part) => ({
      name: 'tablePart', attrs: { 'r:id': part.relId }, text: '', children: [],
    })),
  };
  const anchor = sheet.xmlRoot.children.findIndex((child) => child.name === 'extLst');
  if (anchor < 0) sheet.xmlRoot.children.push(node);
  else sheet.xmlRoot.children.splice(anchor, 0, node);

  const sheetFile = sheet.path?.split('/').pop() ?? 'sheet1.xml';
  const relsPath = `xl/worksheets/_rels/${sheetFile}.rels`;
  const relsEntry = entries.find((entry) => entry.name === relsPath);
  let rels = relsEntry
    ? new TextDecoder('utf-8').decode(relsEntry.data)
    : `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;
  rels = rels.replace(/<Relationship[^>]*Type="[^"]*\/table"[^>]*\/>/g, '');
  for (const part of parts) {
    rels = rels.replace('</Relationships>',
      `<Relationship Id="${part.relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table${part.id}.xml"/></Relationships>`);
  }
  const relsData = new TextEncoder().encode(rels);
  if (relsEntry) relsEntry.data = relsData;
  else entries.push({ name: relsPath, data: relsData });

  for (const [index, table] of tables.entries()) {
    const part = parts[index];
    const xml = nativeTableXml(table, part.id, part.name);
    const path = `xl/tables/table${part.id}.xml`;
    const entry = entries.find((item) => item.name === path);
    if (entry) entry.data = new TextEncoder().encode(xml);
    else entries.push({ name: path, data: new TextEncoder().encode(xml) });
  }

  const typesName = '[Content_Types].xml';
  let typesEntry = entries.find((entry) => entry.name === typesName);
  if (!typesEntry) {
    typesEntry = {
      name: typesName,
      data: new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`
        + `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">`
        + `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`
        + `<Default Extension="xml" ContentType="application/xml"/>`
        + `</Types>`),
    };
    entries.push(typesEntry);
  }
  {
    let types = new TextDecoder('utf-8').decode(typesEntry.data);
    if (!types.includes('Extension="rels"')) {
      types = types.includes('</Types>')
        ? types.replace('</Types>', `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/></Types>`)
        : `${types}<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>`;
    }
    for (const part of parts) {
      const partName = `/xl/tables/table${part.id}.xml`;
      if (!types.includes(`PartName="${partName}"`)) {
        types = types.includes('</Types>')
          ? types.replace('</Types>', `<Override PartName="${partName}" ContentType="${TABLE_CONTENT_TYPE}"/></Types>`)
          : `${types}<Override PartName="${partName}" ContentType="${TABLE_CONTENT_TYPE}"/>`;
      }
    }
    typesEntry.data = new TextEncoder().encode(types);
  }
}

function nativeTableXml(table: SavedTable, id: number, name: string): string {
  const ref = table.source.replace(/\$/g, '');
  const columns = table.columns.map((column, index) =>
    `<tableColumn id="${index + 1}" name="${escapeAttr(column || `Column${index + 1}`)}"/>`).join('');
  return `${XML_DECL}<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"`
    + ` id="${id}" name="${escapeAttr(name)}" displayName="${escapeAttr(name)}" ref="${escapeAttr(ref)}" totalsRowShown="0">`
    + `<autoFilter ref="${escapeAttr(ref)}"/>`
    + `<tableColumns count="${table.columns.length}">${columns}</tableColumns>`
    + `<tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" showRowStripes="1" showColumnStripes="0"/>`
    + `</table>`;
}

function uniqueTableName(value: string, index: number, tables: SavedTable[]): string {
  let name = (value || `Table${index + 1}`).replace(/[^A-Za-z0-9_]/g, '_');
  if (!/^[A-Za-z_]/.test(name)) name = `Table_${name}`;
  const used = new Set(tables.slice(0, index).map((table) => table.name.replace(/[^A-Za-z0-9_]/g, '_')));
  let candidate = name;
  let counter = 2;
  while (used.has(candidate)) candidate = `${name}_${counter++}`;
  return candidate;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function saveCsv(doc: ExcelDocument): Uint8Array {
  const sheet = doc.sheets[0];
  if (!sheet) return new Uint8Array();
  const rows: string[][] = [];
  for (let row = 1; row <= Math.max(sheet.maxRow, 1); row++) {
    const values: string[] = [];
    for (let col = 1; col <= Math.max(sheet.maxCol, 1); col++) {
      const ref = `${columnName(col)}${row}`;
      values.push(sheet.cells.get(ref)?.value ?? '');
    }
    rows.push(values);
  }
  const text = rows.map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  return new TextEncoder().encode(`\ufeff${text}`);
}

function escapeCsv(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function columnName(value: number): string {
  let column = '';
  let current = value;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
}
