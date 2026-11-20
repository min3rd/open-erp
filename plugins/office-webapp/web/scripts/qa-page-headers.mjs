import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [sample = 'sample-real-proposal.docx', list = '1,5,26,27,32'] = process.argv.slice(2);
const pages = list.split(',').map(Number);
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9389;
const userData = path.join(process.env.TEMP ?? '.', 'edge-headers');
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
  throw new Error('EDGE_CDP_NOT_READY');
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
  await wait(400);
  const targets = ${JSON.stringify(pages)};
  const all = [...document.querySelectorAll('.op-word-page')];
  return targets.map((number) => {
    const page = all[number - 1];
    if (!page) return { page: number, missing: true };
    const header = page.querySelector('.op-word-header');
    const footer = page.querySelector('.op-word-footer');
    const article = page.querySelector('.op-word-page-body') ?? page;
    const firstBlock = page.querySelector('.op-word-p, .op-word-table');
    const pageRect = page.getBoundingClientRect();
    return {
      page: number,
      headerText: header ? header.textContent.trim().slice(0, 60) : null,
      headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
      headerTop: header ? Math.round(header.getBoundingClientRect().top - pageRect.top) : null,
      footerText: footer ? footer.textContent.trim().slice(0, 40) : null,
      firstBlockTop: firstBlock ? Math.round(firstBlock.getBoundingClientRect().top - pageRect.top) : null,
      bodyClass: article.className,
    };
  });
})()`;
const evaluated = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
console.log(JSON.stringify(evaluated.result?.value, null, 1));
socket.close();
child.kill();
process.exit(0);
