import fs from 'node:fs';
import { parseEmbeddedAnnotations, stripEmbeddedAnnotations } from '../src/app/core/office/pdf-annotations.ts';

const bytes = fs.readFileSync(process.argv[2]);
const annotations = parseEmbeddedAnnotations(bytes);
const stripped = stripEmbeddedAnnotations(bytes);
console.log(JSON.stringify({
  annotations: annotations.map((annotation) => ({
    page: annotation.page,
    type: annotation.type,
    color: annotation.color,
    text: annotation.text ?? null,
    x: Math.round(annotation.x * 1000) / 1000,
    y: Math.round(annotation.y * 1000) / 1000,
  })),
  strippedStartsWithPdf: new TextDecoder('latin1').decode(stripped).startsWith('%PDF-'),
  originalSize: bytes.length,
}, null, 2));
