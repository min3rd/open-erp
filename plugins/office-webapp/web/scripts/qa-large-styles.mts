import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';

const base = 'D:/Projects/open-erp/plugins/office-webapp/web';
const bytes = fs.readFileSync(`${base}/samples/word-authored-large.docx`);
const doc = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const styles = new TextDecoder('utf-8').decode(doc.packageEntries.get('word/styles.xml'));
const docDefaults = styles.slice(styles.indexOf('<w:docDefaults'), styles.indexOf('</w:docDefaults>'));
console.log('docDefaults:', docDefaults.replace(/\s+/g, ' ').slice(0, 400));
const normalIndex = styles.indexOf('w:styleId="Normal"');
console.log('Normal:', styles.slice(normalIndex - 40, normalIndex + 400).replace(/\s+/g, ' '));
const documentXml = new TextDecoder('utf-8').decode(doc.packageEntries.get('word/document.xml'));
const firstRun = documentXml.indexOf('<w:r>');
console.log('first run rPr:', documentXml.slice(firstRun, firstRun + 220).replace(/\s+/g, ' '));
