import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9271;
const query = process.argv[2] ?? '';
const url = `http://127.0.0.1:4399/index.html${query ? '?' + query : ''}`;
const userData = path.join(process.env.TEMP ?? '.', 'edge-word-fill');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
const child = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`,
  '--window-size=1440,1000', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function pageTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
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
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(2000);
const evaluated = await send('Runtime.evaluate', {
  expression: `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const response = await fetch('/samples/sample-real-proposal.docx');
    const transfer = new DataTransfer();
    transfer.items.add(new File([await response.arrayBuffer()], 'sample-real-proposal.docx'));
    document.querySelector('.op-start').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    for (let i = 0; i < 160; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
    for (let i = 0; i < 240; i++) { if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break; await wait(250); }
    await wait(800);
    return [...document.querySelectorAll('.op-word-page')].map((page, index) => {
      const style = getComputedStyle(page);
      const top = page.getBoundingClientRect().top + parseFloat(style.paddingTop);
      const bottom = page.getBoundingClientRect().bottom - parseFloat(style.paddingBottom);
      let last = top;
      for (const child of page.children) {
        if (child.matches('.op-word-header,.op-word-footer,.op-word-notes,.op-word-page-number,.op-word-ink,.op-word-watermark')) continue;
        last = Math.max(last, child.getBoundingClientRect().bottom);
      }
      return { page: index + 1, fill: Number(((last - top) / (bottom - top)).toFixed(3)), gap: Math.round(bottom - last) };
    });
  })()`,
  awaitPromise: true,
  returnByValue: true,
});
const pages = evaluated.result?.value ?? [];
const gaps = pages.map((entry) => entry.gap).sort((a, b) => a - b);
const fill = pages.map((entry) => entry.fill).sort((a, b) => a - b);
const q = (values, p) => values[Math.min(values.length - 1, Math.floor(values.length * p))];
console.log(JSON.stringify({
  pages: pages.length,
  fill: { p10: q(fill, 0.1), median: q(fill, 0.5), p90: q(fill, 0.9), min: fill[0] },
  gap: { p10: q(gaps, 0.1), median: q(gaps, 0.5), p90: q(gaps, 0.9), max: gaps[gaps.length - 1] },
  emptyPages: pages.filter((entry) => entry.gap > 700).map((entry) => entry.page).slice(0, 20),
}, null, 2));
fs.writeFileSync('.tmp/word-page-fill.json', JSON.stringify(pages, null, 2));
socket.close();
child.kill();
process.exit(0);
