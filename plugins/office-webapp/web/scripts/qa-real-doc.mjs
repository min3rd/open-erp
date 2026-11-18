import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9226;
const url = process.argv[2] ?? 'http://localhost:4348';
const sample = process.argv[3] ?? 'sample-real-proposal.docx';
const out = process.argv[4] ?? 'plugins/office-webapp/web/.tmp/real-doc.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-real');
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
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await response.json();
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
const exceptions = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') {
    exceptions.push(message.params?.exceptionDetails?.text ?? 'exception');
  }
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
await send('Page.navigate', { url });
await sleep(2000);

const drop = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const started = performance.now();
  const response = await fetch('/samples/${sample}');
  const buffer = await response.arrayBuffer();
  const file = new File([buffer], '${sample}');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  document.querySelector('.op-start').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) {
    if (document.querySelector('.op-word-page')) break;
    await wait(250);
  }
  await wait(2500);
  const page = document.querySelector('.op-word-page');
  const paragraphs = document.querySelectorAll('.op-word-p').length;
  const tables = document.querySelectorAll('.op-word-table').length;
  const rows = document.querySelectorAll('.op-word-table tbody tr').length;
  const images = document.querySelectorAll('img.op-word-image').length;
  return {
    loadMs: Math.round(performance.now() - started),
    fileBytes: buffer.byteLength,
    paragraphs,
    tables,
    rows,
    images,
    domNodes: document.querySelectorAll('*').length,
    scrollHeight: page?.scrollHeight ?? 0,
    status: document.querySelector('.op-statusbar')?.innerText.replace(/\\s+/g, ' ').trim(),
    error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    firstText: [...document.querySelectorAll('.op-word-p')].slice(0, 3).map((node) => node.innerText.trim()),
    lastText: [...document.querySelectorAll('.op-word-p')].slice(-3).map((node) => node.innerText.trim()),
  };
})()`;
const evaluated = await send('Runtime.evaluate', { expression: drop, awaitPromise: true, returnByValue: true });
console.log('metrics', JSON.stringify(evaluated.result?.value, null, 2));
console.log('exceptions', JSON.stringify(exceptions));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(0);
