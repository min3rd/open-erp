import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9238;
const url = process.argv[2] ?? 'http://localhost:4349';
const out = process.argv[3] ?? 'plugins/office-webapp/web/.tmp/pprchange.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-pprchange');
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

const drop = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/pPrChange-sample.docx');
  const file = new File([await response.arrayBuffer()], 'pPrChange-sample.docx');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
  await wait(1800);
})()`;
await send('Runtime.evaluate', { expression: drop, awaitPromise: true, returnByValue: true });

const result = await send('Runtime.evaluate', {
  expression: `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
    const paragraph = () => [...document.querySelectorAll('.op-word-p')]
      .find((node) => node.textContent.includes('Đoạn có thay đổi định dạng'));
    const alignment = () => paragraph() ? getComputedStyle(paragraph()).textAlign : null;
    const markupBar = () => paragraph()?.getAttribute('data-revision') === 'true';

    const before = { align: alignment(), markupBar: markupBar() };
    clickTab('Xem lại');
    await wait(300);
    const opened = clickRibbon('Thay đổi');
    await wait(600);
    const aside = [...document.querySelectorAll('aside')].find((node) => node.textContent.includes('Thay đổi'));
    const cards = [...(aside?.querySelectorAll('.op-revision-card') ?? [])];
    const card = cards[0];
    const reject = card ? [...card.querySelectorAll('button')].find((item) => item.textContent.includes('Từ chối')) : null;
    reject?.click();
    await wait(800);
    return {
      opened,
      before,
      revisionCount: cards.length,
      revisionType: card?.getAttribute('data-type') ?? null,
      revisionText: card?.querySelector('.op-comment-text')?.textContent?.trim() ?? null,
      rejectClicked: Boolean(reject),
      after: { align: alignment(), markupBar: markupBar() },
      remainingCards: aside ? aside.querySelectorAll('.op-revision-card').length : null,
      error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`,
  awaitPromise: true,
  returnByValue: true,
});
console.log('pprchange', JSON.stringify(result.result?.value, null, 2));
console.log('exceptions', JSON.stringify(exceptions));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(0);
