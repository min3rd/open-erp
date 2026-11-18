import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9239;
const url = process.argv[2] ?? 'http://localhost:4349';
const out = process.argv[3] ?? 'plugins/office-webapp/web/.tmp/pagination-twice.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-pagination-twice');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }

const child = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', '--disable-features=msEdgeFirstRunExperience',
  `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`, '--window-size=1440,1000', 'about:blank',
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
await sleep(2200);

const runOnce = async (label) => {
  await send('Page.navigate', { url });
  await sleep(1800);
  const drop = `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const response = await fetch('/samples/sample-real-proposal.docx');
    const file = new File([await response.arrayBuffer()], 'sample-real-proposal.docx');
    const transfer = new DataTransfer();
    transfer.items.add(file);
    document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    await wait(400);
  })()`;
  await send('Runtime.evaluate', { expression: drop, awaitPromise: true, returnByValue: true });
  const started = Date.now();
  let settled = false;
  let history = [];
  for (let tick = 0; tick < 80; tick++) {
    const probe = await send('Runtime.evaluate', {
      expression: `(() => ({
        pages: document.querySelectorAll('.op-word-page').length,
        tables: document.querySelectorAll('.op-word-table').length,
        measured: document.querySelector('.op-word-stage')?.getAttribute('data-measured') ?? null,
        settled: document.querySelector('.op-word-stage')?.getAttribute('data-settled') ?? null,
        attempts: document.querySelector('.op-word-stage')?.getAttribute('data-measure-attempts') ?? null,
        status: document.querySelector('.op-statusbar')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
      }))()`,
      returnByValue: true,
    });
    const value = probe.result?.value;
    if (tick < 16) history.push({ t: Date.now() - started, ...value });
    if (value?.settled === 'true') {
      settled = true;
      break;
    }
    await sleep(250);
  }
  await sleep(500);
  const finalProbe = await send('Runtime.evaluate', {
    expression: `(() => ({
      pages: document.querySelectorAll('.op-word-page').length,
      tables: document.querySelectorAll('.op-word-table').length,
      settled: document.querySelector('.op-word-stage')?.getAttribute('data-settled') ?? null,
      status: document.querySelector('.op-statusbar')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    }))()`,
    returnByValue: true,
  });
  return { label, settled, settleMs: Date.now() - started, history, final: finalProbe.result?.value };
};

const first = await runOnce('first');
const second = await runOnce('second');
console.log('first', JSON.stringify(first, null, 2));
console.log('second', JSON.stringify(second, null, 2));
const ok = first.settled && second.settled
  && first.final.pages === second.final.pages
  && first.final.tables === second.final.tables;
console.log('bothSettled', first.settled && second.settled);
console.log('equalPageCount', first.final.pages === second.final.pages);
console.log('equalTableCount', first.final.tables === second.final.tables);
console.log('deterministic', ok);
console.log('exceptions', JSON.stringify(exceptions));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(ok ? 0 : 1);
