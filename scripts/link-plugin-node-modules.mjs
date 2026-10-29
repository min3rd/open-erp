import fs from 'node:fs';
import path from 'node:path';

const target = path.resolve('src/frontend/web/node_modules');
if (!fs.existsSync(target)) {
  console.error('Missing src/frontend/web/node_modules; run npm install first.');
  process.exit(1);
}

for (const plugin of ['catalog', 'in-app-notification']) {
  const link = path.resolve(`plugins/${plugin}/web/node_modules`);
  if (fs.existsSync(link)) {
    continue;
  }
  fs.symlinkSync(target, link, process.platform === 'win32' ? 'junction' : 'dir');
  console.log(`Linked plugins/${plugin}/web/node_modules -> src/frontend/web/node_modules`);
}
