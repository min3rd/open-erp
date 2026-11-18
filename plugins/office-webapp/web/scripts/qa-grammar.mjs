import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9249;
const url = process.argv[2] ?? 'http://localhost:4349';
const out = process.argv[3] ?? 'plugins/office-webapp/web/.tmp/grammar.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-grammar');
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
  const response = await fetch('/samples/grammar-sample.docx');
  const file = new File([await response.arrayBuffer()], 'grammar-sample.docx');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
  await wait(1500);
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
    const paragraphTexts = () => [...document.querySelectorAll('.op-word-p')]
      .map((node) => node.textContent.replace(/\\s+/g, ' ').trim());
    const before = paragraphTexts();
    clickTab('Xem lại');
    await wait(300);
    const opened = clickRibbon('Chính tả');
    await wait(700);
    const aside = [...document.querySelectorAll('aside')].find((node) => node.textContent.includes('Chính tả'));
    const initialCards = aside ? [...aside.querySelectorAll('.op-note-item')] : [];
    const initialSuggestions = initialCards.map((card) => card.querySelector('.op-note-text')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '');
    let applied = 0;
    for (let attempt = 0; attempt < 12; attempt++) {
      const fix = aside
        ? [...aside.querySelectorAll('.op-note-item button')].find((button) => button.textContent.trim() === 'Sửa')
        : null;
      if (!fix) break;
      fix.click();
      applied++;
      await wait(400);
    }
    return {
      opened,
      initialCount: initialCards.length,
      initialSuggestions,
      applied,
      remaining: aside ? aside.querySelectorAll('.op-note-item').length : null,
      before,
      after: paragraphTexts(),
      error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`,
  awaitPromise: true,
  returnByValue: true,
});
const value = result.result?.value ?? {};
console.log('grammar', JSON.stringify(value, null, 2));
console.log('exceptions', JSON.stringify(exceptions));

const expectedEnglish = 'The report is ready. He goes to work every day. This is an apple. We depend on the supplier.';
const expectedVietnamese = 'Những người này làm việc tốt.';
const expectedComparatives = 'This is better. He gave advice. We went despite the rain.';
const expectedUncountable = 'The information is useful.';
const ok = value.initialCount === 9
  && value.applied === 9
  && value.remaining === 0
  && value.after?.[0] === expectedEnglish
  && value.after?.[1] === expectedVietnamese
  && value.after?.[2] === expectedComparatives
  && value.after?.[3] === expectedUncountable
  && exceptions.length === 0;

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(ok ? 0 : 1);
