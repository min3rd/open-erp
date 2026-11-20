import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9377;
const userData = path.join(process.env.TEMP ?? '.', 'edge-block541');
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
await send('Page.navigate', { url: 'http://127.0.0.1:4399/index.html' });
await sleep(2200);
const expression = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/sample-real-proposal.docx');
  const transfer = new DataTransfer();
  transfer.items.add(new File([await response.arrayBuffer()], 'sample-real-proposal.docx'));
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 400; i++) { if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break; await wait(250); }
  await wait(400);
  const table = document.querySelector('table[data-block="541"]');
  if (!table) return { error: 'no table' };
  return [...table.rows].slice(0, 3).map((row) => [...row.cells].map((cell) => {
    const paragraph = cell.querySelector(':scope > p');
    const style = paragraph ? getComputedStyle(paragraph) : null;
    return {
      cell: cell.getAttribute('data-cell'),
      width: Math.round(cell.getBoundingClientRect().width),
      font: style?.font,
      lineHeight: style?.lineHeight,
      text: (paragraph?.textContent ?? '').slice(0, 24),
    };
  }));
})()`;
const evaluated = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
console.log(JSON.stringify(evaluated.result?.value, null, 1));
socket.close();
child.kill();
process.exit(0);
