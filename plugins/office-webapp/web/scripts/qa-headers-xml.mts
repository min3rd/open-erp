import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const bytes = fs.readFileSync('samples/sample-real-proposal.docx');
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const parts = [...doc.packageEntries.keys()].filter((name) => /header|footer/.test(name));
console.log('header/footer parts:', parts.join(', '));
for (const name of parts) {
  const xml = new TextDecoder('utf-8').decode(doc.packageEntries.get(name));
  const text = (xml.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) ?? [])
    .map((match) => match.replace(/<[^>]+>/g, ''))
    .join(' | ')
    .slice(0, 120);
  const hasImage = xml.includes('<w:drawing') || xml.includes('<w:pict');
  console.log(`${name}: chars=${xml.length} image=${hasImage} text="${text}"`);
}
console.log('sections:', JSON.stringify(doc.sections?.map((section, index) => ({
  index,
  start: section.startBlock,
  headerRefs: Object.keys(section.headerReferences ?? {}).length,
})), null, 1));
