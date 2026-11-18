import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9232;
const url = process.argv[2] ?? 'http://localhost:4349';
const sample = process.argv[3] ?? 'sample.docx';
const out = process.argv[4] ?? 'plugins/office-webapp/web/.tmp/ribbon-gaps.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-gaps');
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

const action = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/${sample}');
  const file = new File([await response.arrayBuffer()], '${sample}');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  document.querySelector('.op-start').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
  await wait(1600);

  const clickTab = (label) => {
    const tab = [...document.querySelectorAll('.op-tab')].find((item) => item.textContent.trim() === label);
    tab?.click();
    return Boolean(tab);
  };
  const button = (label) => [...document.querySelectorAll('.op-ribbon button')]
    .find((item) => item.title === label || item.textContent.trim() === label);
  const click = (label) => { const item = button(label); item?.click(); return Boolean(item); };
  const state = (label) => { const item = button(label); return item ? { exists: true, disabled: Boolean(item.disabled) } : { exists: false, disabled: true }; };
  const anyState = (label) => {
    const item = document.querySelector('[title="' + label + '"]');
    return { exists: Boolean(item), disabled: Boolean(item?.disabled) };
  };

  clickTab('Xem');
  await wait(300);
  const separate = state('Tách trang');
  const background = state('Đổi nền');
  const zoom100 = state('Thu phóng 100%');
  click('Tách trang');
  await wait(400);
  const continuous = document.querySelector('.op-word-stage')?.classList.contains('op-word-continuous') ?? false;
  click('Đổi nền');
  await wait(400);
  const dark = document.querySelector('.op-word-stage')?.classList.contains('op-word-dark') ?? false;
  click('Thu phóng 100%');
  await wait(300);
  const zoom = document.querySelector('.op-word-stage')?.style.zoom ?? '';

  clickTab('Chèn');
  await wait(300);
  const tocButton = state('Mục lục');
  click('Mục lục');
  await wait(800);
  const tocInserted = [...document.querySelectorAll('.op-word-p')].some((node) => node.textContent.includes('Mục lục'));

  clickTab('Xem lại');
  await wait(300);
  const showComments = state('Hiện bình luận');
  const filterComments = state('Lọc');
  click('Hiện bình luận');
  await wait(500);
  const commentsPanel = [...document.querySelectorAll('aside')].some((item) => item.textContent.includes('Bình luận'));
  const filterSelect = Boolean(document.querySelector('aside select + option, aside select'));
  clickTab('Bố cục');
  await wait(300);
  const pageColor = anyState('Màu nền trang');
  const pageBorders = state('Viền trang');
  click('Màu nền trang');
  await wait(500);
  const pageSetupPanel = [...document.querySelectorAll('aside')].some((item) => item.textContent.includes('Thiết lập trang'));

  return {
    separate, background, zoom100, continuous, dark, zoom,
    tocButton, tocInserted,
    showComments, filterComments, commentsPanel, filterSelect,
    pageColor, pageBorders, pageSetupPanel,
    groups: document.querySelectorAll('.op-rb-group').length,
    pages: document.querySelectorAll('.op-word-page').length,
    error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
  };
})()`;

const evaluated = await send('Runtime.evaluate', { expression: action, awaitPromise: true, returnByValue: true });
console.log('result', JSON.stringify(evaluated.result?.value, null, 2));
console.log('exceptions', JSON.stringify(exceptions));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(0);
