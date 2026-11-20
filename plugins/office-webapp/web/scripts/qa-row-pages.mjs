/**
 * Row-to-page map of a rendered table: for each model row, the first page it
 * appears on. Compare it with Word's own row page starts (Word COM) to see where
 * pagination inside a table diverges.
 *
 *   node scripts/qa-row-pages.mjs <sample.docx> <blockIndex> [out.json]
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [sample = 'sample-real-proposal.docx', blockArg = '392', outFile, queryArg = ''] = process.argv.slice(2);
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9341;
const userData = path.join(process.env.TEMP ?? '.', 'edge-row-pages');
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
await send('Page.navigate', { url: `http://127.0.0.1:4399/index.html${queryArg ? `?${queryArg}` : ''}` });
await sleep(2200);
const result = await send('Runtime.evaluate', {
  expression: `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const response = await fetch('/samples/${sample}');
    const transfer = new DataTransfer();
    transfer.items.add(new File([await response.arrayBuffer()], '${sample}'));
    document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    for (let i = 0; i < 200; i++) { if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break; await wait(250); }
    // A late signal (e.g. a calibration file) can re-paginate after settling:
    // wait until the page list stops changing.
    let stable = 0;
    let last = -1;
    for (let i = 0; i < 40 && stable < 3; i++) {
      const count = document.querySelectorAll('.op-word-page').length;
      stable = count === last ? stable + 1 : 0;
      last = count;
      await wait(200);
    }
    await wait(300);
    const pages = [...document.querySelectorAll('.op-word-page')];
    const rows = new Map();
    pages.forEach((page, pageIndex) => {
      for (const row of page.querySelectorAll('table.op-word-table[data-block="${blockArg}"] tr[data-row]')) {
        const index = Number(row.getAttribute('data-row'));
        if (!Number.isFinite(index)) continue;
        const entry = rows.get(index) ?? { first: pageIndex + 1, pages: [], height: 0, cells: [] };
        if (!entry.pages.includes(pageIndex + 1)) entry.pages.push(pageIndex + 1);
        entry.height += row.getBoundingClientRect().height;
        const fragmentCells = [...row.cells].map((cell) => [...cell.querySelectorAll(':scope > p')].reduce((sum, paragraph) => {
          const range = document.createRange();
          range.selectNodeContents(paragraph);
          const tops = new Set([...range.getClientRects()]
            .filter((rect) => rect.height > 0.5 && rect.width > 0.5)
            .map((rect) => Math.round(rect.top)));
          return sum + Math.max(1, tops.size);
        }, 0));
        entry.cells = (entry.cells.length ? entry.cells : fragmentCells.map(() => 0))
          .map((value, cellIndex) => value + (fragmentCells[cellIndex] ?? 0));
        rows.set(index, entry);
      }
    });
    return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([row, value]) => ({
      row, first: value.first, pages: value.pages, height: Math.round(value.height), lines: value.cells,
    }));
  })()`,
  awaitPromise: true,
  returnByValue: true,
});
const rows = result.result?.value ?? [];
console.log(JSON.stringify(rows.slice(0, 20), null, 1));
if (outFile) fs.writeFileSync(outFile, JSON.stringify(rows, null, 2));
socket.close();
child.kill();
process.exit(0);
