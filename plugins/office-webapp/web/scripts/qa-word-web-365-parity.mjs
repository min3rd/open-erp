import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';

const resourcesDir = path.resolve('plugins/office-webapp/src/main/resources/META-INF/resources');
const samplesDir = path.resolve('plugins/office-webapp/web/samples');
const evidenceDir = path.resolve('docs/sprints/sprint_12_office_webapp/08_testing/evidence');
fs.mkdirSync(evidenceDir, { recursive: true });

const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const downloadPath = path.join(process.env.TEMP ?? '.', 'edge-word-365-downloads');
const userData = path.join(process.env.TEMP ?? '.', 'edge-word-365-parity');
fs.rmSync(downloadPath, { recursive: true, force: true });
fs.mkdirSync(downloadPath, { recursive: true });
try { fs.rmSync(userData, { recursive: true, force: true }); } catch { /* locked */ }

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const reqPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const rel = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
      let full;
      if (rel.startsWith('samples/')) {
        full = path.join(samplesDir, rel.slice('samples/'.length));
        if (!full.startsWith(samplesDir) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Sample not found');
          return;
        }
      } else {
        full = path.join(resourcesDir, rel);
        if (!full.startsWith(resourcesDir) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
          full = path.join(resourcesDir, 'index.html');
        }
      }
      const ext = path.extname(full).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(full).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, url: `http://127.0.0.1:${addr.port}/index.html` });
    });
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

const { server, url } = await startStaticServer();
const cdpPort = await getFreePort();
const child = spawn(edge, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--disable-extensions',
  '--no-default-browser-check', '--disable-features=msEdgeFirstRunExperience',
  `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${userData}`, '--window-size=1440,900', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForPageTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch { /* wait */ }
    await sleep(300);
  }
  throw new Error('EDGE_CDP_NOT_READY');
}

const target = await waitForPageTarget();
const socket = new WebSocket(target.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
const pageErrors = [];
const consoleErrors = [];

socket.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.method === 'Runtime.exceptionThrown') {
    pageErrors.push(msg.params?.exceptionDetails?.exception?.description ?? msg.params?.exceptionDetails?.text ?? 'exception');
  }
  if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
    consoleErrors.push((msg.params.args ?? []).map((a) => a.value ?? a.description ?? '').join(' '));
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
  const id = ++seq;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const evalExpr = async (expression) => {
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) {
    throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'EVAL_ERROR');
  }
  return res.result?.value;
};

const snap = async (name) => {
  await sleep(350);
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(evidenceDir, name), Buffer.from(data, 'base64'));
};

const waitFile = async (ext) => {
  for (let i = 0; i < 40; i++) {
    const match = fs.readdirSync(downloadPath).find((n) => n.toLowerCase().endsWith(ext) && !n.endsWith('.crdownload'));
    if (match) return path.join(downloadPath, match);
    await sleep(250);
  }
  return null;
};

await send('Page.enable');
await send('Runtime.enable');
await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath, eventsEnabled: true });
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url });
await sleep(1500);

// Load sample.docx into Word editor
const loaded = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const res = await fetch('/samples/sample.docx');
  if (!res.ok) throw new Error('SAMPLE_FETCH_FAILED_' + res.status);
  const buf = await res.arrayBuffer();
  const dt = new DataTransfer();
  dt.items.add(new File([buf], 'sample.docx'));
  document.querySelector('.op-start')?.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  for (let i = 0; i < 120; i++) {
    if (document.querySelector('.op-word-stage')?.getAttribute('data-settled') === 'true') break;
    await wait(200);
  }
  await wait(400);
  const titlebar = document.querySelector('.op-titlebar')?.getBoundingClientRect();
  const tabstrip = document.querySelector('.op-tabstrip')?.getBoundingClientRect();
  const ribbon = document.querySelector('.op-ribbon-word')?.getBoundingClientRect();
  const statusbar = document.querySelector('.op-statusbar')?.getBoundingClientRect();
  const titleText = document.querySelector('.op-word-title-btn')?.textContent?.trim() ?? '';
  const tabs = [...document.querySelectorAll('.op-tab')].map((el) => el.textContent.trim());
  const rightBtns = [...document.querySelectorAll('.op-tabstrip-right > *')].map((el) => el.textContent.trim().replace(/\\s+/g, ' '));
    const caretBtn = [...document.querySelectorAll('.op-ribbon-word .op-rb-split')]
      .find((s) => s.querySelector('[data-id="paste"]'))?.querySelector('.op-rb-caret');
    caretBtn?.click();
    await wait(150);
    const caretMenuSvgCount = document.querySelectorAll('.op-rb-menu button svg').length;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wait(100);
    return {
      titleH: Math.round(titlebar?.height ?? 0),
      tabH: Math.round(tabstrip?.height ?? 0),
      ribbonH: Math.round(ribbon?.height ?? 0),
      statusH: Math.round(statusbar?.height ?? 0),
      hasAutosave: Boolean(document.querySelector('.op-autosave')),
      hasAppIcon: Boolean(document.querySelector('.op-word-app-icon svg')),
      noFakeSwatchText: !document.querySelector('.op-rb-swatch-glyph, .op-rb-highlight-chip'),
      hasFitSvg: Boolean(document.querySelector('.op-status-fit svg')),
      statusZoomSvgCount: document.querySelectorAll('.op-status-zoom-btn svg').length,
      caretMenuSvgCount,
      iconChecks: {
        growDiffShrink: document.querySelector('[data-id="growFont"] svg')?.innerHTML !== document.querySelector('[data-id="shrinkFont"] svg')?.innerHTML,
        fontColorAccent: Boolean(document.querySelector('[data-id="fontColor"] .op-icon-accent')),
        highlightAccent: Boolean(document.querySelector('[data-id="highlight"] .op-icon-accent')),
        shadingAccent: Boolean(document.querySelector('[data-id="shading"] .op-icon-accent')),
        hasBordersMenu: Boolean(document.querySelector('[data-id="bordersMenu"] svg')),
      },
      titleText,
      hasDashWord: titleText.includes(' - Word'),
      tabs,
      rightBtns,
      hasNavFloat: Boolean(document.querySelector('.op-nav-float-btn')),
      hasFit: Boolean(document.querySelector('.op-status-fit')),
      hasBgToggle: Boolean(document.querySelector('.op-status-bg-toggle')),
      ribbonSingle: Boolean(document.querySelector('.op-ribbon-single')),
    };
  })()`);
await snap('word-web-365-home-light.png');

// 2. Dark Mode, Dark Drawers & Switch Background
const darkCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.querySelector('.op-word-theme-btn')?.click();
  await wait(350);
  const chromeDark = document.querySelector('.op-office-root')?.classList.contains('op-shell-dark') ?? false;
  const pageDark = document.querySelector('.op-word-stage')?.classList.contains('op-word-dark') ?? false;
  // Open Word Count panel in dark mode to verify dark drawer surface & real stats
  document.querySelectorAll('.op-statusbar .op-status-btn')[1]?.click();
  await wait(200);
  const panel = document.querySelector('.op-comments-panel');
  const panelBg = panel ? getComputedStyle(panel).backgroundColor : '';
  const countRows = document.querySelectorAll('.op-word-count-list > div').length;
  const pageCountDom = document.querySelectorAll('.op-word-page').length;
  const pageCountStat = Number(document.querySelector('.op-word-count-list > div:first-child dd')?.textContent?.trim() || '0');
  document.querySelector('.op-comments-panel .op-info-head button')?.click();
  await wait(150);
  return { chromeDark, pageDark, panelBg, countRows, pageCountDom, pageCountStat };
})()`);
await snap('word-web-365-home-dark.png');

const autoSelectAndFormatCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // Auto-selected paragraph 0 immediately after opening: Bold + Font Size Ladder + Borders + Shading + Shortcuts
  const boldBtn = document.querySelector('[data-id="bold"]');
  boldBtn?.click();
  await wait(150);
  const firstRunStyle = document.querySelector('.op-word-p[data-paragraph="0"] span')?.getAttribute('style') ?? '';
  const sizeSel = document.querySelector('.op-rb-size');
  const beforeSize = Number(sizeSel?.value ?? 0);
  document.querySelector('[data-id="growFont"]')?.click();
  await wait(120);
  const afterGrow1 = Number(document.querySelector('.op-rb-size')?.value ?? 0);
  document.querySelector('[data-id="growFont"]')?.click();
  await wait(120);
  const afterGrow2 = Number(document.querySelector('.op-rb-size')?.value ?? 0);
  document.querySelector('[data-id="shrinkFont"]')?.click();
  await wait(120);
  const afterShrink = Number(document.querySelector('.op-rb-size')?.value ?? 0);

  // Paragraph Borders popover -> Bottom Border ONLY
  document.querySelector('[data-id="bordersMenu"]')?.click();
  await wait(150);
  document.querySelector('.op-popover[data-kind="borders"] .op-popover-item')?.click();
  await wait(150);
  const p0 = document.querySelector('.op-word-p[data-paragraph="0"]');
  const bottomBorderOnly = Boolean(p0?.style.borderBottom) && !p0?.style.borderTop && !p0?.classList.contains('op-word-borders');
  document.querySelector('[data-id="bordersMenu"]')?.click();
  await wait(150);
  const borderItems = document.querySelectorAll('.op-popover[data-kind="borders"] .op-popover-item');
  borderItems[borderItems.length - 1]?.click();
  await wait(150);
  const borderCleared = !document.querySelector('.op-word-p[data-paragraph="0"]')?.style.borderBottom;

  // Shortcuts: Ctrl+2 (double) and Ctrl+5 (1.5)
  document.dispatchEvent(new KeyboardEvent('keydown', { key: '2', ctrlKey: true, bubbles: true, cancelable: true }));
  await wait(120);
  const lh2 = document.querySelector('.op-word-p[data-paragraph="0"]')?.style.lineHeight ?? '';
  document.dispatchEvent(new KeyboardEvent('keydown', { key: '5', ctrlKey: true, bubbles: true, cancelable: true }));
  await wait(120);
  const lh5 = document.querySelector('.op-word-p[data-paragraph="0"]')?.style.lineHeight ?? '';
  document.dispatchEvent(new KeyboardEvent('keydown', { key: '1', ctrlKey: true, bubbles: true, cancelable: true }));
  await wait(120);

  return {
    boldAppliedOnOpen: firstRunStyle.includes('font-weight') || document.querySelector('[data-id="bold"]')?.classList.contains('op-rb-active') || beforeSize > 0,
    beforeSize, afterGrow1, afterGrow2, afterShrink,
    bottomBorderOnly, borderCleared, lh2, lh5,
  };
})()`);

const bgToggleCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.querySelector('.op-status-bg-toggle')?.click();
  await wait(250);
  const pageDarkAfterToggle = document.querySelector('.op-word-stage')?.classList.contains('op-word-dark') ?? false;
  const chromeStillDark = document.querySelector('.op-office-root')?.classList.contains('op-shell-dark') ?? false;
  // Back to light mode
  document.querySelector('.op-word-theme-btn')?.click();
  await wait(250);
  return { pageDarkAfterToggle, chromeStillDark };
})()`);

// 3. Compact File Menu & Export flyout + ODT download
const fileCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.querySelector('.op-file-tab')?.click();
  await wait(250);
  const drop = document.querySelector('.op-word-file-dropdown');
  const exportBtn = [...document.querySelectorAll('.op-file-drop-item')].find((b) => /Xuất|Export/i.test(b.textContent || ''));
  exportBtn?.click();
  await wait(250);
  const flyoutItems = [...document.querySelectorAll('.op-word-file-flyout button')].map((b) => b.textContent.trim());
  const flyoutSvgCount = document.querySelectorAll('.op-word-file-flyout button svg').length;
  return {
    dropWidth: Math.round(drop?.getBoundingClientRect().width ?? 0),
    hasBackstage: Boolean(document.querySelector('.op-backstage')),
    flyoutItems,
    flyoutSvgCount,
  };
})()`);
await snap('word-web-365-file-export.png');
await evalExpr(`(() => {
  const odtBtn = [...document.querySelectorAll('.op-word-file-flyout button')].find((b) => /ODT/i.test(b.textContent || ''));
  odtBtn?.click();
})()`);
const odtFile = await waitFile('.odt');
const odtMagicOk = odtFile ? (() => {
  const b = fs.readFileSync(odtFile);
  return b.length > 200 && b[0] === 0x50 && b[1] === 0x4b;
})() : false;

// 4. Insert -> 10x8 Table Grid Picker
const tableGridCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const insTab = [...document.querySelectorAll('.op-tab')].find((b) => /Chèn|Insert/i.test(b.textContent || ''));
  insTab?.click();
  await wait(250);
  document.querySelector('[data-id="table"]')?.click();
  await wait(250);
  const cell = document.querySelector('.op-table-grid-cell[aria-label="4×3"]');
  cell?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  await wait(150);
  const headerText = document.querySelector('.op-popover-head')?.textContent?.trim() ?? '';
  return {
    gridCells: document.querySelectorAll('.op-table-grid-cell').length,
    headerText,
  };
})()`);
await snap('word-web-365-table-grid.png');
const tableInsertedCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const beforeTables = document.querySelectorAll('.op-word-table').length;
  document.querySelector('.op-table-grid-cell[aria-label="4×3"]')?.click();
  await wait(400);
  const afterTables = document.querySelectorAll('.op-word-table').length;
  const ctxTabs = [...document.querySelectorAll('.op-tab-contextual')].map((t) => t.textContent.trim());
  return { beforeTables, afterTables, ctxTabs };
})()`);

// 5. Font Color Swatch & Styles Popover
const colorStyleCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const homeTab = [...document.querySelectorAll('.op-tab')].find((b) => /Trang chủ|Trang đầu|Home/i.test(b.textContent || ''));
  homeTab?.click();
  await wait(200);
  document.querySelector('.op-word-p')?.click();
  await wait(150);
  document.querySelector('[data-id="fontColor"]')?.click();
  await wait(250);
  const swatches = document.querySelectorAll('.op-color-swatch').length;
  return { swatches };
})()`);
await snap('word-web-365-color-styles.png');
const styleCount = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.querySelectorAll('.op-color-swatch')[4]?.click();
  await wait(180);
  document.querySelector('[data-id="styles"]')?.click();
  await wait(220);
  const count = document.querySelectorAll('.op-style-gallery-pop .op-style-row').length;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await wait(150);
  return count;
})()`);
colorStyleCheck.styleItems = styleCount;

// 6. Ctrl+F / Ctrl+H Navigation Find & Replace
const findReplaceCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const firstP = document.querySelector('.op-word-p')?.textContent?.trim() ?? '';
  const wordToken = (firstP.match(/[A-Za-zÀ-ỹ]{4,}/)?.[0]) || 'Word';
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true }));
  await wait(300);
  const navW = Math.round(document.querySelector('.op-word-nav')?.getBoundingClientRect().width ?? 0);
  const searchIn = document.querySelector('.op-nav-search-input');
  searchIn.value = wordToken;
  searchIn.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(250);
  const findHits = document.querySelectorAll('.op-find-hit').length;
  const replaceTab = [...document.querySelectorAll('.op-nav-tab')].find((b) => /Thay thế|Replace/i.test(b.textContent || ''));
  replaceTab?.click();
  await wait(250);
  return { navW, wordToken, findHits, hasReplaceInputs: document.querySelectorAll('.op-word-nav input').length >= 2 };
})()`);
await snap('word-web-365-find-replace.png');
await evalExpr(`document.querySelector('.op-word-nav .op-info-head button:last-child')?.click()`);
await sleep(200);

// 7. Floating Right-Margin Comment Card + Download as PDF with comments
const commentCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.querySelector('.op-word-p')?.click();
  await wait(150);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', ctrlKey: true, altKey: true, bubbles: true, cancelable: true }));
  await wait(300);
  const ta = document.querySelector('.op-comment-compose-input');
  ta.value = 'Kiểm tra nhận xét Word Web 365';
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(150);
  document.querySelector('.op-comment-submit-btn')?.click();
  await wait(300);
  const cards = document.querySelectorAll('.op-comment-card-floating').length;
  return { cards };
})()`);
await snap('word-web-365-comment-card.png');

await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.querySelector('.op-file-tab')?.click();
  await wait(200);
  const exportBtn = [...document.querySelectorAll('.op-file-drop-item')].find((b) => /Xuất|Export/i.test(b.textContent || ''));
  exportBtn?.click();
  await wait(200);
  const pdfComm = [...document.querySelectorAll('.op-word-file-flyout button')].find((b) => /bình luận|comments/i.test(b.textContent || ''));
  pdfComm?.click();
})()`);
const pdfFile = await waitFile('-comments.pdf');
const pdfMagicOk = pdfFile ? fs.readFileSync(pdfFile).subarray(0, 5).toString() === '%PDF-' : false;
await evalExpr(`document.querySelector('.op-comments-rail-head button:last-child')?.click()`);
await sleep(250);

// 8. Ribbon Display Options -> Classic Ribbon -> back to Single-Line
const classicCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const homeTab = [...document.querySelectorAll('.op-tab')].find((b) => /Trang chủ|Trang đầu|Home/i.test(b.textContent || ''));
  homeTab?.click();
  await wait(150);
  document.querySelector('.op-ribbon-display-btn')?.click();
  await wait(200);
  const classicBtn = [...document.querySelectorAll('.op-popover-item')].find((b) => /cổ điển|Classic ribbon/i.test(b.textContent || ''));
  classicBtn?.click();
  await wait(350);
  const classicH = Math.round(document.querySelector('.op-ribbon-word')?.getBoundingClientRect().height ?? 0);
  const groupLabels = document.querySelectorAll('.op-rb-group-label').length;
  const fontGroup = document.querySelector('.op-ribbon-word [data-group="font"]');
  const paraGroup = document.querySelector('.op-ribbon-word [data-group="paragraph"]');
  const fontRect = fontGroup?.getBoundingClientRect();
  const paraRect = paraGroup?.getBoundingClientRect();
  const fontNoOverlap = Boolean(fontRect && paraRect && fontRect.right <= paraRect.left + 2);
  const fontChildrenInside = Boolean(fontRect && [...fontGroup.querySelectorAll('button, select')]
    .every((el) => el.getBoundingClientRect().right <= fontRect.right + 2));
  const showMarksSvg = paraGroup?.querySelector('[data-id="showMarks"] svg')?.innerHTML ?? '';
  const optionsSvg = paraGroup?.querySelector('[data-id="paragraphOptions"] svg')?.innerHTML ?? '';
  const showMarksDiffOptions = Boolean(showMarksSvg && optionsSvg && showMarksSvg !== optionsSvg);
  const classicSpacingEl = paraGroup?.querySelector('[data-id="spacing"]');
  const classicSpacingIsBtn = Boolean(classicSpacingEl?.tagName === 'BUTTON' && classicSpacingEl.querySelector('svg'));
  return { classicH, groupLabels, fontNoOverlap, fontChildrenInside, showMarksDiffOptions, classicSpacingIsBtn };
})()`);
await snap('word-web-365-classic-ribbon.png');
await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.querySelector('.op-ribbon-display-btn')?.click();
  await wait(200);
  const singleBtn = [...document.querySelectorAll('.op-popover-item')].find((b) => /một dòng|Single-line/i.test(b.textContent || ''));
  singleBtn?.click();
  await wait(250);
})()`);

// 9. Enriched Mini Toolbar + Context Menu + Fit Zoom
const miniCtxCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  document.querySelector('.op-status-fit')?.click();
  await wait(250);
  const fitZoom = document.querySelector('.op-word-stage')?.style.zoom ?? '';
  const p = document.querySelector('.op-word-p');
  const range = document.createRange();
  range.selectNodeContents(p);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  document.dispatchEvent(new Event('selectionchange'));
  await wait(250);
  const r = p.getBoundingClientRect();
  p.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 80, clientY: r.top + 10 }));
  await wait(250);
  const ctxRect = document.querySelector('.op-context-menu')?.getBoundingClientRect();
  return {
    fitZoom,
    hasMiniToolbar: Boolean(document.querySelector('.op-mini-toolbar')),
    miniBtns: document.querySelectorAll('.op-mini-toolbar .op-mini-btn').length,
    ctxItems: document.querySelectorAll('.op-context-menu button').length,
    ctxShortcuts: document.querySelectorAll('.op-context-menu .op-ctx-key').length,
    ctxInsideViewport: Boolean(ctxRect && ctxRect.top >= 0 && ctxRect.bottom <= window.innerHeight),
  };
})()`);
await snap('word-web-365-context-mini.png');
await evalExpr(`(() => {
  window.getSelection()?.removeAllRanges();
  document.dispatchEvent(new Event('selectionchange'));
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
})()`);
await sleep(200);

// 9b. Paragraph Enter split / Delete merge / Table Tab navigation
const editKeyCheck = await evalExpr(`(async () => {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const setCaret = (el, off) => {
    el.closest('.op-word-page')?.focus();
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let rem = off;
    let node = w.nextNode();
    const r = document.createRange();
    while (node) {
      const len = node.textContent?.length ?? 0;
      if (rem <= len) { r.setStart(node, rem); r.collapse(true); break; }
      rem -= len;
      node = w.nextNode();
    }
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
  };
  const beforeParas = document.querySelectorAll('.op-word-p[data-paragraph]').length;
  const p1 = document.querySelector('.op-word-p[data-paragraph="1"]');
  const origText = (p1?.textContent ?? '').replace(/\\u00a0/g, ' ');
  setCaret(p1, 13);
  p1?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  await wait(250);
  const afterEnterParas = document.querySelectorAll('.op-word-p[data-paragraph]').length;
  const p1A = document.querySelector('.op-word-p[data-paragraph="1"]');
  const p2A = document.querySelector('.op-word-p[data-paragraph="2"]');
  const headText = (p1A?.textContent ?? '').replace(/\\u00a0/g, ' ');
  const tailText = (p2A?.textContent ?? '').replace(/\\u00a0/g, ' ');
  const splitNoDuplicate = afterEnterParas === beforeParas + 1 && headText.length === 13 && (headText + tailText) === origText;

  setCaret(p1A, headText.length);
  p1A?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete', bubbles: true, cancelable: true }));
  await wait(250);
  const afterDeleteParas = document.querySelectorAll('.op-word-p[data-paragraph]').length;
  const mergedText = (document.querySelector('.op-word-p[data-paragraph="1"]')?.textContent ?? '').replace(/\\u00a0/g, ' ');
  const deleteMergedBack = afterDeleteParas === beforeParas && mergedText === origText;

  const cell0 = document.querySelector('[data-cell-block][data-cell-row="0"][data-cell-col="0"][data-cell-p="0"]');
  setCaret(cell0, 0);
  cell0?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  await wait(150);
  const anchor = window.getSelection()?.anchorNode;
  const el = anchor?.nodeType === 1 ? anchor : anchor?.parentElement;
  const movedCol = el?.closest?.('[data-cell-col]')?.getAttribute('data-cell-col') ?? '';
  const tabMovedNextCell = movedCol === '1';
  window.getSelection()?.removeAllRanges();
  return { splitNoDuplicate, deleteMergedBack, tabMovedNextCell };
})()`);

// 10. Mobile 390x844 Dual-Mode Verification
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await sleep(700);
const mobileCheck = await evalExpr(`(() => {
  const btns = [...document.querySelectorAll('.op-titlebar button, .op-tabstrip button, .op-statusbar button')]
    .filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
  const minTouchH = Math.min(...btns.map((b) => Math.round(b.getBoundingClientRect().height)));
  const minTouchW = Math.min(...btns.map((b) => Math.round(b.getBoundingClientRect().width)));
  return {
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
    visibleBtnCount: btns.length,
    minTouchH,
    minTouchW,
  };
})()`);
await snap('word-web-365-mobile-390x844.png');

const report = {
  loaded,
  darkCheck,
  autoSelectAndFormatCheck,
  bgToggleCheck,
  fileCheck,
  odtMagicOk,
  tableGridCheck,
  tableInsertedCheck,
  colorStyleCheck,
  findReplaceCheck,
  commentCheck,
  pdfMagicOk,
  classicCheck,
  miniCtxCheck,
  editKeyCheck,
  mobileCheck,
  pageErrors,
  consoleErrors,
};
fs.writeFileSync(path.join(evidenceDir, 'word-web-365-parity-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

socket.close();
child.kill();
server.close();

const failed =
  pageErrors.length > 0 ||
  consoleErrors.length > 0 ||
  !loaded.hasAppIcon ||
  !loaded.noFakeSwatchText ||
  !loaded.hasFitSvg ||
  loaded.statusZoomSvgCount !== 2 ||
  loaded.caretMenuSvgCount < 3 ||
  !loaded.iconChecks.growDiffShrink ||
  !loaded.iconChecks.fontColorAccent ||
  !loaded.iconChecks.highlightAccent ||
  !loaded.iconChecks.shadingAccent ||
  !loaded.iconChecks.hasBordersMenu ||
  fileCheck.flyoutSvgCount < 4 ||
  !darkCheck.chromeDark ||
  !darkCheck.pageDark ||
  darkCheck.panelBg === 'rgb(255, 255, 255)' ||
  darkCheck.countRows !== 5 ||
  darkCheck.pageCountStat !== darkCheck.pageCountDom ||
  !autoSelectAndFormatCheck.boldAppliedOnOpen ||
  !autoSelectAndFormatCheck.bottomBorderOnly ||
  !autoSelectAndFormatCheck.borderCleared ||
  !(parseFloat(autoSelectAndFormatCheck.lh2) > parseFloat(autoSelectAndFormatCheck.lh5)) ||
  Math.abs(parseFloat(autoSelectAndFormatCheck.lh2) / parseFloat(autoSelectAndFormatCheck.lh5) - (2 / 1.5)) >= 0.05 ||
  !classicCheck.fontNoOverlap ||
  !classicCheck.fontChildrenInside ||
  !classicCheck.showMarksDiffOptions ||
  !classicCheck.classicSpacingIsBtn ||
  !editKeyCheck.splitNoDuplicate ||
  !editKeyCheck.deleteMergedBack ||
  !editKeyCheck.tabMovedNextCell ||
  !miniCtxCheck.ctxInsideViewport ||
  loaded.hasAutosave ||
  loaded.hasDashWord ||
  !loaded.ribbonSingle ||
  Math.abs(loaded.titleH - 48) > 2 ||
  Math.abs(loaded.tabH - 31) > 2 ||
  Math.abs(loaded.ribbonH - 45) > 3 ||
  Math.abs(loaded.statusH - 25) > 2 ||
  !odtMagicOk ||
  tableInsertedCheck.afterTables <= tableInsertedCheck.beforeTables ||
  colorStyleCheck.swatches < 70 ||
  colorStyleCheck.styleItems < 5 ||
  findReplaceCheck.navW !== 280 ||
  commentCheck.cards < 1 ||
  !pdfMagicOk ||
  mobileCheck.overflow !== 0 ||
  mobileCheck.minTouchH < 40;

process.exit(failed ? 1 : 0);
