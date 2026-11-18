import fs from 'node:fs';
import { readZip } from '../src/app/core/binary/zip.ts';
import { parseDocx } from '../src/app/core/office/docx.ts';

const path = process.argv[2];
if (!path) throw new Error('usage: inspect-ink-save.mts <docx>');
const bytes = fs.readFileSync(path);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
const zip = await readZip(buffer);
const part = zip.entries.get('word/ink/ink1.xml');
const partText = part ? new TextDecoder().decode(part) : '';
const rels = zip.entries.get('word/_rels/document.xml.rels');
const relsText = rels ? new TextDecoder().decode(rels) : '';
const types = zip.entries.get('[Content_Types].xml');
const typesText = types ? new TextDecoder().decode(types) : '';
const documentXml = new TextDecoder().decode(zip.entries.get('word/document.xml') ?? new Uint8Array());
const doc = await parseDocx(buffer);
const strokes = doc.inkStrokes ?? [];
const traceTexts = [...partText.matchAll(/<inkml:trace\b[^>]*>([^<]*)<\/inkml:trace>/g)].map((match) => match[1]);
console.log(JSON.stringify({
  bytes: bytes.length,
  inkPart: Boolean(part),
  inkPartLength: partText.length,
  inkmlNamespace: partText.includes('http://www.w3.org/2003/InkML'),
  contexts: (partText.match(/<inkml:context\b/g) ?? []).length,
  traceFormatChannels: [...partText.matchAll(/<inkml:channel ([^>]*)>/g)].map((match) => match[1]),
  brushes: [...partText.matchAll(/<inkml:brush xml:id="([^"]+)"/g)].map((match) => match[1]),
  brushColors: [...partText.matchAll(/name="color" value="([^"]+)"/g)].map((match) => match[1]),
  traceGroups: [...partText.matchAll(/<inkml:traceGroup xml:id="([^"]+)"/g)].map((match) => match[1]),
  traceElements: traceTexts.length,
  tupleCounts: traceTexts.map((text) => text.split(',').length),
  firstTuple: traceTexts[0]?.split(',')[0] ?? null,
  relInkml: relsText.includes('word/ink/ink1.xml') && relsText.includes('relationships/customXml'),
  contentType: typesText.includes('application/inkml+xml'),
  contentParts: (documentXml.match(/<w:contentPart\b/g) ?? []).length,
  inkContentParts: (documentXml.match(/<w14:contentPart\b/g) ?? []).length,
  alternateContent: documentXml.includes('mc:AlternateContent'),
  inkGraphicData: documentXml.includes('uri="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"'),
  anchoredDrawing: documentXml.includes('<wp:anchor'),
  contentPartInRun: /<w:r[^>]*><mc:AlternateContent/.test(documentXml),
  inkBookmark: /w:name="_InkStrokes"/.test(documentXml),
  parsedStrokes: strokes.length,
  parsedPoints: strokes[0]?.points.length ?? 0,
  parsedPressure: strokes[0]?.points.map((point) => point.pressure ?? null) ?? [],
}, null, 2));
