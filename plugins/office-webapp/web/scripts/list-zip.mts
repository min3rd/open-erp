import fs from 'node:fs';
import { readZip } from '../src/app/core/binary/zip.ts';

const bytes = fs.readFileSync(process.argv[2]);
const zip = await readZip(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
console.log([...zip.entries.keys()].map((name) => `${name}:${zip.entries.get(name)?.length}`).join('\n'));
