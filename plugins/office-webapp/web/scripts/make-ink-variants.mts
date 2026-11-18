import fs from 'node:fs';
import { readZip, writeZip } from '../src/app/core/binary/zip.ts';

const source = process.argv[2];
const bytes = fs.readFileSync(source);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const zip = await readZip(buffer);
const decode = (name: string) => new TextDecoder().decode(zip.entries.get(name) ?? new Uint8Array());
const encode = (value: string) => new TextEncoder().encode(value);

const documentXml = decode('word/document.xml');
const rels = decode('word/_rels/document.xml.rels');
const types = decode('[Content_Types].xml');
const ink = decode('word/ink/ink1.xml');
const anchor = '<w:r><w:contentPart r:id="rIdInk"></w:contentPart></w:r>';
if (!documentXml.includes(anchor)) throw new Error('anchor not found');

const entries = [...zip.entries.entries()].map(([name, data]) => ({ name, data }));
const withEntry = (name: string, data: Uint8Array | null) => {
  const index = entries.findIndex((entry) => entry.name === name);
  if (!data) {
    if (index >= 0) entries.splice(index, 1);
  } else if (index >= 0) entries[index] = { name, data };
  else entries.push({ name, data });
};

const write = async (name: string, list = entries) => {
  const output = await writeZip(list.map((entry) => ({ name: entry.name, data: entry.data })));
  fs.writeFileSync(`plugins/office-webapp/web/samples/${name}`, Buffer.from(output));
  console.log('wrote', name, output.length);
};

// A: ink part + relationship + content type, but no w:contentPart anchor.
{
  const list = entries.map((entry) => entry.name === 'word/document.xml'
    ? { name: entry.name, data: encode(documentXml.replace(anchor, '')) }
    : entry);
  await write('ink-no-anchor.docx', list);
}

// B: anchor + wiring, but the InkML body is Microsoft's own sample trace.
{
  const microsoft = fs.readFileSync('plugins/office-webapp/web/.tmp/ink1-sample.xml');
  const list = entries.map((entry) => entry.name === 'word/ink/ink1.xml'
    ? { name: entry.name, data: microsoft }
    : entry);
  await write('ink-ms-sample.docx', list);
}

// C: plain round-trip (no ink part, no relationship, no content type, no anchor/bookmark).
{
  const list = entries
    .filter((entry) => entry.name !== 'word/ink/ink1.xml')
    .map((entry) => {
      if (entry.name === 'word/document.xml') {
        let xml = documentXml.replace(anchor, '');
        xml = xml.replace(/<w:bookmarkStart w:id="9000" w:name="_InkStrokes"><\/w:bookmarkStart><w:bookmarkEnd w:id="9000"><\/w:bookmarkEnd>/, '');
        return { name: entry.name, data: encode(xml) };
      }
      if (entry.name === 'word/_rels/document.xml.rels') {
        return { name: entry.name, data: encode(rels.replace(/<Relationship Id="rIdInk"[^>]*\/>/, '')) };
      }
      if (entry.name === '[Content_Types].xml') {
        return { name: entry.name, data: encode(types.replace(/<Override PartName="\/word\/ink\/ink1\.xml"[^>]*\/>/, '')) };
      }
      return entry;
    });
  await write('ink-stripped.docx', list);
}

// D: keep everything, but the relationship target is relative to word/ without "..".
{
  const list = entries.map((entry) => entry.name === 'word/_rels/document.xml.rels'
    ? { name: entry.name, data: encode(rels.replace('Target="../word/ink/ink1.xml"', 'Target="ink/ink1.xml"')) }
    : entry);
  await write('ink-relative-target.docx', list);
}

console.log('ink part bytes', ink.length);
