import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9263;
const base = process.argv[2] ?? 'http://localhost:4349';
const userData = path.join(process.env.TEMP ?? '.', 'edge-greedy-search');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
const child = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`,
  '--window-size=1440,1000', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pageTarget() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* not ready */ }
    await sleep(400);
  }
  throw new Error('EDGE_CDP_NOT_READY');
}

const target = await pageTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
let counter = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message.result);
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

const configs = [];
for (const contentOffset of [0, 2, 4, 6, 8, 10, 12, 16, 20, 24]) configs.push({ contentOffset, metricScale: 0.99 });
for (const metricScale of [0.985, 0.995, 1]) configs.push({ contentOffset: 0, metricScale });
const results = [];
for (const config of configs) {
  const url = `${base}/?target=0&metricScale=${config.metricScale}&contentOffset=${config.contentOffset}`;
  await send('Page.navigate', { url });
  await sleep(1800);
  const drop = `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const response = await fetch('/samples/sample-real-proposal.docx');
    const file = new File([await response.arrayBuffer()], 'sample-real-proposal.docx');
    const transfer = new DataTransfer();
    transfer.items.add(file);
    document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
    for (let i = 0; i < 160; i++) { if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break; await wait(250); }
    await wait(500);
    return document.querySelectorAll('.op-word-page').length;
  })()`;
  const evaluated = await send('Runtime.evaluate', { expression: drop, awaitPromise: true, returnByValue: true });
  results.push({ ...config, pages: evaluated.result?.value ?? null });
  console.log(JSON.stringify(results[results.length - 1]));
  if (results[results.length - 1].pages === 546) {
    console.log('FOUND 546');
    break;
  }
}
fs.writeFileSync('plugins/office-webapp/web/.tmp/greedy-search.json', JSON.stringify(results, null, 2));
socket.close();
child.kill();
process.exit(0);
