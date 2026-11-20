import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9242;
const url = process.env.OFFICE_QA_URL ?? 'http://127.0.0.1:4399/index.html';
const evidence = 'D:/Projects/open-erp/docs/sprints/sprint_12_office_webapp/08_testing/evidence';
const out = `${evidence}/word-draw-ink.png`;
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-draw-ink');
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
const errors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params?.exceptionDetails?.exception?.description ?? message.params?.exceptionDetails?.text ?? 'exception');
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
    errors.push(message.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  }
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
await send('Page.navigate', { url });
await sleep(2500);

const action = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/sample.docx');
  const transfer = new DataTransfer();
  transfer.items.add(new File([await response.arrayBuffer()], 'sample.docx'));
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
  await wait(1200);

  const clickTab = (label) => {
    const tab = [...document.querySelectorAll('.op-tab')].find((item) => item.textContent.trim() === label);
    tab?.click();
    return Boolean(tab);
  };
  const button = (label) => [...document.querySelectorAll('.op-ribbon button')]
    .find((item) => item.title === label || item.textContent.trim() === label);
  const click = (label) => { const item = button(label); item?.click(); return Boolean(item); };
  const active = (label) => Boolean(button(label)?.classList.contains('op-rb-active'));
  const alphaPixels = () => {
    const canvas = document.querySelector('canvas.op-word-ink');
    if (!canvas) return 0;
    const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
    let count = 0;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) count++;
    return count;
  };

  clickTab('Vẽ');
  await wait(300);
  const highlighterFound = click('Bút dạ quang');
  await wait(400);
  const inkPanel = [...document.querySelectorAll('aside')].find((node) => node.textContent.includes('Mực'));
  const highlighterActive = active('Bút dạ quang');
  const penActive = active('Mực');
  const color = inkPanel?.querySelector('input[type=color]')?.value ?? null;
  const width = inkPanel?.querySelector('input[type=number]')?.value ?? null;

  const canvas = document.querySelector('canvas.op-word-ink');
  const rect = canvas?.getBoundingClientRect();
  if (!canvas || !rect) return { highlighterFound, highlighterActive, color, width, error: 'no canvas' };
  const fire = (type, xRatio, yRatio, pressure) => canvas.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, pointerId: 9, pointerType: 'pen', isPrimary: true, pressure,
    clientX: rect.left + rect.width * xRatio, clientY: rect.top + rect.height * yRatio,
  }));
  fire('pointerdown', 0.2, 0.3, 0.4);
  for (let step = 1; step <= 10; step++) {
    fire('pointermove', 0.2 + step * 0.04, 0.3 + Math.sin(step / 2) * 0.04, 0.45);
    await wait(16);
  }
  fire('pointerup', 0.6, 0.3, 0.8);
  await wait(500);
  const drawnPixels = alphaPixels();

  clickTab('Xem lại');
  await wait(300);
  const hideFound = click('Ẩn mực');
  await wait(600);
  const hiddenPixels = alphaPixels();
  const hideActive = active('Ẩn mực');
  const panelClosed = ![...document.querySelectorAll('aside')].some((node) => node.textContent.includes('Mực'));

  click('Ẩn mực');
  await wait(600);
  const restoredPixels = alphaPixels();
  const hideInactive = !active('Ẩn mực');

  click('Xóa toàn bộ mực');
  await wait(600);
  const clearedPixels = alphaPixels();

  clickTab('Vẽ');
  await wait(300);
  const rulerFound = click('Thước');
  await wait(400);
  const rulerVisible = Boolean(document.querySelector('.op-word-ruler'));
  const rulerActive = active('Thước');

  return {
    highlighterFound, highlighterActive, penActive, color, width,
    drawnPixels, drawn: drawnPixels > 500,
    hideFound, hiddenPixels, hidden: hiddenPixels === 0, hideActive, panelClosed,
    restoredPixels, restored: restoredPixels > 500, hideInactive,
    clearedPixels, cleared: clearedPixels === 0,
    rulerFound, rulerVisible, rulerActive,
    error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
  };
})()`;

const evaluated = await send('Runtime.evaluate', { expression: action, awaitPromise: true, returnByValue: true });
const result = evaluated.result?.value;
console.log(JSON.stringify(result, null, 2));
console.log('errors', JSON.stringify(errors));

const passed = result?.highlighterFound && result?.highlighterActive && !result?.penActive
  && result?.color === '#fde047' && result?.width === '12'
  && result?.drawn
  && result?.hideFound && result?.hidden && result?.hideActive && result?.panelClosed
  && result?.restored && result?.hideInactive
  && result?.cleared
  && result?.rulerFound && result?.rulerVisible && result?.rulerActive
  && errors.length === 0;
fs.mkdirSync(evidence, { recursive: true });
fs.writeFileSync(`${evidence}/word-draw-ink.json`,
  JSON.stringify({ generated_at: new Date().toISOString(), passed, result, errors }, null, 2));
console.log('QA', passed ? 'PASS' : 'FAIL');
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(passed ? 0 : 1);
