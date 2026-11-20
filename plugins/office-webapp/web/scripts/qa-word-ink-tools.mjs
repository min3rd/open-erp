import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9245;
const url = process.env.OFFICE_QA_URL ?? 'http://127.0.0.1:4399/index.html';
const evidence = 'D:/Projects/open-erp/docs/sprints/sprint_12_office_webapp/08_testing/evidence';
const out = `${evidence}/word-ink-tools.png`;
const downloadPath = path.join(process.env.TEMP ?? '.', 'office-ink-tools-downloads');
fs.rmSync(downloadPath, { recursive: true, force: true });
fs.mkdirSync(downloadPath, { recursive: true });
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-ink-tools');
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
await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true });
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
  const fire = (type, xRatio, yRatio, pointerType = 'pen', pressure = 0.5, target = document.querySelector('canvas.op-word-ink')) => {
    const rect = target.getBoundingClientRect();
    target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 11, pointerType, isPrimary: true, pressure,
      clientX: rect.left + rect.width * xRatio, clientY: rect.top + rect.height * yRatio,
    }));
  };
  const stroke = async (x0, y0, x1, y1, pointerType = 'pen') => {
    fire('pointerdown', x0, y0, pointerType, 0.4);
    for (let step = 1; step <= 8; step++) {
      fire('pointermove', x0 + (x1 - x0) * step / 8, y0 + (y1 - y0) * step / 8, pointerType, 0.6);
      await wait(16);
    }
    fire('pointerup', x1, y1, pointerType, 0.8);
    await wait(350);
  };

  clickTab('Vẽ');
  await wait(300);
  const highlighterFound = click('Bút dạ quang');
  await wait(400);
  const panel = [...document.querySelectorAll('aside')].find((node) => node.textContent.includes('Mực'));
  const lineSelect = [...(panel?.querySelectorAll('select') ?? [])].find((node) => [...node.options].some((option) => option.value === 'dashed'));
  lineSelect.value = 'dashed';
  lineSelect.dispatchEvent(new Event('change', { bubbles: true }));
  await wait(200);

  await stroke(0.2, 0.3, 0.7, 0.3);
  const afterDraw = alphaPixels();
  const eraserSmallFound = click('Tẩy nhỏ');
  await wait(300);
  const eraserSmallActive = active('Tẩy nhỏ');
  await wait(200);
  fire('pointerdown', 0.4, 0.3, 'pen', 0.5);
  fire('pointerup', 0.4, 0.3, 'pen', 0.5);
  await wait(400);
  const afterErase = alphaPixels();

  click('Mực');
  await wait(200);
  await stroke(0.2, 0.5, 0.7, 0.5);
  const beforeLasso = alphaPixels();
  const lassoFound = click('Chọn bằng lasso');
  await wait(300);
  const lassoActive = active('Chọn bằng lasso');
  await wait(200);
  fire('pointerdown', 0.15, 0.42, 'pen', 0.5);
  fire('pointerup', 0.75, 0.58, 'pen', 0.5);
  await wait(400);
  const deleteButton = [...(panel?.querySelectorAll('button') ?? [])].find((node) => node.textContent.trim() === 'Xóa nét đã chọn');
  const selected = Boolean(deleteButton && !deleteButton.disabled);
  deleteButton?.click();
  await wait(500);
  const afterLassoDelete = alphaPixels();

  const touchFound = click('Vẽ bằng cảm ứng');
  await wait(300);
  const touchActive = active('Vẽ bằng cảm ứng');
  await wait(100);
  await stroke(0.2, 0.7, 0.6, 0.7, 'mouse');
  const mouseRejected = alphaPixels() === afterLassoDelete;
  await stroke(0.2, 0.7, 0.6, 0.7, 'touch');
  const touchDrawn = alphaPixels() > afterLassoDelete;

  const favoriteFound = click('Thêm vào yêu thích');
  const colorInput = panel?.querySelector('input[type=color]');
  colorInput.value = '#2563eb';
  colorInput.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(150);
  click('Bút yêu thích');
  await wait(300);
  const favoriteApplied = panel?.querySelector('input[type=color]')?.value === '#fde047';
  const mouseModeFound = click('Vẽ bằng chuột');
  await wait(300);
  const mouseModeActive = active('Vẽ bằng chuột');
  click('Mực');
  await wait(150);

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }));
  await wait(3500);

  return {
    highlighterFound, afterDraw, eraserSmallFound, eraserSmallActive, afterErase, erased: afterErase === 0,
    beforeLasso, lassoFound, lassoActive, selected, afterLassoDelete, lassoDeleted: afterLassoDelete === afterErase,
    touchFound, touchActive, mouseRejected, touchDrawn,
    favoriteFound, favoriteApplied, mouseModeFound, mouseModeActive,
    state: document.querySelector('.op-save-state')?.textContent ?? null,
    error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
  };
})()`;

const evaluated = await send('Runtime.evaluate', { expression: action, awaitPromise: true, returnByValue: true });
const result = evaluated.result?.value;
console.log(JSON.stringify(result, null, 2));
console.log('errors', JSON.stringify(errors));

let downloaded = null;
for (let attempt = 0; attempt < 40; attempt++) {
  const files = fs.readdirSync(downloadPath).filter((name) => name.endsWith('.docx'));
  if (files.length) { downloaded = path.join(downloadPath, files[0]); break; }
  await sleep(500);
}
let inkPart = null;
if (downloaded) {
  const probe = path.join(process.env.TEMP ?? '.', 'inspect-ink-tools.py');
  fs.writeFileSync(probe, [
    'import sys, zipfile',
    'with zipfile.ZipFile(sys.argv[1]) as z:',
    "    xml = z.read('word/ink/ink1.xml').decode('utf-8') if 'word/ink/ink1.xml' in z.namelist() else ''",
    "    print('transparency=' + str('name=\"transparency\" value=\"0.65\"' in xml).lower())",
    "    print('lineStyle=' + str('name=\"lineStyle\" value=\"dashed\"' in xml).lower())",
  ].join('\n'));
  const { execFileSync } = await import('node:child_process');
  const output = execFileSync('python', [probe, downloaded], { encoding: 'utf8' }).trim();
  inkPart = {
    transparency: output.includes('transparency=true'),
    lineStyle: output.includes('lineStyle=true'),
    output,
  };
  console.log('inkPart', JSON.stringify(inkPart));
}

const passed = result?.highlighterFound && result?.afterDraw > 500 && result?.erased
  && result?.lassoFound && result?.lassoActive && result?.selected && result?.lassoDeleted
  && result?.touchFound && result?.touchActive && result?.mouseRejected && result?.touchDrawn
  && result?.favoriteFound && result?.favoriteApplied
  && result?.mouseModeFound && result?.mouseModeActive
  && inkPart?.transparency === true && inkPart?.lineStyle === true
  && errors.length === 0;
fs.mkdirSync(evidence, { recursive: true });
fs.writeFileSync(`${evidence}/word-ink-tools.json`,
  JSON.stringify({ generated_at: new Date().toISOString(), passed, result, inkPart, errors }, null, 2));
console.log('QA', passed ? 'PASS' : 'FAIL');
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(passed ? 0 : 1);
