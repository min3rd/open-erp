import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9243;
const url = process.env.OFFICE_QA_URL ?? 'http://127.0.0.1:4399/index.html';
const evidence = 'D:/Projects/open-erp/docs/sprints/sprint_12_office_webapp/08_testing/evidence';
const out = `${evidence}/word-layout-margins.png`;
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-layout-margins');
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

  [...document.querySelectorAll('.op-tab')].find((node) => node.textContent.trim() === 'Bố cục')?.click();
  await wait(300);
  const marginsSelect = [...document.querySelectorAll('.op-ribbon select')]
    .find((node) => node.title === 'Lề');
  marginsSelect.value = 'custom';
  marginsSelect.dispatchEvent(new Event('change', { bubbles: true }));
  await wait(400);

  const panel = [...document.querySelectorAll('aside')].find((node) => node.textContent.includes('Cột & Trang'));
  const inputs = [...(panel?.querySelectorAll('.op-margin-grid input') ?? [])];
  const values = ['1.5', '2.5', '3', '3.5'];
  inputs.forEach((input, index) => {
    input.value = values[index];
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  const presetAfterEdit = [...(panel?.querySelectorAll('select') ?? [])].some((node) => node.value === 'custom');
  [...(panel?.querySelectorAll('button') ?? [])].find((node) => node.textContent.trim() === 'Áp dụng trang')?.click();
  await wait(900);

  const page = document.querySelector('.op-word-page');
  const style = page?.style ?? null;
  const pads = style ? {
    top: style.paddingTop, bottom: style.paddingBottom, left: style.paddingLeft, right: style.paddingRight,
  } : null;
  const firstP = document.querySelector('.op-word-p');
  const stage = document.querySelector('.op-word-stage');

  const hyphenSelect = [...document.querySelectorAll('.op-ribbon select')]
    .find((node) => node.title === 'Ngắt từ');
  hyphenSelect.value = 'automatic';
  hyphenSelect.dispatchEvent(new Event('change', { bubbles: true }));
  await wait(700);
  const hyphenClass = stage?.classList.contains('op-word-hyphenate') ?? null;
  const hyphenStyle = firstP ? getComputedStyle(firstP).hyphens : null;
  const lang = stage?.getAttribute('lang') ?? null;

  hyphenSelect.value = 'none';
  hyphenSelect.dispatchEvent(new Event('change', { bubbles: true }));
  await wait(700);
  const hyphenOff = !(stage?.classList.contains('op-word-hyphenate') ?? false);

  return {
    marginsFound: Boolean(marginsSelect),
    panelOpen: Boolean(panel),
    inputCount: inputs.length,
    presetAfterEdit,
    pads,
    padsOk: pads?.top === '57px' && pads?.bottom === '94px' && pads?.left === '113px' && pads?.right === '132px',
    hyphenFound: Boolean(hyphenSelect),
    hyphenClass, hyphenStyle, hyphenOff, lang,
    error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
  };
})()`;

const evaluated = await send('Runtime.evaluate', { expression: action, awaitPromise: true, returnByValue: true });
const result = evaluated.result?.value;
console.log(JSON.stringify(result, null, 2));
console.log('errors', JSON.stringify(errors));

const passed = result?.marginsFound && result?.panelOpen && result?.inputCount === 4
  && result?.presetAfterEdit === true && result?.padsOk
  && result?.hyphenFound && result?.hyphenClass === true && result?.hyphenStyle === 'auto'
  && result?.hyphenOff === true
  && errors.length === 0;
fs.mkdirSync(evidence, { recursive: true });
fs.writeFileSync(`${evidence}/word-layout-margins.json`,
  JSON.stringify({ generated_at: new Date().toISOString(), passed, result, errors }, null, 2));
console.log('QA', passed ? 'PASS' : 'FAIL');
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(passed ? 0 : 1);
