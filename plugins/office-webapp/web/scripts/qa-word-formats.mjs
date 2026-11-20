import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', '..', '..', '..');
const desktopRoot = path.join(root, 'plugins', 'office-webapp', 'src', 'main', 'resources', 'META-INF', 'resources');
const mobileRoot = path.join(root, 'src', 'frontend', 'mobile', 'dist', 'app', 'browser');
const samplesRoot = path.join(root, 'plugins', 'office-webapp', 'web', 'samples');
const evidenceDir = path.join(root, 'docs', 'sprints', 'sprint_12_office_webapp', '08_testing', 'evidence');
fs.mkdirSync(evidenceDir, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.wasm': 'application/wasm',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  '.doc': 'application/msword',
  '.rtf': 'application/rtf',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.xml': 'application/xml',
  '.docm': 'application/vnd.ms-word.document.macroEnabled.12',
};

function createStaticServer(docRoot, { spaFallback = false } = {}) {
  return http.createServer((req, res) => {
    const clean = decodeURIComponent((req.url ?? '/').split('?')[0]);
    if (clean.startsWith('/samples/')) {
      const sampleFile = path.resolve(samplesRoot, clean.slice('/samples/'.length));
      if (!sampleFile.startsWith(samplesRoot) || !fs.existsSync(sampleFile) || fs.statSync(sampleFile).isDirectory()) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      const ext = path.extname(sampleFile).toLowerCase();
      res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
      fs.createReadStream(sampleFile).pipe(res);
      return;
    }

    const rel = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
    let target = path.resolve(docRoot, rel);
    if (!target.startsWith(docRoot)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      if (spaFallback && !path.extname(rel)) {
        target = path.join(docRoot, 'index.html');
      } else if (clean === '/favicon.ico') {
        res.statusCode = 204;
        res.end();
        return;
      } else {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
    }
    const ext = path.extname(target).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] ?? 'application/octet-stream');
    fs.createReadStream(target).pipe(res);
  });
}

function listenServer(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve(typeof addr === 'object' && addr ? addr.port : 0);
    });
  });
}

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cdpPort = 9246;
const userData = path.join(process.env.TEMP ?? '.', `edge-qa-word-formats-${Date.now()}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForPageTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
      const page = list.find((item) => item.type === 'page' && item.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* retrying */ }
    await sleep(350);
  }
  throw new Error('EDGE_CDP_NOT_READY');
}

function assert(cond, message) {
  if (!cond) throw new Error(`ASSERTION_FAILED: ${message}`);
}

const desktopServer = createStaticServer(desktopRoot);
const mobileServer = createStaticServer(mobileRoot, { spaFallback: true });
let child;
let socket;

try {
  const desktopPort = await listenServer(desktopServer);
  const mobilePort = await listenServer(mobileServer);

  child = spawn(edgePath, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
    '--no-default-browser-check', '--disable-features=msEdgeFirstRunExperience',
    `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${userData}`, '--window-size=1440,1000', 'about:blank',
  ], { stdio: 'ignore' });

  const target = await waitForPageTarget();
  socket = new WebSocket(target.webSocketDebuggerUrl);
  let counter = 0;
  const pending = new Map();
  const consoleErrors = [];
  let activeScope = 'boot';

  socket.addEventListener('message', (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push({ scope: activeScope, kind: 'exception', text: msg.params?.exceptionDetails?.text ?? 'exception' });
    } else if (msg.method === 'Runtime.consoleAPICalled' && (msg.params?.type === 'error' || msg.params?.type === 'assert')) {
      const args = (msg.params.args ?? []).map((a) => a.value ?? a.description ?? '').join(' ');
      consoleErrors.push({ scope: activeScope, kind: `console.${msg.params.type}`, text: args });
    } else if (msg.method === 'Log.entryAdded' && msg.params?.entry?.level === 'error') {
      const url = msg.params.entry.url ?? '';
      const isOptionalCalibration = /\/word-calibration\/[0-9a-f]+\.json$|-calibration\.json$/i.test(url);
      if (!isOptionalCalibration) {
        consoleErrors.push({ scope: activeScope, kind: 'log.error', text: `${msg.params.entry.text} (${url})` });
      }
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
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
  await send('Log.enable');

  const evalJs = async (expression) => {
    const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (res.exceptionDetails) {
      throw new Error(`EVAL_EXCEPTION: ${res.exceptionDetails.text ?? JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  };

  const capturePng = async (filename) => {
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(evidenceDir, filename), Buffer.from(shot.data, 'base64'));
  };

  const report = { date: new Date().toISOString(), desktop: {}, mobile: {}, consoleErrors };

  // =========================================================================
  // 1. DESKTOP TESTS (1440x1000)
  // =========================================================================
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });

  async function openDesktopSample(sampleName, { expectError = false, reload = true } = {}) {
    if (reload) {
      await send('Page.navigate', { url: `http://127.0.0.1:${desktopPort}/index.html` });
      for (let i = 0; i < 60; i++) {
        const ready = await evalJs(`Boolean(document.querySelector('.op-office-root') && document.querySelector('.op-start'))`);
        if (ready) break;
        await sleep(250);
      }
      await sleep(300);
    }
    return evalJs(`(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const prevTitle = document.querySelector('.op-file-name')?.textContent?.trim() ?? '';
      const resp = await fetch('/samples/${sampleName}');
      if (!resp.ok) throw new Error('HTTP_' + resp.status + ' for ${sampleName}');
      const file = new File([await resp.arrayBuffer()], '${sampleName}');
      const dt = new DataTransfer();
      dt.items.add(file);
      const targetEl = document.querySelector('.op-office-root');
      targetEl.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
      const expectError = ${expectError};
      for (let i = 0; i < 120; i++) {
        const curErr = document.querySelector('.op-error');
        const curPage = document.querySelector('.op-word-page');
        const curName = document.querySelector('.op-file-name')?.textContent?.trim() ?? '';
        if (expectError && curErr) break;
        if (!expectError && curPage && (${reload} || curName !== prevTitle || curName.includes('${sampleName}'))) break;
        await wait(200);
      }
      for (let i = 0; i < 60; i++) {
        if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break;
        if (document.querySelector('.op-error')) break;
        await wait(150);
      }
      await wait(450);
      const pages = [...document.querySelectorAll('.op-word-page')];
      const text = pages.map((p) => (p.textContent || '')).join(' ').replace(/\\s+/g, ' ').trim().normalize('NFC');
      const imgs = [...document.querySelectorAll('img.op-word-image')].map((img) => ({
        w: img.naturalWidth,
        h: img.naturalHeight,
        complete: img.complete,
      }));
      const warningEl = document.querySelector('.op-warning-banner');
      const warningText = warningEl?.textContent?.replace(/\\s+/g, ' ').trim() ?? '';
      const warningButtons = [...document.querySelectorAll('.op-warning-actions button')].map((b) => b.textContent?.trim() ?? '');
      const errorEl = document.querySelector('.op-error');
      const errorText = errorEl?.textContent?.replace(/\\s+/g, ' ').trim() ?? '';
      return {
        docName: document.querySelector('.op-file-name')?.textContent?.trim() ?? '',
        pages: pages.length,
        tables: document.querySelectorAll('.op-word-page table').length,
        imgs,
        loadedImgs: imgs.filter((x) => x.complete && x.w > 0).length,
        warningCount: document.querySelectorAll('.op-warning-banner').length,
        warningText,
        warningButtons,
        errorText,
        editableCount: document.querySelectorAll('.op-word-page [contenteditable="true"], .op-word-page[contenteditable="true"]').length,
        mathCount: document.querySelectorAll('.op-equation-inline math, math').length,
        chartSvgCount: document.querySelectorAll('.op-word-chart svg').length,
        unsupportedImgCount: document.querySelectorAll('.op-word-unsupported-img').length,
        hfTableCount: document.querySelectorAll('.op-hf-table').length,
        columnContainerCount: document.querySelectorAll('.op-word-columns').length,
        noteCount: document.querySelectorAll('.op-word-notes').length,
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
        rawI18nLeaks: /\\boffice\\.(error|warning|word|mobile|action|workspace)\\./.test(document.body.textContent ?? ''),
        hasExpectedViHeading: text.includes('Báo cáo kiểm thử đa định dạng Word'),
        hasExpectedViBody: text.includes('Đọc tài liệu Word đa định dạng'),
        textPreview: text.slice(0, 260),
      };
    })()`);
  }

  // 1a. DOCX real + root DnD switch to RTF without reload
  activeScope = 'desktop:qa-formats-real.docx';
  const docxRes = await openDesktopSample('qa-formats-real.docx');
  assert(docxRes.pages >= 1, 'docx must render >= 1 page');
  assert(docxRes.hasExpectedViHeading && docxRes.hasExpectedViBody, `docx missing expected Vietnamese text: ${docxRes.textPreview}`);
  assert(docxRes.tables >= 1, 'docx must render table');
  assert(docxRes.loadedImgs >= 1, `docx embedded PNG failed to load: ${JSON.stringify(docxRes.imgs)}`);
  assert(docxRes.warningCount === 0, `docx unexpected warning banner: ${docxRes.warningText}`);
  assert(!docxRes.rawI18nLeaks, 'docx raw i18n key leak');
  report.desktop['qa-formats-real.docx'] = docxRes;
  console.log('[desktop] qa-formats-real.docx PASS', { pages: docxRes.pages, tables: docxRes.tables, loadedImgs: docxRes.loadedImgs });

  activeScope = 'desktop:root-dnd-switch-to-rtf';
  const dndSwitchRes = await openDesktopSample('qa-formats-real.rtf', { reload: false });
  assert(dndSwitchRes.pages >= 1, 'root DnD switch to .rtf failed to render');
  assert(dndSwitchRes.hasExpectedViHeading, `root DnD .rtf text mismatch: ${dndSwitchRes.textPreview}`);
  assert(dndSwitchRes.warningCount >= 1 && dndSwitchRes.warningButtons.length === 2, 'root DnD .rtf missing readonly banner');
  report.desktop['root-dnd-switch-rtf'] = dndSwitchRes;
  console.log('[desktop] root-dnd-switch-rtf PASS');

  // 1b. DOC real + convertLegacyToEditable test
  activeScope = 'desktop:qa-formats-real.doc';
  const docRes = await openDesktopSample('qa-formats-real.doc');
  assert(docRes.pages >= 1, 'doc must render >= 1 page');
  assert(docRes.hasExpectedViHeading && docRes.hasExpectedViBody, `doc missing Vietnamese text: ${docRes.textPreview}`);
  assert(docRes.tables >= 1, `doc missing table (${docRes.tables})`);
  assert(docRes.loadedImgs >= 1, `doc missing embedded image: ${JSON.stringify(docRes.imgs)}`);
  assert(docRes.warningCount >= 1 && docRes.warningButtons.length === 2, `doc missing legacy banner/actions: ${JSON.stringify(docRes)}`);
  assert(!docRes.rawI18nLeaks, 'doc raw i18n key leak');
  await capturePng('qa-desktop-doc.png');

  const afterConvert = await evalJs(`(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const btn = document.querySelector('.op-warning-actions button:nth-child(2)');
    if (!btn) return { clicked: false };
    btn.click();
    for (let i = 0; i < 40; i++) {
      if (document.querySelectorAll('.op-warning-actions button').length === 0) break;
      await wait(100);
    }
    await wait(250);
    const text = [...document.querySelectorAll('.op-word-page')].map((p) => p.textContent || '').join(' ').replace(/\\s+/g, ' ').trim().normalize('NFC');
    return {
      clicked: true,
      docName: document.querySelector('.op-file-name')?.textContent?.trim() ?? '',
      pages: document.querySelectorAll('.op-word-page').length,
      tables: document.querySelectorAll('.op-word-page table').length,
      warningActionButtons: document.querySelectorAll('.op-warning-actions button').length,
      editableCount: document.querySelectorAll('.op-word-page [contenteditable="true"], .op-word-page[contenteditable="true"]').length,
      hasExpectedViHeading: text.includes('Báo cáo kiểm thử đa định dạng Word'),
    };
  })()`);
  assert(afterConvert.clicked, 'convertLegacyToEditable button missing');
  assert(afterConvert.warningActionButtons === 0, 'legacy action buttons still present after conversion');
  assert(afterConvert.editableCount >= 1, 'converted doc not editable');
  assert(afterConvert.docName.includes('.docx'), `converted docName expected .docx, got ${afterConvert.docName}`);
  assert(afterConvert.hasExpectedViHeading && afterConvert.tables >= 1, 'converted doc lost content');
  report.desktop['qa-formats-real.doc'] = { ...docRes, afterConvert };
  console.log('[desktop] qa-formats-real.doc + convertLegacyToEditable PASS', { docName: afterConvert.docName, editableCount: afterConvert.editableCount });

  // 1c. RTF real
  activeScope = 'desktop:qa-formats-real.rtf';
  const rtfRes = await openDesktopSample('qa-formats-real.rtf');
  assert(rtfRes.pages >= 1 && rtfRes.hasExpectedViHeading && rtfRes.hasExpectedViBody, `rtf text check failed: ${rtfRes.textPreview}`);
  assert(rtfRes.tables >= 1, 'rtf missing table');
  assert(rtfRes.loadedImgs >= 1, `rtf missing image: ${JSON.stringify(rtfRes.imgs)}`);
  assert(rtfRes.warningCount >= 1 && rtfRes.warningButtons.length === 2, 'rtf missing legacy banner');
  assert(!rtfRes.rawI18nLeaks, 'rtf raw i18n key leak');
  await capturePng('qa-desktop-rtf.png');
  report.desktop['qa-formats-real.rtf'] = rtfRes;
  console.log('[desktop] qa-formats-real.rtf PASS', { loadedImgs: rtfRes.loadedImgs, tables: rtfRes.tables });

  // 1d. ODT real
  activeScope = 'desktop:qa-formats-real.odt';
  const odtRes = await openDesktopSample('qa-formats-real.odt');
  assert(odtRes.pages >= 1 && odtRes.hasExpectedViHeading && odtRes.hasExpectedViBody, `odt text check failed: ${odtRes.textPreview}`);
  assert(odtRes.tables >= 1, 'odt missing table');
  assert(odtRes.warningCount >= 1 && odtRes.warningButtons.length === 2, 'odt missing legacy banner');
  assert(!odtRes.rawI18nLeaks, 'odt raw i18n key leak');
  await capturePng('qa-desktop-odt.png');
  report.desktop['qa-formats-real.odt'] = odtRes;
  console.log('[desktop] qa-formats-real.odt PASS', { loadedImgs: odtRes.loadedImgs, tables: odtRes.tables });

  // 1e. DOTX real
  activeScope = 'desktop:qa-formats-real.dotx';
  const dotxRes = await openDesktopSample('qa-formats-real.dotx');
  assert(dotxRes.pages >= 1 && dotxRes.hasExpectedViHeading && dotxRes.tables >= 1, `dotx check failed: ${dotxRes.textPreview}`);
  assert(dotxRes.warningCount >= 1 && (dotxRes.warningText.includes('mẫu Word') || /template/i.test(dotxRes.warningText)), `dotx missing template notice: ${dotxRes.warningText}`);
  assert(dotxRes.warningButtons.length === 0, `dotx should be editable template (no legacy readonly buttons), got ${JSON.stringify(dotxRes.warningButtons)}`);
  assert(!dotxRes.rawI18nLeaks, 'dotx raw i18n key leak');
  report.desktop['qa-formats-real.dotx'] = dotxRes;
  console.log('[desktop] qa-formats-real.dotx PASS', { warningText: dotxRes.warningText });

  // 1f. Flat OPC XML & Word 2003 XML
  activeScope = 'desktop:qa-formats-real.xml';
  const xmlRes = await openDesktopSample('qa-formats-real.xml');
  assert(xmlRes.pages >= 1 && xmlRes.hasExpectedViHeading && xmlRes.tables >= 1, `flat opc xml check failed: ${xmlRes.textPreview}`);
  assert(!xmlRes.rawI18nLeaks, 'xml raw i18n key leak');
  report.desktop['qa-formats-real.xml'] = xmlRes;
  console.log('[desktop] qa-formats-real.xml PASS', { tables: xmlRes.tables, loadedImgs: xmlRes.loadedImgs });

  activeScope = 'desktop:qa-formats-word2003.xml';
  const w2003Res = await openDesktopSample('qa-formats-word2003.xml');
  assert(w2003Res.pages >= 1 && w2003Res.hasExpectedViHeading && w2003Res.tables >= 1, `word2003 xml check failed: ${w2003Res.textPreview}`);
  assert(w2003Res.warningCount >= 1 && w2003Res.warningButtons.length === 2, 'word2003 xml missing legacy banner');
  assert(!w2003Res.rawI18nLeaks, 'word2003 raw i18n key leak');
  report.desktop['qa-formats-word2003.xml'] = w2003Res;
  console.log('[desktop] qa-formats-word2003.xml PASS', { tables: w2003Res.tables });

  // 1g. Rich OOXML features fixture
  activeScope = 'desktop:qa-formats-rich.docx';
  const richRes = await openDesktopSample('qa-formats-rich.docx');
  assert(richRes.pages >= 1, 'rich.docx failed to render');
  assert(richRes.mathCount >= 1, `rich.docx missing <math>: ${JSON.stringify(richRes)}`);
  assert(richRes.chartSvgCount >= 1, `rich.docx missing SVG chart: ${JSON.stringify(richRes)}`);
  assert(richRes.unsupportedImgCount >= 1, `rich.docx missing EMF unsupported notice: ${JSON.stringify(richRes)}`);
  assert(richRes.hfTableCount >= 1, `rich.docx missing header/footer table: ${JSON.stringify(richRes)}`);
  assert(richRes.columnContainerCount >= 1, `rich.docx missing multi-column container: ${JSON.stringify(richRes)}`);
  assert(richRes.noteCount >= 1, `rich.docx missing footnotes container: ${JSON.stringify(richRes)}`);
  assert(richRes.warningCount >= 1, 'rich.docx missing vector image warning');
  assert(!richRes.rawI18nLeaks, 'rich.docx raw i18n key leak');
  await capturePng('qa-desktop-rich.png');
  report.desktop['qa-formats-rich.docx'] = richRes;
  console.log('[desktop] qa-formats-rich.docx PASS', {
    math: richRes.mathCount,
    charts: richRes.chartSvgCount,
    emfNotice: richRes.unsupportedImgCount,
    hfTable: richRes.hfTableCount,
    columns: richRes.columnContainerCount,
    notes: richRes.noteCount,
  });

  // 1h. Macro DOCM rejection
  activeScope = 'desktop:qa-formats-macro.docm';
  const docmRes = await openDesktopSample('qa-formats-macro.docm', { expectError: true });
  assert(docmRes.errorText.includes('OFFICE_MACRO_FILE_UNSUPPORTED'), `docm error missing code: ${docmRes.errorText}`);
  assert(docmRes.errorText.length > 'OFFICE_MACRO_FILE_UNSUPPORTED'.length + 5, `docm missing localized message: ${docmRes.errorText}`);
  assert(!docmRes.rawI18nLeaks, 'docm raw i18n key leak');
  await capturePng('qa-desktop-macro-error.png');
  report.desktop['qa-formats-macro.docm'] = docmRes;
  console.log('[desktop] qa-formats-macro.docm PASS', { errorText: docmRes.errorText });

  // =========================================================================
  // 2. MOBILE IONIC VIEWER TESTS (390x844)
  // =========================================================================
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844,
  });

  async function openMobileSample(sampleName, { expectError = false } = {}) {
    await send('Page.navigate', { url: `http://127.0.0.1:${mobilePort}/office/viewer` });
    for (let i = 0; i < 60; i++) {
      const ready = await evalJs(`Boolean(document.querySelector('.op-mv-start'))`);
      if (ready) break;
      await sleep(250);
    }
    await sleep(300);
    return evalJs(`(async () => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const resp = await fetch('/samples/${sampleName}');
      if (!resp.ok) throw new Error('HTTP_' + resp.status + ' for ${sampleName}');
      const file = new File([await resp.arrayBuffer()], '${sampleName}');
      const dt = new DataTransfer();
      dt.items.add(file);
      document.querySelector('.op-mv-start').dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
      const expectError = ${expectError};
      for (let i = 0; i < 120; i++) {
        if (expectError && document.querySelector('.op-mv-error')) break;
        if (!expectError && document.querySelector('.op-mv-word')) break;
        await wait(200);
      }
      await wait(450);
      const wordText = (document.querySelector('.op-mv-word')?.textContent || '').replace(/\\s+/g, ' ').trim().normalize('NFC');
      const visibleButtons = [...document.querySelectorAll('button, ion-button, .op-mv-btn')].filter((el) => {
        const r = el.getBoundingClientRect();
        const st = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none';
      });
      const smallTargets = visibleButtons
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { text: (el.textContent || el.getAttribute('aria-label') || '').trim(), w: Math.round(r.width), h: Math.round(r.height) };
        })
        .filter((x) => x.w < 40 || x.h < 40);
      const imgs = [...document.querySelectorAll('.op-mv-word-img')].map((img) => ({ w: img.naturalWidth, h: img.naturalHeight, complete: img.complete }));
      return {
        title: document.querySelector('.op-mv-title')?.textContent?.trim() ?? '',
        overflowX: document.documentElement.scrollWidth - window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        buttonCount: visibleButtons.length,
        smallTargets,
        tables: document.querySelectorAll('.op-mv-table').length,
        imgs,
        loadedImgs: imgs.filter((x) => x.complete && x.w > 0).length,
        warningCount: document.querySelectorAll('.op-mv-warning').length,
        warningText: document.querySelector('.op-mv-warning')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
        errorText: document.querySelector('.op-mv-error')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
        rawI18nLeaks: /\\boffice\\.(error|warning|word|mobile|action|workspace)\\./.test(document.body.textContent ?? ''),
        hasExpectedViHeading: wordText.includes('Báo cáo kiểm thử đa định dạng Word'),
        hasExpectedViBody: wordText.includes('Đọc tài liệu Word đa định dạng'),
      };
    })()`);
  }

  for (const [sample, expectWarning, shotName] of [
    ['qa-formats-real.docx', false, null],
    ['qa-formats-real.doc', true, 'qa-mobile-doc-390x844.png'],
    ['qa-formats-real.rtf', true, 'qa-mobile-rtf-390x844.png'],
    ['qa-formats-real.odt', true, 'qa-mobile-odt-390x844.png'],
  ]) {
    activeScope = `mobile:${sample}`;
    const res = await openMobileSample(sample);
    assert(res.overflowX === 0, `mobile ${sample} overflowX=${res.overflowX} (scrollWidth=${res.scrollWidth})`);
    assert(res.smallTargets.length === 0, `mobile ${sample} touch targets <40px: ${JSON.stringify(res.smallTargets)}`);
    assert(res.hasExpectedViHeading && res.hasExpectedViBody, `mobile ${sample} missing Vietnamese text`);
    assert(res.tables >= 1, `mobile ${sample} missing table`);
    assert(expectWarning ? res.warningCount >= 1 : res.warningCount === 0, `mobile ${sample} warning mismatch: ${res.warningCount}`);
    assert(!res.rawI18nLeaks, `mobile ${sample} raw i18n key leak`);
    if (shotName) await capturePng(shotName);
    report.mobile[sample] = res;
    console.log(`[mobile] ${sample} PASS`, { overflowX: res.overflowX, smallTargets: res.smallTargets.length, tables: res.tables, warningCount: res.warningCount });
  }

  activeScope = 'mobile:qa-formats-macro.docm';
  const mobileDocm = await openMobileSample('qa-formats-macro.docm', { expectError: true });
  assert(mobileDocm.overflowX === 0, `mobile docm overflowX=${mobileDocm.overflowX}`);
  assert(mobileDocm.smallTargets.length === 0, `mobile docm touch targets <40px: ${JSON.stringify(mobileDocm.smallTargets)}`);
  assert(mobileDocm.errorText.includes('OFFICE_MACRO_FILE_UNSUPPORTED'), `mobile docm error missing code: ${mobileDocm.errorText}`);
  assert(!mobileDocm.rawI18nLeaks, 'mobile docm raw i18n key leak');
  report.mobile['qa-formats-macro.docm'] = mobileDocm;
  console.log('[mobile] qa-formats-macro.docm PASS', { errorText: mobileDocm.errorText });

  assert(consoleErrors.length === 0, `Console errors detected: ${JSON.stringify(consoleErrors)}`);
  report.status = 'PASS';
  fs.writeFileSync(path.join(evidenceDir, 'qa-word-formats-evidence.json'), JSON.stringify(report, null, 2) + '\n');
  console.log('ALL DESKTOP + MOBILE WORD FORMAT E2E CHECKS PASSED (0 console errors)');
} finally {
  try { socket?.close(); } catch { /* ignore */ }
  try { child?.kill(); } catch { /* ignore */ }
  try { desktopServer.close(); } catch { /* ignore */ }
  try { mobileServer.close(); } catch { /* ignore */ }
  try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }
}
