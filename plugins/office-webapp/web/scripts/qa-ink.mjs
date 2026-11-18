import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9248;
const url = process.argv[2] ?? 'http://localhost:4349';
const downloadPath = process.argv[3] ?? path.join(process.env.TEMP ?? '.', 'office-ink-downloads');
const out = process.argv[4] ?? 'plugins/office-webapp/web/.tmp/ink.png';
fs.rmSync(downloadPath, { recursive: true, force: true });
fs.mkdirSync(downloadPath, { recursive: true });
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-ink');
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
await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(2200);

const action = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/sample-real-proposal.docx');
  const file = new File([await response.arrayBuffer()], 'sample-real-proposal.docx');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
  for (let i = 0; i < 80; i++) {
    if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break;
    await wait(250);
  }
  const clickTab = (label) => {
    const tab = [...document.querySelectorAll('.op-tab')].find((item) => item.textContent.trim() === label);
    tab?.click();
    return Boolean(tab);
  };
  const clickRibbon = (label) => {
    const button = [...document.querySelectorAll('.op-ribbon button')]
      .find((item) => item.title === label || item.textContent.trim() === label);
    button?.click();
    return Boolean(button);
  };

  clickTab('Vẽ');
  await wait(300);
  const inkButton = clickRibbon('Mực');
  await wait(400);
  const canvas = document.querySelector('canvas.op-word-ink');
  const rect = canvas?.getBoundingClientRect();
  if (!canvas || !rect) return { inkButton, error: 'no canvas' };
  const fire = (type, xRatio, yRatio, pressure) => {
    canvas.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 7, pointerType: 'pen', isPrimary: true, pressure,
      clientX: rect.left + rect.width * xRatio, clientY: rect.top + rect.height * yRatio,
    }));
  };
  fire('pointerdown', 0.2, 0.25, 0.35);
  for (let step = 1; step <= 12; step++) {
    fire('pointermove', 0.2 + step * 0.03, 0.25 + Math.sin(step / 2) * 0.05, 0.35 + step * 0.04);
    await wait(16);
  }
  fire('pointerup', 0.56, 0.25, 0.83);
  await wait(600);

  const context = canvas.getContext('2d');
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  let alphaPixels = 0;
  for (let index = 3; index < pixels.length; index += 4) {
    if (pixels[index] > 0) alphaPixels++;
  }
  const inkActive = canvas.classList.contains('op-ink-active');
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }));
  await wait(4000);
  return {
    inkButton,
    inkActive,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    alphaPixels,
    drawn: alphaPixels > 500,
    state: document.querySelector('.op-save-state')?.textContent ?? null,
    error: document.querySelector('.op-error')?.innerText?.replace(/\\s+/g, ' ').trim() ?? null,
  };
})()`;
const evaluated = await send('Runtime.evaluate', { expression: action, awaitPromise: true, returnByValue: true });
console.log('ink', JSON.stringify(evaluated.result?.value, null, 2));
console.log('exceptions', JSON.stringify(exceptions));

let downloaded = null;
for (let attempt = 0; attempt < 40; attempt++) {
  const files = fs.readdirSync(downloadPath).filter((name) => name.endsWith('.docx'));
  if (files.length) {
    downloaded = path.join(downloadPath, files[0]);
    break;
  }
  await sleep(500);
}
console.log('downloaded', downloaded, downloaded ? fs.statSync(downloaded).size : null);

let reload = null;
if (downloaded) {
  const sampleDir = 'plugins/office-webapp/src/main/resources/META-INF/resources/samples';
  fs.mkdirSync(sampleDir, { recursive: true });
  fs.copyFileSync(downloaded, path.join(sampleDir, 'ink-saved.docx'));
  await send('Page.navigate', { url });
  await sleep(2000);
  const reloadAction = `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const response = await fetch('/samples/ink-saved.docx');
    const file = new File([await response.arrayBuffer()], 'ink-saved.docx');
    const transfer = new DataTransfer();
    transfer.items.add(file);
    document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
    for (let i = 0; i < 80; i++) {
      if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break;
      await wait(250);
    }
    await wait(800);
    const canvas = document.querySelector('canvas.op-word-ink');
    if (!canvas) return { error: 'no canvas' };
    const context = canvas.getContext('2d');
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let alphaPixels = 0;
    for (let index = 3; index < pixels.length; index += 4) if (pixels[index] > 0) alphaPixels++;
    return {
      alphaPixels,
      rendered: alphaPixels > 500,
      error: document.querySelector('.op-error')?.innerText?.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`;
  const reloaded = await send('Runtime.evaluate', { expression: reloadAction, awaitPromise: true, returnByValue: true });
  reload = reloaded.result?.value ?? null;
}
console.log('reload', JSON.stringify(reload, null, 2));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(evaluated.result?.value?.drawn && downloaded && reload?.rendered ? 0 : 1);
