import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = Number(process.argv[2] ?? 9227);
const url = process.argv[3] ?? 'http://127.0.0.1:4352/';
const shotPath = process.argv[4] ?? 'plugins/office-webapp/web/.tmp/word-merged-cells.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-qa-merge');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* profile may be locked */ }

const child = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', '--disable-features=msEdgeFirstRunExperience',
  `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`, '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function pageTarget() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await response.json();
      const page = list.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* browser not ready */ }
    await sleep(500);
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
  if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params?.exceptionDetails?.exception?.description ?? 'exception');
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
    errors.push((message.params.args ?? []).map((arg) => arg.value ?? arg.description ?? '').join(' '));
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
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? 'eval failed');
  return result.result?.value;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(2200);

const load = (fileName) => evaluate(`(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  let host = document.querySelector('.op-start');
  for (let attempt = 0; attempt < 40 && !host; attempt++) { await wait(250); host = document.querySelector('.op-start'); }
  host = host ?? document.querySelector('.op-workspace');
  if (!host) return { pages: -1, reason: 'no drop target' };
  const response = await fetch('/samples/${fileName}');
  const file = new File([await response.arrayBuffer()], '${fileName}');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  host.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  await wait(3600);
  return { pages: document.querySelectorAll('.op-word-page').length };
})()`);

await load('sample-merged-cells.docx');

const structure = () => evaluate(`(() => {
  const table = document.querySelector('.op-word-page table.op-word-table');
  if (!table) return null;
  return {
    rows: [...table.querySelectorAll('tr')].map((row) => [...row.querySelectorAll('td')].map((cell) => ({
      text: cell.innerText.replace(/\\s+/g, ' ').trim(),
      colspan: cell.getAttribute('colspan'),
      rowspan: cell.getAttribute('rowspan'),
      cell: cell.getAttribute('data-cell'),
    }))),
  };
})()`);
const before = await structure();

const point = (row, cell) => evaluate(`(() => {
  const element = document.querySelector('.op-word-page table.op-word-table tr[data-row="${row}"] td[data-cell="${cell}"]');
  if (!element) return null;
  const box = element.getBoundingClientRect();
  return { x: box.left + box.width / 2, y: box.top + Math.min(box.height / 2, 20) };
})()`);

const start = await point(0, 0);
const end = await point(0, 1);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: start.x, y: start.y, button: 'left', buttons: 1, clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: (start.x + end.x) / 2, y: start.y, button: 'left', buttons: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: end.x, y: end.y, button: 'left', buttons: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: end.x, y: end.y, button: 'left', buttons: 0, clickCount: 1 });
await sleep(300);

const selected = await evaluate(`(() => ({
  selected: document.querySelectorAll('.op-word-cell-selected').length,
  tabs: [...document.querySelectorAll('.op-tab')].map((tab) => tab.textContent.trim()),
}))()`);

const clickTab = (label) => evaluate(`(() => {
  const tab = [...document.querySelectorAll('.op-tab')].find((item) => item.textContent.trim() === '${label}');
  if (!tab) return false;
  tab.click();
  return true;
})()`);
await clickTab('Bảng') || await clickTab('Table');
await sleep(500);

const ribbonTitles = await evaluate(`[...document.querySelectorAll('.op-rb')].map((button) => button.title)`);

const clickRibbon = (title) => evaluate(`(() => {
  const button = [...document.querySelectorAll('.op-rb')].find((item) => item.title === '${title}');
  if (!button) return false;
  button.click();
  return true;
})()`);

const merged = await clickRibbon('Gộp ô') || await clickRibbon('Merge Cells');
await sleep(600);
const afterMerge = await structure();

const splitOpened = await clickRibbon('Tách ô') || await clickRibbon('Split Cells');
await sleep(400);
const panel = await evaluate(`(() => {
  const apply = [...document.querySelectorAll('aside .op-text-btn')].find((button) => /^(Tách|Split)$/.test(button.textContent.trim()));
  if (!apply) return null;
  apply.click();
  return true;
})()`);
await sleep(700);
const afterSplit = await structure();

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(shotPath), { recursive: true });
fs.writeFileSync(shotPath, Buffer.from(shot.data, 'base64'));

await send('Page.navigate', { url });
await sleep(2600);
const real = await load('sample-real-proposal.docx');const realMerges = await evaluate(`(() => ({
  pages: document.querySelectorAll('.op-word-page').length,
  rowspans: [...document.querySelectorAll('.op-word-page table.op-word-table td[rowspan]')].map((cell) => cell.getAttribute('rowspan')),
  colspans: [...document.querySelectorAll('.op-word-page table.op-word-table td[colspan]')].map((cell) => cell.getAttribute('colspan')),
  rows: [...document.querySelectorAll('.op-word-page table.op-word-table tr[data-row]')].length,
}))()`);

console.log(JSON.stringify({
  before, selected, merged, afterMerge, splitOpened, panel, afterSplit, real, realMerges,
  errors: errors.slice(0, 8),
}, null, 2));

socket.close();
child.kill();
process.exit(0);
