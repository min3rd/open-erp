import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { paragraphSegments } from '../src/app/core/office/word-markup.ts';
import { descendants } from '../src/app/core/binary/xml.ts';

const bytes = fs.readFileSync(process.argv[2]);
const word = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const block = word.blocks[1];
console.log(JSON.stringify({
  paragraphText: block.kind === 'paragraph' ? paragraphSegments(block.paragraph, 'all').map((s) => s.text).join('') : null,
  revisions: descendants(word.xmlRoot!, 'w:ins').length + descendants(word.xmlRoot!, 'w:del').length,
  images: descendants(word.xmlRoot!, 'pic:blipFill').length + descendants(word.xmlRoot!, 'a:blip').length,
  imageRun: block.kind === 'paragraph' ? block.paragraph.runs.filter((run) => run.imagePath).map((run) => ({
    path: run.imagePath, width: run.imageWidth, height: run.imageHeight, alt: run.alt,
  })) : [],
  mediaBytes: word.packageEntries?.get('word/media/image1.png')?.length,
}, null, 2));
