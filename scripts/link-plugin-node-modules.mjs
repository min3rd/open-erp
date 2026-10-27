import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve('src/frontend/web/node_modules');
const link = path.resolve('plugins/catalog/web/node_modules');

if (!fs.existsSync(target)) {
  console.error('Missing src/frontend/web/node_modules; run npm install first.');
  process.exit(1);
}
if (!fs.existsSync(link)) {
  fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  console.log('Linked plugins/catalog/web/node_modules -> src/frontend/web/node_modules');
}
