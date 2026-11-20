import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9241;
const query = process.argv[2] ?? '';
const tag = process.argv[3] ?? 'base';
const sampleIndex = process.argv.indexOf('--sample');
const sample = sampleIndex >= 0 ? process.argv[sampleIndex + 1] : 'sample-real-proposal.docx';
const url = `http://127.0.0.1:4399/index.html${query ? '?' + query : ''}`;
const userData = path.join(process.env.TEMP ?? '.', `edge-page-parity-${tag}`);
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
const child = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', '--disable-features=msEdgeFirstRunExperience',
  `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`, '--window-size=1440,1000', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function pageTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* ready */ }
    await sleep(400);
  }
  throw new Error('EDGE_CDP_NOT_READY');
}
const target = await pageTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
let counter = 0;
const pending = new Map();
const errors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params?.exceptionDetails?.text ?? 'exception');
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
await sleep(2200);
for (let i = 0; i < 40; i++) {
  const ready = await send('Runtime.evaluate', { expression: `Boolean(document.querySelector('.op-start'))`, returnByValue: true });
  if (ready.result?.value) break;
  await sleep(500);
}

const action = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/${sample}');
  const file = new File([await response.arrayBuffer()], '${sample}');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  document.querySelector('.op-start').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 160; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
  for (let i = 0; i < 240; i++) {
    if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break;
    await wait(250);
  }
  // A late signal (calibration file, async measure) can re-paginate after
  // settling: wait until the page list stops changing.
  let stable = 0;
  let last = -1;
  for (let i = 0; i < 40 && stable < 3; i++) {
    const count = document.querySelectorAll('.op-word-page').length;
    stable = count === last ? stable + 1 : 0;
    last = count;
    await wait(200);
  }
  await wait(300);
  const pages = [...document.querySelectorAll('.op-word-page')].map((page, index) => {
    const clone = page.cloneNode(true);
    clone.querySelectorAll('.op-word-header,.op-word-footer,.op-word-notes,.op-word-page-number,.op-word-ink,.op-word-watermark,.op-word-float,.op-word-float-block,.op-word-float-inline,.op-word-float-gap').forEach((node) => node.remove());
    clone.querySelectorAll('p,td,th,tr,table,div,li,br').forEach((node) => {
      node.parentNode?.insertBefore(document.createTextNode(' '), node.nextSibling);
    });
    const text = (clone.textContent || '').replace(/\\s+/g, ' ').trim();
    const first = page.querySelector('[data-paragraph],[data-block]');
    return { page: index + 1, start: text.slice(0, 120), text: text.slice(0, 4000), block: first?.getAttribute('data-paragraph') ?? first?.getAttribute('data-block') ?? null };
  });
  return { pages, settled: document.querySelector('.op-word-stage')?.getAttribute('data-settled') ?? null };
})()`;
const evaluated = await send('Runtime.evaluate', { expression: action, awaitPromise: true, returnByValue: true });
if (evaluated.exceptionDetails) console.log('exception', JSON.stringify(evaluated.exceptionDetails).slice(0, 1000));
const result = evaluated.result?.value ?? { pages: [] };
fs.mkdirSync('.tmp', { recursive: true });
fs.writeFileSync(`.tmp/parity-${tag}.json`, JSON.stringify({ query, tag, errors, settled: result.settled, pages: result.pages }, null, 2));
console.log(JSON.stringify({ tag, query, pages: result.pages.length, settled: result.settled, errors: errors.length }));
socket.close();
child.kill();
process.exit(0);
