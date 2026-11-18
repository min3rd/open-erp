import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9254;
const png = path.resolve(process.argv[2]);
const userData = path.join(process.env.TEMP ?? '.', 'edge-ink-measure');
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
const child = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
  '--allow-file-access-from-files', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${userData}`, '--window-size=1000,1400', 'about:blank',
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
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
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
await send('Emulation.setDeviceMetricsOverride', { width: 1000, height: 1400, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `file:///${png.replace(/\\/g, '/')}` });
await sleep(1500);

const result = await send('Runtime.evaluate', {
  expression: `(() => {
    const img = document.querySelector('img');
    if (!img) return { error: 'no image' };
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;
    const at = (x, y) => {
      const i = (y * width + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };
    // Page rect: rows containing a wide contiguous white run (PDF page), ignoring viewer chrome.
    let top = -1, bottom = -1, left = -1, right = -1;
    let bestRunSum = 0, bestRunCount = 0;
    const runs = [];
    for (let y = 0; y < height; y++) {
      let runStart = -1;
      let runLength = 0;
      let bestStart = -1;
      let bestLength = 0;
      for (let x = 0; x < width; x++) {
        const [r, g, b] = at(x, y);
        const white = r > 240 && g > 240 && b > 240;
        if (white) {
          if (runStart < 0) runStart = x;
          runLength++;
        } else {
          if (runLength > bestLength) { bestLength = runLength; bestStart = runStart; }
          runStart = -1;
          runLength = 0;
        }
      }
      if (runLength > bestLength) { bestLength = runLength; bestStart = runStart; }
      if (bestLength > 450 && bestLength < 900) {
        runs.push({ y, start: bestStart, end: bestStart + bestLength - 1, length: bestLength });
      }
    }
    // First contiguous block of page-like rows.
    let blockStart = 0;
    for (let i = 0; i < runs.length; i++) {
      if (i === 0 || runs[i].y - runs[i - 1].y > 2) blockStart = i;
      if (runs[i].y - runs[blockStart].y > 300) break;
    }
    const block = [];
    for (let i = blockStart; i < runs.length; i++) {
      if (i > blockStart && runs[i].y - runs[i - 1].y > 2) break;
      block.push(runs[i]);
    }
    if (block.length) {
      top = block[0].y;
      bottom = block[block.length - 1].y;
      left = Math.min(...block.map((row) => row.start));
      right = Math.max(...block.map((row) => row.end));
    }
    const boxes = {};
    const add = (name, x, y) => {
      const box = boxes[name] ?? (boxes[name] = { minX: width, minY: height, maxX: 0, maxY: 0, count: 0 });
      box.minX = Math.min(box.minX, x); box.maxX = Math.max(box.maxX, x);
      box.minY = Math.min(box.minY, y); box.maxY = Math.max(box.maxY, y);
      box.count++;
    };
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const [r, g, b] = at(x, y);
        if (b > 200 && g > 200 && r < 120) add('cyan', x, y);
        else if (r > 200 && g > 100 && g < 210 && b < 90) add('orange', x, y);
        else if (r > 100 && r < 200 && b > 200 && g < 90) add('purple', x, y);
        else if (g > 200 && r > 100 && r < 210 && b < 90) add('lime', x, y);
      }
    }
    return { width, height, page: { top, bottom, left, right }, boxes };
  })()`,
  returnByValue: true,
});
console.log(JSON.stringify(result.result?.value, null, 2));
socket.close();
child.kill();
process.exit(0);
