import fs from 'node:fs';
import { parsePptx } from '../src/app/core/office/pptx.ts';

const bytes = fs.readFileSync(process.argv[2]);
const ppt = await parsePptx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const slide = ppt.slides[0];
const smart = slide.shapes.find((shape) => shape.kind === 'smartart');
const video = slide.shapes.find((shape) => shape.kind === 'video');
const audio = slide.shapes.find((shape) => shape.kind === 'audio');
console.log(JSON.stringify({
  shapes: slide.shapes.map((shape) => `${shape.kind}:${shape.text.slice(0, 40)}`),
  smartart: smart ? {
    text: smart.text,
    diagramPath: smart.diagramPath,
    nodes: smart.smartArtNodes?.map((node) => node.text),
    diagramBytes: ppt.packageEntries?.get(smart.diagramPath ?? '')?.length,
  } : null,
  video: video ? {
    mediaPath: video.mediaPath,
    bytes: ppt.packageEntries?.get(video.mediaPath ?? '')?.length,
  } : null,
  audio: audio ? {
    mediaPath: audio.mediaPath,
    bytes: ppt.packageEntries?.get(audio.mediaPath ?? '')?.length,
  } : null,
}, null, 2));
