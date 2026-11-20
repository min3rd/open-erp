/**
 * Measures how many rendered lines a piece of cell text takes at the real cell
 * text width and at a few neighbouring widths. Used to check our wrap against
 * Word's per-cell line counts.
 *
 *   node scripts/qa-cell-wrap.mjs <sample.docx> <probes.json>
 *
 * probes.json: [{ "label": "row 203 col 3", "text": "...", "width": 97.6, "font": "..." }]
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [sample = 'sample-real-proposal.docx', probesFile] = process.argv.slice(2);
if (!probesFile) {
  console.error('usage: node scripts/qa-cell-wrap.mjs <sample.docx> <probes.json>');
  process.exit(2);
}
const probes = JSON.parse(fs.readFileSync(probesFile, 'utf8'));
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9361;
const userData = path.join(process.env.TEMP ?? '.', 'edge-cell-wrap');
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
const expression = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/${sample}');
  const transfer = new DataTransfer();
  transfer.items.add(new File([await response.arrayBuffer()], '${sample}'));
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 200; i++) { if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break; await wait(250); }
  await wait(400);
  const probes = ${JSON.stringify(probes)};
  const host = document.createElement('div');
  host.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden';
  document.body.appendChild(host);
  const out = [];
  for (const probe of probes) {
    const result = { label: probe.label, target: probe.lines, widths: {} };
    for (const delta of [-3, -2, -1, 0, 1, 2, 3]) {
      const width = probe.width + delta;
      host.innerHTML = '';
      const paragraph = document.createElement('p');
      paragraph.style.cssText = 'margin:0;padding:0;white-space:pre-wrap;'
        + 'font:' + (probe.font || 'normal 400 18.67px "Times New Roman"') + ';'
        + 'line-height:' + (probe.lineHeight || '23.17') + 'px;width:' + width + 'px';
      paragraph.textContent = probe.text;
      host.appendChild(paragraph);
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      const tops = new Set([...range.getClientRects()]
        .filter((rect) => rect.height > 0.5 && rect.width > 0.5)
        .map((rect) => Math.round(rect.top)));
      result.widths[delta] = tops.size;
    }
    out.push(result);
  }
  return out;
})()`;
const evaluated = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
const result = evaluated.result?.value ?? [];
for (const entry of result) console.log(JSON.stringify(entry));
socket.close();
child.kill();
process.exit(0);
