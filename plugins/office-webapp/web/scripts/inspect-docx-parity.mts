import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { acceptedText } from '../src/app/core/office/word-markup.ts';
import { descendants } from '../src/app/core/binary/xml.ts';

const bytes = fs.readFileSync(process.argv[2]);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const paragraphs = doc.blocks.filter((block) => block.kind === 'paragraph')
  .map((block) => block.kind === 'paragraph' ? acceptedText(block.paragraph) : '').filter(Boolean);
const shapes = doc.blocks
  .flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : [])
  .filter((run) => run.textBox)
  .map((run) => run.textBox);
const media = [...(doc.packageEntries ?? new Map()).entries()]
  .filter(([name]) => name.startsWith('word/media/'))
  .map(([name, data]) => ({ name, bytes: data.length }));
const settings = doc.packageEntries?.get('word/settings.xml');
const styles = doc.packageEntries?.get('word/styles.xml');
const theme = doc.packageEntries?.get('word/theme/theme1.xml');
console.log(JSON.stringify({
  paragraphs,
  shapes,
  media,
  theme: doc.theme,
  styleSet: doc.styleSet,
  protected: doc.protected,
  shading: doc.blocks[0]?.kind === 'paragraph' ? doc.blocks[0].paragraph.shading : null,
  docVars: settings ? [...new TextDecoder().decode(settings).matchAll(/w:name="([^"]+)" w:val="([^"]+)"/g)].map((m) => [m[1], m[2]]) : [],
  documentProtection: settings ? new TextDecoder().decode(settings).includes('documentProtection') : false,
  heading1Size: styles ? /w:styleId="Heading1"[\s\S]*?<w:sz w:val="(\d+)"/.exec(new TextDecoder().decode(styles))?.[1] ?? null : null,
  themeAccent: theme ? /<a:accent1>[\s\S]*?val="([^"]+)"/.exec(new TextDecoder().decode(theme))?.[1] ?? null : null,
  svgCount: descendants(doc.xmlRoot!, 'a:blip').length,
}, null, 2));
