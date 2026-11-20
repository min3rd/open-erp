/**
 * Static server for the office webapp QA harness on port 4399.
 * Serves the built plugin bundle from the resources dir and the sample
 * documents from web/samples, which is what qa-parity-capture.mjs loads.
 *
 *   node scripts/serve-qa.mjs [port]
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const bundleRoot = path.resolve(here, '../../src/main/resources/META-INF/resources');
const sampleRoot = path.resolve(here, '../samples');
const port = Number(process.argv[2] ?? 4399);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.dotx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.template',
  '.doc': 'application/msword',
  '.rtf': 'application/rtf',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.xml': 'application/xml; charset=utf-8',
  '.docm': 'application/vnd.ms-word.document.macroEnabled.12',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.pdf': 'application/pdf',
  '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = relative.startsWith('samples/')
    ? path.join(sampleRoot, relative.slice('samples/'.length))
    : path.join(bundleRoot, relative);
  if (!file.startsWith(bundleRoot) && !file.startsWith(sampleRoot)) {
    response.writeHead(403).end();
    return;
  }
  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
      return;
    }
    response.writeHead(200, { 'content-type': types[path.extname(file).toLowerCase()] ?? 'application/octet-stream' });
    response.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`office qa server on http://127.0.0.1:${port}`));
