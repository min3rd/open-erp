import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = Number(process.argv[2] ?? 9230);
const url = process.argv[3] ?? 'http://127.0.0.1:4352/';
const out = process.argv[4] ?? 'docs/sprints/sprint_12_office_webapp/08_testing/evidence/word-merged-cells.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-qa-merge-shot');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* ignore */ }
const child = spawn(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', '--no-default-browser-check', '--disable-features=msEdgeFirstRunExperience',
  `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`, '--window-size=1440,940', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let page = null;
for (let attempt = 0; attempt < 60 && !page; attempt++) {
  try {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    page = list.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
  } catch { /* not ready */ }
  if (!page) await sleep(500);
}
const socket = new WebSocket(page.webSocketDebuggerUrl);
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
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject); });
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++counter;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 940, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(2600);

await send('Runtime.evaluate', {
  expression: `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    let host = document.querySelector('.op-start');
    for (let attempt = 0; attempt < 40 && !host; attempt++) { await wait(250); host = document.querySelector('.op-start'); }
    const response = await fetch('/samples/sample-merged-cells.docx');
    const file = new File([await response.arrayBuffer()], 'sample-merged-cells.docx');
    const transfer = new DataTransfer();
    transfer.items.add(file);
    host.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    await wait(3600);
    const cell = document.querySelector('.op-word-page table.op-word-table td[data-cell="0"]');
    cell?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wait(400);
    const tab = [...document.querySelectorAll('.op-tab')].find((item) => item.textContent.trim() === 'Bảng');
    tab?.click();
    await wait(600);
    document.querySelector('.op-workspace')?.scrollTo(0, 0);
    return true;
  })()`,
  awaitPromise: true,
  returnByValue: true,
});
await sleep(500);
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(0);
