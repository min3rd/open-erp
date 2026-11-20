/**
 * Grants clipboard read/write to the QA page over CDP and focuses the tab, so
 * the Clipboard pane can be exercised (headless Chrome denies it otherwise).
 *
 *   node scripts/grant-clipboard.mjs ws://127.0.0.1:<port>/devtools/browser/<id> [pageUrl]
 */
const endpoint = process.argv[2];
if (!endpoint) throw new Error('pass the CDP browser websocket url');
const socket = new WebSocket(endpoint);
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
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++counter;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});
await send('Browser.grantPermissions', {
  origin: 'http://127.0.0.1:4399',
  permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'],
});
const { targetInfos } = await send('Target.getTargets');
const page = targetInfos.find((info) => info.type === 'page' && info.url.includes('127.0.0.1:4399'));
if (page) {
  const { sessionId } = await send('Target.attachToTarget', { targetId: page.targetId, flatten: true });
  await send('Page.bringToFront', {}, sessionId);
  await send('Page.reload', {}, sessionId);
}
const version = await send('Browser.getVersion');
console.log(JSON.stringify({ granted: true, page: page?.url ?? null, browser: version.product }));
socket.close();
process.exit(0);
