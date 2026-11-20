import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9244;
const url = process.env.OFFICE_QA_URL ?? 'http://127.0.0.1:4399/index.html';
const evidence = 'D:/Projects/open-erp/docs/sprints/sprint_12_office_webapp/08_testing/evidence';
const out = `${evidence}/word-view-layout.png`;
const downloadPath = path.join(process.env.TEMP ?? '.', 'office-view-downloads');
fs.rmSync(downloadPath, { recursive: true, force: true });
fs.mkdirSync(downloadPath, { recursive: true });
const userData = path.join(process.env.TEMP ?? '.', 'edge-office-view-layout');
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
const errors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') {
    errors.push(message.params?.exceptionDetails?.exception?.description ?? message.params?.exceptionDetails?.text ?? 'exception');
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error') {
    errors.push(message.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
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
await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(2500);

const action = `(async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const response = await fetch('/samples/sample.docx');
  const transfer = new DataTransfer();
  transfer.items.add(new File([await response.arrayBuffer()], 'sample.docx'));
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: transfer, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) { if (document.querySelector('.op-word-page')) break; await wait(250); }
  await wait(1200);

  const clickTab = (label) => {
    const tab = [...document.querySelectorAll('.op-tab')].find((item) => item.textContent.trim() === label);
    tab?.click();
    return Boolean(tab);
  };
  const button = (label) => [...document.querySelectorAll('.op-ribbon button')]
    .find((item) => item.title === label || item.textContent.trim() === label);
  const click = (label) => { const item = button(label); item?.click(); return Boolean(item); };
  const active = (label) => Boolean(button(label)?.classList.contains('op-rb-active'));
  const stage = () => document.querySelector('.op-word-stage');

  clickTab('Xem');
  await wait(300);
  const webFound = click('Bố cục Web');
  await wait(900);
  const webOn = stage()?.classList.contains('op-word-web') ?? false;
  const webContinuous = stage()?.classList.contains('op-word-continuous') ?? false;
  const webActive = active('Bố cục Web');
  const pagesBefore = document.querySelectorAll('.op-word-page').length;
  const pageBox = document.querySelector('.op-word-page')?.getBoundingClientRect();
  const stageBox = stage()?.getBoundingClientRect();
  const pageFillsStage = Boolean(pageBox && stageBox && pageBox.width >= stageBox.width - 30);

  const printFound = click('Bố cục in');
  await wait(900);
  const printOffWeb = !(stage()?.classList.contains('op-word-web') ?? true);
  const printSeparate = !(stage()?.classList.contains('op-word-continuous') ?? true);
  const printActive = active('Bố cục in');

  clickTab('Bố cục');
  await wait(300);
  const hyphenSelect = [...document.querySelectorAll('.op-ribbon select')].find((node) => node.title === 'Ngắt từ');
  hyphenSelect.value = 'automatic';
  hyphenSelect.dispatchEvent(new Event('change', { bubbles: true }));
  await wait(700);
  const hyphenClass = stage()?.classList.contains('op-word-hyphenate') ?? false;
  const hyphenStyle = getComputedStyle(document.querySelector('.op-word-p')).hyphens;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true, cancelable: true }));
  await wait(3500);

  return {
    webFound, webOn, webContinuous, webActive, pageFillsStage, pagesBefore,
    printFound, printOffWeb, printSeparate, printActive,
    hyphenClass, hyphenStyle,
    state: document.querySelector('.op-save-state')?.textContent ?? null,
    error: document.querySelector('.op-error')?.innerText.replace(/\\s+/g, ' ').trim() ?? null,
  };
})()`;

const evaluated = await send('Runtime.evaluate', { expression: action, awaitPromise: true, returnByValue: true });
const result = evaluated.result?.value;
console.log(JSON.stringify(result, null, 2));
console.log('errors', JSON.stringify(errors));

let downloaded = null;
for (let attempt = 0; attempt < 40; attempt++) {
  const files = fs.readdirSync(downloadPath).filter((name) => name.endsWith('.docx'));
  if (files.length) {
    downloaded = path.join(downloadPath, files[0]);
    break;
  }
  await sleep(500);
}
console.log('downloaded', downloaded);
let persisted = null;
if (downloaded) {
  const probe = path.join(process.env.TEMP ?? '.', 'inspect-hyphen.py');
  fs.writeFileSync(probe, [
    'import sys, zipfile',
    'with zipfile.ZipFile(sys.argv[1]) as z:',
    "    settings = z.read('word/settings.xml').decode('utf-8') if 'word/settings.xml' in z.namelist() else ''",
    "    rels = z.read('word/_rels/document.xml.rels').decode('utf-8')",
    "    print('auto=' + str('w:autoHyphenation' in settings).lower())",
    "    print('rel=' + str('settings.xml' in rels).lower())",
  ].join('\n'));
  const { execFileSync } = await import('node:child_process');
  const output = execFileSync('python', [probe, downloaded], { encoding: 'utf8' }).trim();
  persisted = { autoHyphenation: output.includes('auto=true'), settingsRel: output.includes('rel=true'), output };
  console.log('persisted', JSON.stringify(persisted));
}

const passed = result?.webFound && result?.webOn && result?.webContinuous && result?.webActive && result?.pageFillsStage
  && result?.printFound && result?.printOffWeb && result?.printSeparate && result?.printActive
  && result?.hyphenClass && result?.hyphenStyle === 'auto'
  && persisted?.autoHyphenation === true && persisted?.settingsRel === true
  && errors.length === 0;
fs.mkdirSync(evidence, { recursive: true });
fs.writeFileSync(`${evidence}/word-view-layout.json`,
  JSON.stringify({ generated_at: new Date().toISOString(), passed, result, persisted, errors }, null, 2));
console.log('QA', passed ? 'PASS' : 'FAIL');
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
fs.writeFileSync(out, Buffer.from(shot.data, 'base64'));
console.log('saved', out, fs.statSync(out).size);
socket.close();
child.kill();
process.exit(passed ? 0 : 1);
