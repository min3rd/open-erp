import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { descendants } from '../src/app/core/binary/xml.ts';

const bytes = fs.readFileSync(process.argv[2]);
const word = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const runs = word.blocks.flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : []);
const paragraphs = word.blocks.filter((block) => block.kind === 'paragraph').map((block) =>
  block.kind === 'paragraph' ? block.paragraph.runs.map((run) => run.text).join('') : '');
console.log(JSON.stringify({
  paragraphs,
  links: runs.filter((run) => run.link).map((run) => ({ text: run.text, link: run.link })),
  videos: runs.filter((run) => run.videoUrl).map((run) => run.videoUrl),
  xml: {
    hyperlinks: descendants(word.xmlRoot!, 'w:hyperlink').length,
    webVideo: descendants(word.xmlRoot!, 'wp15:webVideoPr').map((node) => node.attrs),
    rels: word.packageEntries?.get('word/_rels/document.xml.rels')
      ? new TextDecoder().decode(word.packageEntries.get('word/_rels/document.xml.rels')).includes('openai.com')
      : false,
  },
}, null, 2));
