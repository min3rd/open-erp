import { serializeXml } from '../binary/xml';
import { readZip, writeZip } from '../binary/zip';
import type { PptDocument } from './types';

const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

export async function savePptx(doc: PptDocument, original: ArrayBuffer): Promise<Uint8Array> {
  const zip = await readZip(original);
  let entries = zip.order.map((name) => ({ name, data: zip.entries.get(name) ?? new Uint8Array() }));
  entries = entries.filter((entry) => !doc.removedParts?.has(entry.name));
  for (const slide of doc.slides) {
    if (!slide.path || !slide.xmlRoot) continue;
    const data = new TextEncoder().encode(XML_DECL + serializeXml(slide.xmlRoot));
    const entry = entries.find((item) => item.name === slide.path);
    if (entry) entry.data = data;
    else entries.push({ name: slide.path, data });
    for (const shape of slide.shapes) {
      if (!shape.diagramPath || !shape.diagramRoot) continue;
      const diagram = new TextEncoder().encode(XML_DECL + serializeXml(shape.diagramRoot));
      const target = entries.find((item) => item.name === shape.diagramPath);
      if (target) target.data = diagram;
      else entries.push({ name: shape.diagramPath, data: diagram });
    }
  }
  if (doc.presentationRoot) {
    const data = new TextEncoder().encode(XML_DECL + serializeXml(doc.presentationRoot));
    const entry = entries.find((item) => item.name === 'ppt/presentation.xml');
    if (entry) entry.data = data;
    else entries.push({ name: 'ppt/presentation.xml', data });
  }
  for (const [name, bytes] of doc.packageEntries ?? []) {
    if (/^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(name)
      || /^ppt\/comments\/comment\d+\.xml$/.test(name)
      || name === 'ppt/commentAuthors.xml'
      || /^ppt\/slides\/_rels\/.*\.rels$/.test(name)
      || name === 'ppt/_rels/presentation.xml.rels'
      || name === '[Content_Types].xml') {
      const entry = entries.find((item) => item.name === name);
      if (entry) entry.data = bytes;
      else entries.push({ name, data: bytes });
    }
  }
  return writeZip(entries);
}
