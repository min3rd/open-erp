import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9228;
const url = process.argv[2] ?? 'http://localhost:4349';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-inspect');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
const child = spawn(edge, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--disable-extensions', `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`, '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function pageTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = list.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* not ready */ }
    await sleep(400);
  }
  throw new Error('no cdp');
}
const target = await pageTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
  }
});
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve); socket.addEventListener('error', reject); });
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const call = ++id;
  pending.set(call, { resolve, reject });
  socket.send(JSON.stringify({ id: call, method, params }));
});
await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(2000);
const action = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const file = new File([await (await fetch('/samples/sample-real-proposal.docx')).arrayBuffer()], 'sample-real-proposal.docx');
  const transfer = new DataTransfer(); transfer.items.add(file);
  document.querySelector('.op-start').dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
  await wait(3500);
  const pages = [...document.querySelectorAll('.op-word-page')];
  const first = pages[0];
  const children = [...first.children].map((node) => ({
    tag: node.tagName,
    cls: typeof node.className === 'string' ? node.className : node.getAttribute('class'),
    h: Math.round(node.getBoundingClientRect().height),
    top: Math.round(node.getBoundingClientRect().top),
    bottom: Math.round(node.getBoundingClientRect().bottom),
    pos: getComputedStyle(node).position,
  }));
  return {
    pages: pages.length,
    pageHeight: Math.round(first.getBoundingClientRect().height),
    scrollHeight: first.scrollHeight,
    contentHeight: children.reduce((sum, item) => sum + item.h, 0),
    firstPageParagraphs: first.querySelectorAll('.op-word-p').length,
    secondPageParagraphs: pages[1]?.querySelectorAll('.op-word-p').length ?? 0,
    footers: pages.slice(0, 3).map((page) => page.querySelector('.op-word-footer')?.innerText.replace(/\\s+/g, ' ').trim() ?? null),
    measured: first.parentElement?.getAttribute('data-measured'),
    measureRuns: first.parentElement?.getAttribute('data-measure-runs'),
    measureError: first.parentElement?.getAttribute('data-measure-error'),
    lastChild: children[children.length - 1],
    children: children.slice(0, 8),
    firstBlocks: [...first.querySelectorAll('.op-word-p')].slice(0, 5).map((node) => Math.round(node.getBoundingClientRect().height)),
    status: document.querySelector('.op-statusbar')?.innerText.replace(/\\s+/g, ' ').trim(),
  };
})()`;
const evaluated = await send('Runtime.evaluate', { expression: action, awaitPromise: true, returnByValue: true });
console.log(JSON.stringify(evaluated.result?.value, null, 2));
socket.close();
child.kill();
process.exit(0);
