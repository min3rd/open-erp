import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9234;
const url = process.argv[2] ?? 'http://localhost:4349';
const out = process.argv[3] ?? 'plugins/office-webapp/web/.tmp/reflow-nested.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-reflow');
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

const drop = async (sample) => {
  const expression = `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const response = await fetch('/samples/${sample}');
    const file = new File([await response.arrayBuffer()], '${sample}');
    const transfer = new DataTransfer();
    transfer.items.add(file);
    document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
    await wait(1400);
  })()`;
  await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
};

await drop('wrap-sample.docx');
const wrapResult = await send('Runtime.evaluate', {
  expression: `(() => {
    const wrap = document.querySelector('.op-word-float-wrap');
    const content = document.querySelector('.op-word-page');
    const longP = [...document.querySelectorAll('.op-word-p')].find((node) => node.textContent.includes('Đoạn văn bản dài'));
    let firstTextLeft = null;
    let firstTextRight = null;
    if (longP) {
      const walker = document.createTreeWalker(longP, NodeFilter.SHOW_TEXT);
      const node = walker.nextNode();
      if (node) {
        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getClientRects()[0];
        if (rect) { firstTextLeft = Math.round(rect.left); firstTextRight = Math.round(rect.right); }
      }
    }
    const wrapRect = wrap ? wrap.getBoundingClientRect() : null;
    return {
      wrapCount: document.querySelectorAll('.op-word-float-wrap').length,
      overlayCount: document.querySelectorAll('.op-word-float').length,
      float: wrap ? getComputedStyle(wrap).float : null,
      position: wrap ? getComputedStyle(wrap).position : null,
      shapeOutside: wrap ? getComputedStyle(wrap).shapeOutside : null,
      wrapLeft: wrapRect ? Math.round(wrapRect.left) : null,
      wrapRight: wrapRect ? Math.round(wrapRect.right) : null,
      firstTextLeft, firstTextRight,
      wrapped: Boolean(wrapRect && firstTextLeft !== null && firstTextLeft >= wrapRect.right - 4),
      pageLeft: content ? Math.round(content.getBoundingClientRect().left) : null,
    };
  })()`,
  returnByValue: true,
});
console.log('wrap', JSON.stringify(wrapResult.result?.value, null, 2));

await send('Page.navigate', { url });
await sleep(1800);
await drop('nested3.docx');
const nestedResult = await send('Runtime.evaluate', {
  expression: `(() => ({
    tables: document.querySelectorAll('.op-word-table').length,
    nestedTables: document.querySelectorAll('.op-word-nested-table').length,
    hasLevel3: [...document.querySelectorAll('.op-word-table')].some((node) => node.textContent.includes('Level3')),
    text: [...document.querySelectorAll('.op-word-table')].map((node) => node.textContent.replace(/\\s+/g, ' ').trim()).slice(0, 3),
    error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
  }))()`,
  returnByValue: true,
});
console.log('nested', JSON.stringify(nestedResult.result?.value, null, 2));
console.log('exceptions', JSON.stringify(exceptions));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(0);
