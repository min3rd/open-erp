import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9225;
const url = process.argv[2] ?? 'http://localhost:4346/?tab=insert';
const out = process.argv[3] ?? 'plugins/office-webapp/web/.tmp/ribbon.png';
const tabLabel = process.argv[5] ?? 'Chèn';
const tabIndex = Number(process.argv[6] ?? -1);
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-qa');
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
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(2200);

const expr = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await wait(800);
  const response = await fetch('/samples/sample.docx');
  const file = new File([await response.arrayBuffer()], 'sample.docx');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  document.querySelector('.op-start').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  await wait(1400);
  for (let i = 0; i < 3; i++) {
    const ribbon = document.querySelector('.op-ribbon-word');
    if (!ribbon || (!ribbon.classList.contains('op-ribbon-single') && !ribbon.classList.contains('op-ribbon-tabs-only'))) break;
    document.querySelector('.op-tabstrip-right .op-icon-btn')?.click();
    await wait(250);
  }
  const tab = document.querySelectorAll('.op-tab')[${tabIndex >= 0 ? tabIndex : 'null'}]
    ?? [...document.querySelectorAll('.op-tab')].find((item) => item.textContent.trim() === '${tabLabel}');
  return { groups: document.querySelectorAll('.op-rb-group').length, hasTab: !!tab, tabTexts: [...document.querySelectorAll('.op-tab')].map((item) => item.textContent.trim()) };
})()`;
const evaluated = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
console.log('groups', evaluated.result?.value);
if (tabLabel !== 'Trang chủ') {
  const rect = await send('Runtime.evaluate', {
    expression: `(() => {
      const tab = document.querySelectorAll('.op-tab')[${tabIndex >= 0 ? tabIndex : 'null'}]
        ?? [...document.querySelectorAll('.op-tab')].find((item) => item.textContent.trim() === '${tabLabel}');
      if (!tab) return null;
      const box = tab.getBoundingClientRect();
      return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
    })()`,
    returnByValue: true,
  });
  const point = rect.result?.value;
  if (point) {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1 });
    await sleep(700);
  }
}
const mode = process.argv[4] ?? 'classic';
if (mode === 'single') {
  await send('Runtime.evaluate', {
    expression: `(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      document.querySelector('.op-tabstrip-right .op-icon-btn')?.click();
      await wait(400);
      return document.querySelector('.op-ribbon-word')?.className;
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
}
await sleep(400);

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);

socket.close();
child.kill();
process.exit(0);
