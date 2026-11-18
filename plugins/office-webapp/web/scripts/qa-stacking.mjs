import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9235;
const url = process.argv[2] ?? 'http://localhost:4349';
const out = process.argv[3] ?? 'plugins/office-webapp/web/.tmp/stacking.png';
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-stacking');
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
    await wait(1600);
  })()`;
  await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
};

await drop('stacking-sample.docx');
const stacking = await send('Runtime.evaluate', {
  expression: `(() => {
    const page = document.querySelector('.op-word-page');
    const pageRect = page?.getBoundingClientRect();
    const overlay = [...document.querySelectorAll('.op-word-float')].map((node) => ({
      text: node.textContent.replace(/\\s+/g, ' ').trim(),
      z: getComputedStyle(node).zIndex,
      top: pageRect ? Math.round(node.getBoundingClientRect().top - pageRect.top) : null,
      position: getComputedStyle(node).position,
    }));
    const block = document.querySelector('.op-word-float-block');
    const blockRect = block?.getBoundingClientRect();
    const after = [...document.querySelectorAll('.op-word-p')].find((node) => node.textContent.includes('Sau top and bottom'));
    const afterRect = after?.getBoundingClientRect();
    return {
      overlay,
      behind: overlay.find((item) => item.text.includes('Behind')) ?? null,
      front: overlay.find((item) => item.text.includes('Front')) ?? null,
      blockCount: document.querySelectorAll('.op-word-float-block').length,
      blockDisplay: block ? getComputedStyle(block).display : null,
      blockPosition: block ? getComputedStyle(block).position : null,
      blockTop: blockRect ? Math.round(blockRect.top - (pageRect?.top ?? 0)) : null,
      blockExpected: 96 + 300,
      exactY: Boolean(blockRect && pageRect && Math.abs((blockRect.top - pageRect.top) - (96 + 300)) <= 2),
      blockBottom: blockRect ? Math.round(blockRect.bottom - (pageRect?.top ?? 0)) : null,
      afterTop: afterRect ? Math.round(afterRect.top - (pageRect?.top ?? 0)) : null,
      belowBlock: Boolean(blockRect && afterRect && afterRect.top >= blockRect.bottom - 2),
      error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`,
  returnByValue: true,
});
console.log('stacking', JSON.stringify(stacking.result?.value, null, 2));

await send('Page.navigate', { url });
await sleep(1800);
await drop('wrap-sample.docx');
const wrap = await send('Runtime.evaluate', {
  expression: `(() => {
    const page = document.querySelector('.op-word-page');
    const pageRect = page?.getBoundingClientRect();
    const node = document.querySelector('.op-word-float-wrap');
    const rect = node?.getBoundingClientRect();
    const style = node ? getComputedStyle(node) : null;
    const longP = [...document.querySelectorAll('.op-word-p')].find((item) => item.textContent.includes('Đoạn văn bản dài'));
    let wrappedLines = 0;
    if (longP && rect) {
      const walker = document.createTreeWalker(longP, NodeFilter.SHOW_TEXT);
      const textNode = walker.nextNode();
      if (textNode) {
        const range = document.createRange();
        range.selectNodeContents(textNode);
        wrappedLines = [...range.getClientRects()].filter((line) => line.left >= rect.right - 4).length;
      }
    }
    return {
      count: document.querySelectorAll('.op-word-float-wrap').length,
      marginTop: style?.marginTop ?? null,
      top: rect && pageRect ? Math.round(rect.top - pageRect.top) : null,
      float: style?.float ?? null,
      expectedTop: 96 + 100,
      wrappedLines,
      error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`,
  returnByValue: true,
});
console.log('wrap', JSON.stringify(wrap.result?.value, null, 2));

await send('Page.navigate', { url });
await sleep(1800);
await drop('above-anchor.docx');
const above = await send('Runtime.evaluate', {
  expression: `(() => {
    const page = document.querySelector('.op-word-page');
    const pageRect = page?.getBoundingClientRect();
    const wrap = document.querySelector('.op-word-float-wrap');
    const wrapRect = wrap?.getBoundingClientRect();
    const before = [...document.querySelectorAll('.op-word-p')].find((item) => item.textContent.includes('Đoạn văn bản dài'));
    const beforeRect = before?.getBoundingClientRect();
    const inline = document.querySelector('.op-word-float-inline');
    const block = document.querySelector('.op-word-float-block');
    const floatEl = inline ?? block;
    const floatRect = floatEl?.getBoundingClientRect();
    const topAnchor = [...document.querySelectorAll('.op-word-p')].find((item) => item.textContent.includes('Đoạn trước top and bottom thêm'));
    const topAnchorRect = topAnchor?.getBoundingClientRect();
    const after = [...document.querySelectorAll('.op-word-p')].find((item) => item.textContent.includes('Sau top and bottom phía trên anchor'));
    const afterRect = after?.getBoundingClientRect();
    return {
      wrapTop: wrapRect && pageRect ? Math.round(wrapRect.top - pageRect.top) : null,
      wrapExpected: 96 + 50,
      beforeTop: beforeRect && pageRect ? Math.round(beforeRect.top - pageRect.top) : null,
      wrapAboveAnchor: Boolean(wrapRect && beforeRect && wrapRect.top < beforeRect.top),
      inlineCount: document.querySelectorAll('.op-word-float-inline').length,
      blockCount: document.querySelectorAll('.op-word-float-block').length,
      blockTop: floatRect && pageRect ? Math.round(floatRect.top - pageRect.top) : null,
      blockExpected: 96 + 30,
      anchorTop: topAnchorRect && pageRect ? Math.round(topAnchorRect.top - pageRect.top) : null,
      blockAboveAnchor: Boolean(floatRect && topAnchorRect && floatRect.top < topAnchorRect.top),
      blockBottom: floatRect && pageRect ? Math.round(floatRect.bottom - pageRect.top) : null,
      afterTop: afterRect && pageRect ? Math.round(afterRect.top - pageRect.top) : null,
      belowBlock: Boolean(floatRect && afterRect && afterRect.top >= floatRect.bottom - 2),
      error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`,
  returnByValue: true,
});
console.log('above', JSON.stringify(above.result?.value, null, 2));

await send('Page.navigate', { url });
await sleep(1800);
await drop('multi-float.docx');
const multi = await send('Runtime.evaluate', {
  expression: `(() => {
    const page = document.querySelector('.op-word-page');
    const pageRect = page?.getBoundingClientRect();
    const nodes = [...document.querySelectorAll('.op-word-float-wrap')].map((node) => ({
      text: node.textContent.replace(/\\s+/g, ' ').trim(),
      top: pageRect ? Math.round(node.getBoundingClientRect().top - pageRect.top) : null,
      marginTop: getComputedStyle(node).marginTop,
      float: getComputedStyle(node).float,
    }));
    return {
      count: nodes.length,
      nodes,
      expected: [96 + 100, 96 + 300],
      error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`,
  returnByValue: true,
});
console.log('multi', JSON.stringify(multi.result?.value, null, 2));

await send('Page.navigate', { url });
await sleep(1800);
await drop('crossing-sample.docx');
const crossing = await send('Runtime.evaluate', {
  expression: `(() => {
    const page = document.querySelector('.op-word-page');
    const pageRect = page?.getBoundingClientRect();
    const inline = document.querySelector('.op-word-float-inline');
    const inlineRect = inline?.getBoundingClientRect();
    const paragraph = inline?.closest('.op-word-p');
    let beforeLines = 0;
    let afterLines = 0;
    if (paragraph && inlineRect) {
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (!node.parentElement?.closest('.op-word-float-inline')) {
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            if (rect.bottom <= inlineRect.top + 2) beforeLines++;
            if (rect.top >= inlineRect.bottom - 2) afterLines++;
          }
        }
        node = walker.nextNode();
      }
    }
    return {
      inlineCount: document.querySelectorAll('.op-word-float-inline').length,
      blockCount: document.querySelectorAll('.op-word-float-block').length,
      insideParagraph: inline?.parentElement?.tagName ?? null,
      inlineTop: inlineRect && pageRect ? Math.round(inlineRect.top - pageRect.top) : null,
      inlineBottom: inlineRect && pageRect ? Math.round(inlineRect.bottom - pageRect.top) : null,
      beforeLines,
      afterLines,
      error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`,
  returnByValue: true,
});
console.log('crossing', JSON.stringify(crossing.result?.value, null, 2));

await send('Page.navigate', { url });
await sleep(1800);
await drop('crossing-rich.docx');
const rich = await send('Runtime.evaluate', {
  expression: `(() => {
    const page = document.querySelector('.op-word-page');
    const pageRect = page?.getBoundingClientRect();
    const inline = document.querySelector('.op-word-float-inline');
    const inlineRect = inline?.getBoundingClientRect();
    const paragraph = inline?.closest('.op-word-p');
    const textbox = paragraph?.querySelector('.op-word-textbox');
    const textboxRect = textbox?.getBoundingClientRect();
    return {
      inlineCount: document.querySelectorAll('.op-word-float-inline').length,
      blockCount: document.querySelectorAll('.op-word-float-block').length,
      insideParagraph: inline?.parentElement?.tagName ?? null,
      textboxInParagraph: Boolean(textbox),
      textboxAfterInline: Boolean(textbox && inline && (inline.compareDocumentPosition(textbox) & Node.DOCUMENT_POSITION_FOLLOWING)),
      textboxTop: textboxRect && pageRect ? Math.round(textboxRect.top - pageRect.top) : null,
      inlineTop: inlineRect && pageRect ? Math.round(inlineRect.top - pageRect.top) : null,
      textPreserved: Boolean(paragraph?.textContent.includes('Đoạn văn bản dài')),
      error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`,
  returnByValue: true,
});
console.log('richCrossing', JSON.stringify(rich.result?.value, null, 2));

await send('Page.navigate', { url });
await sleep(1800);
await drop('boundary-sample.docx');
const boundary = await send('Runtime.evaluate', {
  expression: `(() => {
    const page = document.querySelector('.op-word-page');
    const pageRect = page?.getBoundingClientRect();
    const block = document.querySelector('.op-word-float-block');
    const blockRect = block?.getBoundingClientRect();
    const crossing = [...document.querySelectorAll('.op-word-p')].find((item) => item.textContent.includes('Đoạn văn bản dài'));
    const crossingRect = crossing?.getBoundingClientRect();
    const before = [...document.querySelectorAll('.op-word-p')].find((item) => item.textContent.includes('Trước boundary'));
    const beforeRect = before?.getBoundingClientRect();
    return {
      blockCount: document.querySelectorAll('.op-word-float-block').length,
      blockTop: blockRect && pageRect ? Math.round(blockRect.top - pageRect.top) : null,
      blockBottom: blockRect && pageRect ? Math.round(blockRect.bottom - pageRect.top) : null,
      expectedTop: 96 + 93,
      crossingTop: crossingRect && pageRect ? Math.round(crossingRect.top - pageRect.top) : null,
      beforeTop: beforeRect && pageRect ? Math.round(beforeRect.top - pageRect.top) : null,
      beforeAboveFloat: Boolean(beforeRect && blockRect && beforeRect.bottom <= blockRect.top + 2),
      crossingBelowFloat: Boolean(crossingRect && blockRect && crossingRect.top >= blockRect.bottom - 2),
      error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
    };
  })()`,
  returnByValue: true,
});
console.log('boundary', JSON.stringify(boundary.result?.value, null, 2));

console.log('exceptions', JSON.stringify(exceptions));

const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(0);
