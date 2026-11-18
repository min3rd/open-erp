import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9246;
const url = process.argv[2] ?? 'http://localhost:4349';
const out = process.argv[3] ?? 'plugins/office-webapp/web/.tmp/toc-auto.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-toc-auto');
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
  const response = await fetch('/samples/sample-real-proposal.docx');
  const file = new File([await response.arrayBuffer()], 'sample-real-proposal.docx');
  const transfer = new DataTransfer();
  transfer.items.add(file);
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  await wait(500);
})()`;
await send('Runtime.evaluate', { expression: drop, awaitPromise: true, returnByValue: true });

let settled = false;
for (let attempt = 0; attempt < 80; attempt++) {
  const probe = await send('Runtime.evaluate', {
    expression: `document.querySelector('.op-word-stage')?.getAttribute('data-settled')`,
    returnByValue: true,
  });
  if (probe.result?.value === 'true') {
    settled = true;
    break;
  }
  await sleep(250);
}
await sleep(900);

const result = await send('Runtime.evaluate', {
  expression: `(() => {
    const text = (node) => node.textContent.replace(/\\s+/g, ' ').trim();
    const paragraphs = [...document.querySelectorAll('.op-word-p')];
    const toc = paragraphs.find((node) => /A Giới thiệu về nhà thầu\\s*\\d+$/.test(text(node)));
    const heading = paragraphs.find((node) => text(node) === 'Giới thiệu về nhà thầu');
    const deepToc = paragraphs.find((node) => /Tầng giao diện \\(Presensation Layer\\)\\s*\\d+$/.test(text(node)));
    const deepHeading = paragraphs.find((node) => text(node) === 'Tầng giao diện (Presensation Layer)');
    const pageOf = (node) => {
      const page = node?.closest('.op-word-page');
      return page ? Number(page.getAttribute('data-page')) + 1 : null;
    };
    const tocMatch = toc ? /(\\d+)$/.exec(text(toc)) : null;
    const deepMatch = deepToc ? /(\\d+)$/.exec(text(deepToc)) : null;
    return {
      settled: document.querySelector('.op-word-stage')?.getAttribute('data-settled') ?? null,
      tocText: toc ? text(toc) : null,
      tocPage: tocMatch ? Number(tocMatch[1]) : null,
      headingPage: pageOf(heading),
      matched: Boolean(toc && heading && tocMatch && Number(tocMatch[1]) === pageOf(heading)),
      deepTocText: deepToc ? text(deepToc) : null,
      deepPage: deepMatch ? Number(deepMatch[1]) : null,
      deepHeadingPage: pageOf(deepHeading),
      deepMatched: Boolean(deepToc && deepHeading && deepMatch && Number(deepMatch[1]) === pageOf(deepHeading)),
      cachedWasNine: deepMatch ? Number(deepMatch[1]) !== 9 : false,
      pages: document.querySelectorAll('.op-word-page').length,
      error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`,
  returnByValue: true,
});
console.log('tocAuto', JSON.stringify({ settled, ...result.result?.value }, null, 2));
console.log('exceptions', JSON.stringify(exceptions));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(result.result?.value?.matched && result.result?.value?.deepMatched && result.result?.value?.cachedWasNine ? 0 : 1);
