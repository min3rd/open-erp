import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9233;
const url = process.argv[2] ?? 'http://localhost:4349';
const sample = process.argv[3] ?? 'sample.docx';
const out = process.argv[4] ?? 'plugins/office-webapp/web/.tmp/wpg-group.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-wpg');
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
  const clickButton = (label) => {
    const button = [...document.querySelectorAll('.op-ribbon button')]
      .find((item) => item.title === label || item.textContent.trim() === label);
    button?.click();
    return Boolean(button);
  };

  clickTab('Chèn');
  await wait(300);
  clickButton('Hình khối');
  await wait(500);
  document.querySelector('.op-shape-btn[data-shape="rect"]')?.click();
  await wait(600);
  clickButton('Hình khối');
  await wait(400);
  document.querySelector('.op-shape-btn[data-shape="rect"]')?.click();
  await wait(800);
  const afterInsert = document.querySelectorAll('.op-word-float').length;

  const floats = [...document.querySelectorAll('.op-word-float')];
  floats[0]?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  floats[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
  await wait(300);
  clickTab('Bố cục');
  await wait(300);
  const groupButton = clickButton('Nhóm');
  await wait(700);
  const afterGroup = document.querySelectorAll('.op-word-float').length;
  const groupChildren = document.querySelectorAll('.op-word-group-child').length;
  const groupSelected = Boolean(document.querySelector('.op-word-float.op-float-selected'));
  clickButton('Ngăn chọn');
  await wait(500);
  const ungroup = [...document.querySelectorAll('aside button')].find((item) => item.textContent.includes('Bỏ nhóm'));
  ungroup?.click();
  await wait(700);
  const ungroupButton = Boolean(ungroup);
  const afterUngroup = document.querySelectorAll('.op-word-float').length;

  return {
    afterInsert, groupButton, afterGroup, groupChildren, groupSelected, ungroupButton, afterUngroup,
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
