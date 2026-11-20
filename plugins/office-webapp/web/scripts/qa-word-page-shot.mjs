/**
 * Screenshots of the rendered Word pages, one PNG per page, for visual parity
 * evidence against Word's own layout.
 *
 *   node scripts/qa-word-page-shot.mjs <sample.docx> <out-dir> [page,page,...]
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [sample = 'sample-layout.docx', outDir = '.tmp/shots', list = '1,2,27', queryArg = ''] = process.argv.slice(2);
const pages = list.split(',').map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0);
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9311;
const userData = path.join(process.env.TEMP ?? '.', 'edge-word-shots');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
fs.mkdirSync(outDir, { recursive: true });
const child = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`,
  '--window-size=1440,1200', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function pageTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const found = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json())
        .find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
      if (found) return found;
    } catch { /* wait */ }
    await sleep(400);
  }
  throw new Error('EDGE_CDP_NOT_READY');
}
const socket = new WebSocket((await pageTarget()).webSocketDebuggerUrl);
let counter = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
  }
});
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve);
  socket.addEventListener('error', reject);
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++counter;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `http://127.0.0.1:4399/index.html${queryArg ? `?${queryArg}` : ''}` });
await sleep(2200);
const loaded = await send('Runtime.evaluate', {
  expression: `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const response = await fetch('/samples/${sample}');
    const transfer = new DataTransfer();
    transfer.items.add(new File([await response.arrayBuffer()], '${sample}'));
    document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    for (let i = 0; i < 200; i++) { if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break; await wait(250); }
    await wait(600);
    return document.querySelectorAll('.op-word-page').length;
  })()`,
  awaitPromise: true,
  returnByValue: true,
});
console.log('pages rendered:', loaded.result?.value);
for (const index of pages) {
  const box = await send('Runtime.evaluate', {
    expression: `(() => {
      const page = document.querySelectorAll('.op-word-page')[${index - 1}];
      if (!page) return null;
      page.scrollIntoView({ block: 'start' });
      const rect = page.getBoundingClientRect();
      return { x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height };
    })()`,
    returnByValue: true,
  });
  const rect = box.result?.value;
  if (!rect) {
    console.log('page missing', index);
    continue;
  }
  await sleep(400);
  const shot = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
    clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 },
  });
  const file = path.join(outDir, `page-${String(index).padStart(3, '0')}.png`);
  fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
  console.log('wrote', file, `${Math.round(rect.width)}x${Math.round(rect.height)}`);
}
socket.close();
child.kill();
process.exit(0);
