import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9231;
const url = process.argv[2] ?? 'http://localhost:4349';
const sample = process.argv[3] ?? 'sample.docx';
const out = process.argv[4] ?? 'plugins/office-webapp/web/.tmp/word-parity.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-parity');
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
  const buffer = await response.arrayBuffer();
  const file = new File([buffer], '${sample}');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  document.querySelector('.op-start').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
  await wait(1800);

  const clickTab = (label) => {
    const tab = [...document.querySelectorAll('.op-tab')].find((item) => item.textContent.trim() === label);
    tab?.click();
    return Boolean(tab);
  };
  const clickCommand = (label) => {
    const button = [...document.querySelectorAll('.op-ribbon button')]
      .find((item) => item.title === label || item.textContent.trim() === label);
    button?.click();
    return Boolean(button);
  };
  const ribbonState = (label) => {
    const button = [...document.querySelectorAll('.op-ribbon button')]
      .find((item) => item.title === label || item.textContent.trim() === label);
    return button ? { exists: true, disabled: Boolean(button.disabled) } : { exists: false, disabled: true };
  };

  const mailingsTab = clickTab('Thư tín');
  await wait(300);
  const mailStart = ribbonState('Bắt đầu trộn thư');
  clickCommand('Bắt đầu trộn thư');
  await wait(500);
  const mailPanel = [...document.querySelectorAll('aside')].some((item) => item.textContent.includes('Trộn thư'));
  const mergeFieldInsert = [...document.querySelectorAll('aside button')].some((item) => item.textContent.includes('Chèn trường trộn'));

  clickTab('Tham chiếu');
  await wait(300);
  const markEntry = ribbonState('Đánh dấu mục');
  clickCommand('Đánh dấu mục');
  await wait(500);
  const indexPanel = [...document.querySelectorAll('aside')].some((item) => item.textContent.includes('Chỉ mục'));
  const indexMark = [...document.querySelectorAll('aside button')].some((item) => item.textContent.includes('Đánh dấu mục'));

  clickTab('Chèn');
  await wait(300);
  const shapesCommand = clickCommand('Hình khối');
  await wait(500);
  const shapeButton = document.querySelector('.op-shape-btn[data-shape="rect"]');
  shapeButton?.click();
  await wait(900);
  const floats = document.querySelectorAll('.op-word-float').length;
  const floatEl = document.querySelector('.op-word-float');
  const beforeLeft = floatEl ? floatEl.style.left : '';
  floatEl?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  await wait(300);
  const selected = Boolean(document.querySelector('.op-word-float.op-float-selected'));

  clickTab('Bố cục');
  await wait(300);
  const position = ribbonState('Vị trí');
  clickCommand('Vị trí');
  await wait(500);
  const positionPanel = [...document.querySelectorAll('aside')].some((item) => item.textContent.includes('Vị trí'));
  const preset = [...document.querySelectorAll('.op-arrange-grid button')].find((item) => item.textContent.includes('Trên trái'));
  preset?.click();
  await wait(500);
  const afterLeft = document.querySelector('.op-word-float')?.style.left ?? '';
  const afterTop = document.querySelector('.op-word-float')?.style.top ?? '';

  return {
    mailingsTab, mailStart, mailPanel, mergeFieldInsert,
    markEntry, indexPanel, indexMark,
    shapesCommand, floats, selected, beforeLeft, afterLeft, afterTop,
    position, positionPanel,
    paragraphs: document.querySelectorAll('.op-word-p').length,
    pages: document.querySelectorAll('.op-word-page').length,
    status: document.querySelector('.op-statusbar')?.innerText.replace(/\\s+/g, ' ').trim(),
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
