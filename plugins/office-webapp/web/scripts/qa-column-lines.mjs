/**
 * Rendered line count per column of a table for the given page range: the
 * counterpart of the PDF baseline count used to compare Word's line breaking
 * with ours.
 *
 *   node scripts/qa-column-lines.mjs <sample.docx> <blockIndex> <fromPage> <toPage> [out.json]
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [sample = 'sample-real-proposal.docx', blockArg = '396', fromArg = '1', toArg = '5', outFile] = process.argv.slice(2);
const from = Number(fromArg);
const to = Number(toArg);
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9351;
const userData = path.join(process.env.TEMP ?? '.', 'edge-col-lines');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
const child = spawn(edge, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`,
  '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function target() {
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
const socket = new WebSocket((await target()).webSocketDebuggerUrl);
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
await send('Page.navigate', { url: 'http://127.0.0.1:4399/index.html' });
await sleep(2200);
const result = await send('Runtime.evaluate', {
  expression: `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const response = await fetch('/samples/${sample}');
    const transfer = new DataTransfer();
    transfer.items.add(new File([await response.arrayBuffer()], '${sample}'));
    document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    for (let i = 0; i < 200; i++) { if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break; await wait(250); }
    await wait(500);
    const pages = [...document.querySelectorAll('.op-word-page')];
    const lineCount = (element) => {
      let lines = 0;
      for (const paragraph of element.querySelectorAll(':scope > p')) {
        const range = document.createRange();
        range.selectNodeContents(paragraph);
        const tops = new Set([...range.getClientRects()]
          .filter((rect) => rect.height > 0.5 && rect.width > 0.5)
          .map((rect) => Math.round(rect.top)));
        lines += Math.max(1, tops.size);
      }
      return lines;
    };
    const out = {};
    for (let pageIndex = ${from} - 1; pageIndex < Math.min(${to}, pages.length); pageIndex++) {
      const columns = {};
      const rows = pages[pageIndex].querySelectorAll('table[data-block="${blockArg}"] tr[data-row]');
      for (const row of rows) {
        if (row.getAttribute('data-row') === '0') continue;
        for (const cell of row.cells) {
          const column = Number(cell.getAttribute('data-cell'));
          if (!Number.isFinite(column)) continue;
          columns[column] = (columns[column] ?? 0) + lineCount(cell);
        }
      }
      out[pageIndex + 1] = columns;
    }
    return out;
  })()`,
  awaitPromise: true,
  returnByValue: true,
});
const data = result.result?.value ?? {};
console.log(JSON.stringify(data, null, 1));
if (outFile) fs.writeFileSync(outFile, JSON.stringify(data, null, 1));
socket.close();
child.kill();
process.exit(0);
