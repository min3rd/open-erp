import fs from 'node:fs';
import path from 'node:path';
import { readZip } from '../src/app/core/binary/zip.ts';
import { parseXml, findChild, descendants } from '../src/app/core/binary/xml.ts';

const folder = 'C:\\Users\\Minh\\Documents\\btc\\Hồ sơ thầu';
const fileName = fs.readdirSync(folder).find((name) => name.endsWith('_v1.0.docx'));
const bytes = fs.readFileSync(path.join(folder, fileName ?? ''));
const zip = await readZip(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const root = parseXml(new TextDecoder().decode(zip.entries.get('word/document.xml')));
const doc = findChild(root, 'w:document') ?? root;
const body = findChild(doc, 'w:body');
const top = (body?.children ?? []).map((child) => child.name);
const sdt = descendants(body, 'w:sdt')[0];
const sdtTables = sdt ? descendants(findChild(sdt, 'w:sdtContent'), 'w:tbl').length : 0;
const nestedTables = descendants(body, 'w:tbl').filter((table) => {
  let parentTable = false;
  const walk = (node: any, insideTable: boolean) => {
    for (const child of node.children) {
      if (child === table && insideTable) parentTable = true;
      walk(child, insideTable || child.name === 'w:tbl');
    }
  };
  walk(body!, false);
  return parentTable;
}).length;
const allTables = descendants(body, 'w:tbl').length;
const blips = [...zip.entries.keys()].filter((name) => name.startsWith('word/media/'));
const headerMedia = [...zip.entries.entries()]
  .filter(([name]) => /header|footer/.test(name) && name.endsWith('.xml'))
  .map(([name, data]) => ({ name, blips: (new TextDecoder().decode(data).match(/r:embed="/g) ?? []).length, size: data.length }));
console.log(JSON.stringify({
  topChildren: top.reduce((map: Record<string, number>, name) => { map[name] = (map[name] ?? 0) + 1; return map; }, {}),
  allTables,
  sdtTables,
  nestedTables,
  media: blips,
  headerMedia,
  documentBlips: descendants(doc, 'a:blip').map((node) => node.attrs['r:embed']),
  rels: [...zip.entries.entries()].filter(([name]) => name === 'word/_rels/document.xml.rels')
    .map(([, data]) => new TextDecoder().decode(data).slice(0, 1200)),
}, null, 2));
