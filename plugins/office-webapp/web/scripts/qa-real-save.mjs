import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9227;
const url = process.argv[2] ?? 'http://localhost:4348';
const sample = process.argv[3] ?? 'sample-real-proposal.docx';
const downloadPath = process.argv[4] ?? path.join(process.env.TEMP ?? '.', 'opencode', 'real-downloads');
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-save');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
try { fs.rmSync(downloadPath, { recursive: true, force: true }); } catch { /* locked */ }
fs.mkdirSync(downloadPath, { recursive: true });

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
await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(2000);

const action = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/${sample}');
  const file = new File([await response.arrayBuffer()], '${sample}');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  document.querySelector('.op-start').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) {
    if (document.querySelector('.op-word-page')) break;
    await wait(250);
  }
  await wait(2500);
  const target = [...document.querySelectorAll('.op-word-p')].find((node) => node.innerText.trim().length > 8);
  const before = target?.innerText;
  if (target) {
    target.focus();
    target.innerText = target.innerText + ' [edited]';
    target.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
  }
  await wait(1200);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }));
  await wait(4000);
  return { before, after: target?.innerText, state: document.querySelector('.op-save-state')?.textContent, error: document.querySelector('.op-error')?.innerText ?? null };
})()`;
const evaluated = await send('Runtime.evaluate', { expression: action, awaitPromise: true, returnByValue: true });
console.log('action', JSON.stringify(evaluated.result?.value, null, 2));

for (let i = 0; i < 40; i++) {
  const files = fs.readdirSync(downloadPath).filter((name) => name.endsWith('.docx'));
  if (files.length) {
    const file = path.join(downloadPath, files[0]);
    console.log('downloaded', file, fs.statSync(file).size);
    break;
  }
  await sleep(500);
}
socket.close();
child.kill();
process.exit(0);
