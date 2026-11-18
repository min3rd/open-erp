import fs from 'node:fs';
import { parsePptx } from '../src/app/core/office/pptx.ts';

const bytes = fs.readFileSync(process.argv[2]);
const ppt = await parsePptx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
console.log(JSON.stringify({
  slides: ppt.slides.map((slide) => ({
    index: slide.index,
    transition: slide.transition ?? null,
    animations: slide.animations ?? [],
    shapes: slide.shapes.map((shape) => `${shape.kind ?? 'text'}:${shape.text.slice(0, 30)}`),
  })),
}, null, 2));
