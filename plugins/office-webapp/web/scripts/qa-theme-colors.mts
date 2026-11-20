import fs from 'node:fs';
import { readZip } from '../src/app/core/binary/zip.ts';
import { parseWordTheme } from '../src/app/core/office/word-theme.ts';

const bytes = fs.readFileSync('D:/Projects/open-erp/plugins/office-webapp/web/samples/sample-real-proposal.docx');
const zip = await readZip(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const theme = parseWordTheme(zip.entries);
console.log(JSON.stringify(theme, null, 1));
