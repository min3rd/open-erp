import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9267;
const url = process.argv[2] ?? 'http://localhost:4349';
const userData = path.join(process.env.TEMP ?? '.', 'edge-cell-lines');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
const child = spawn(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`, '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore' });
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
const targetPage = await pageTarget();
const socket = new WebSocket(targetPage.webSocketDebuggerUrl);
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
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject); });
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++counter; pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(2000);
const drop = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/sample-real-proposal.docx');
  const file = new File([await response.arrayBuffer()], 'sample-real-proposal.docx');
  const transfer = new DataTransfer(); transfer.items.add(file);
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
  for (let i = 0; i < 160; i++) { if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break; await wait(250); }
  await wait(500);
  const buckets = new Map();
  for (const table of document.querySelectorAll('table.op-word-table[data-block]')) {
    const block = Number(table.getAttribute('data-block'));
    if (!Number.isFinite(block)) continue;
    const bucket = buckets.get(block) ?? { block, rows: [] };
    if (bucket.rows.length >= 40) continue;
    for (const tr of table.rows) {
      if (bucket.rows.length >= 40) break;
      const cells = [];
      for (const td of tr.cells) {
        const lines = [];
        for (const p of td.querySelectorAll(':scope > p')) {
          const text = p.innerText ?? '';
          if (!text.length) continue;
          const rect = p.getBoundingClientRect();
          const style = getComputedStyle(p);
          const lineHeight = parseFloat(style.lineHeight) || rect.height || 1;
          const lineCount = Math.max(1, Math.round(rect.height / lineHeight));
          const height = rect.height / lineCount;
          for (let i = 0; i < lineCount; i++) {
            lines.push({ start: Math.round((i * text.length) / lineCount), end: Math.round(((i + 1) * text.length) / lineCount), height });
          }
        }
        cells.push({ lines, paddingTop: 0, paddingBottom: 6 });
      }
      bucket.rows.push(cells);
    }
    buckets.set(block, bucket);
  }
  return [...buckets.values()];
})()`;
const evaluated = await send('Runtime.evaluate', { expression: drop, awaitPromise: true, returnByValue: true });
const value = evaluated.result?.value ?? [];
fs.writeFileSync('plugins/office-webapp/web/.tmp/cell-lines.json', JSON.stringify(value));
console.log(JSON.stringify({ tables: value.length, rows: value.map((t) => t.rows.length), chars: value.map((t) => t.rows.reduce((sum, r) => sum + r.reduce((s, c) => s + c.lines.length, 0), 0)) }));
socket.close();
child.kill();
process.exit(0);
