import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [sample = 'word-authored-large.docx', pageArg = '1'] = process.argv.slice(2);
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9405;
const userData = path.join(process.env.TEMP ?? '.', 'edge-large-spacing');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
const child = spawn(edge, ['--headless=new', '--disable-gpu', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`,
  '--window-size=1440,1000', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function target() {
  for (let i = 0; i < 60; i++) {
    try {
      const found = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json())
        .find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
      if (found) return found;
    } catch { /* wait */ }
    await sleep(400);
  }
  throw new Error('NOT_READY');
}
const socket = new WebSocket((await target()).webSocketDebuggerUrl);
let counter = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
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
await send('Page.navigate', { url: 'http://127.0.0.1:4399/index.html' });
await sleep(2200);
const expression = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/${sample}');
  const transfer = new DataTransfer();
  transfer.items.add(new File([await response.arrayBuffer()], '${sample}'));
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 300; i++) { if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break; await wait(250); }
  await wait(900);
  const pages = [...document.querySelectorAll('.op-word-page')];
  const page = pages[${pageArg} - 1];
  const pageTop = page.getBoundingClientRect().top;
  const items = [...page.querySelectorAll('.op-word-p, .op-word-table')].slice(0, 8).map((node) => {
    const style = getComputedStyle(node);
    const rect = node.getBoundingClientRect();
    const lineHeight = parseFloat(style.lineHeight);
    return {
      tag: node.tagName,
      top: Math.round(rect.top - pageTop),
      height: Math.round(rect.height),
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      lines: lineHeight ? Math.round(rect.height / lineHeight) : null,
      marginTop: style.marginTop,
      marginBottom: style.marginBottom,
      text: (node.textContent ?? '').trim().slice(0, 30),
    };
  });
  return { pages: pages.length, items };
})()`;
const evaluated = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
console.log(JSON.stringify(evaluated.result?.value, null, 1));
socket.close();
child.kill();
process.exit(0);
