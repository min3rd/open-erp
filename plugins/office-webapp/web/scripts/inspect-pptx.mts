import fs from 'node:fs';
import { parsePptx } from '../src/app/core/office/pptx.ts';

const bytes = fs.readFileSync(process.argv[2]);
const ppt = await parsePptx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
console.log(JSON.stringify({
  slides: ppt.slides.length,
  firstShape: ppt.slides[0]?.shapes[0]?.text,
  secondShape: ppt.slides[0]?.shapes[1]?.text,
}));
