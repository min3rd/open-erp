/**
 * Final UI check of the Word editor: loads a sample, records page errors and
 * console errors, screenshots desktop 1440x1000 and mobile 390x844, and reports
 * horizontal overflow on the mobile viewport.
 *
 *   node scripts/qa-word-ui.mjs [sample.docx] [out-dir]
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const [sample = 'sample.docx', outDir = '.tmp/shots'] = process.argv.slice(2);
const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9331;
const userData = path.join(process.env.TEMP ?? '.', 'edge-word-ui');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
fs.mkdirSync(outDir, { recursive: true });
const child = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`,
  '--window-size=1440,1000', 'about:blank',
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function pageTarget() {
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
const socket = new WebSocket((await pageTarget()).webSocketDebuggerUrl);
let counter = 0;
const pending = new Map();
const errors = [];
const consoleErrors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params?.exceptionDetails?.exception?.description ?? message.params?.exceptionDetails?.text ?? 'exception');
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
    consoleErrors.push((message.params.args ?? []).map((arg) => arg.value ?? arg.description ?? '').join(' ').slice(0, 200));
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
const setViewport = (width, height) => send('Emulation.setDeviceMetricsOverride', {
  width, height, deviceScaleFactor: 1, mobile: width < 600,
});
await setViewport(1440, 1000);
await send('Page.navigate', { url: 'http://127.0.0.1:4399/index.html' });
await sleep(2200);
const loaded = await send('Runtime.evaluate', {
  expression: `(async () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const response = await fetch('/samples/${sample}');
    const transfer = new DataTransfer();
    transfer.items.add(new File([await response.arrayBuffer()], '${sample}'));
    document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
    for (let i = 0; i < 200; i++) { if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break; await wait(250); }
    await wait(600);
    return {
      pages: document.querySelectorAll('.op-word-page').length,
      settled: document.querySelector('.op-word-stage')?.getAttribute('data-settled'),
      words: document.querySelector('.op-status')?.textContent?.slice(0, 80) ?? null,
    };
  })()`,
  awaitPromise: true,
  returnByValue: true,
});
await sleep(400);
const desktop = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(outDir, 'word-ui-desktop.png'), Buffer.from(desktop.data, 'base64'));
await setViewport(390, 844);
await sleep(900);
const mobileInfo = await send('Runtime.evaluate', {
  expression: `(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    pageWidth: document.querySelector('.op-word-page')?.getBoundingClientRect().width ?? null,
  }))()`,
  returnByValue: true,
});
const mobile = await send('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(path.join(outDir, 'word-ui-mobile-390x844.png'), Buffer.from(mobile.data, 'base64'));
const report = {
  sample,
  settled: loaded.result?.value?.settled,
  pages: loaded.result?.value?.pages,
  errors,
  consoleErrors,
  mobile: mobileInfo.result?.value,
};
fs.writeFileSync(path.join(outDir, 'word-ui-check.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
socket.close();
child.kill();
process.exit(0);
