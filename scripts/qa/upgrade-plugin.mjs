// Upgrade a plugin on the QA tenant to the version in its plugin.json.
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const plugin = process.argv[2] ?? 'workflow';
const BASE = 'http://127.0.0.1:8088';
const email = 'qa-s08-admin-mvzantur@example.com';
const password = 'E2eForm!2026';

async function api(method, url, { token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const response = await fetch(BASE + url, { method, headers, body: payload });
  return { status: response.status, json: await response.json().catch(() => null) };
}

const tenantId = execSync(
  `docker exec openerp-postgres-primary psql -U openerp -d openerp_dev -tAc "SELECT id FROM tenants WHERE slug='qa-s08-mvzantur'"`,
  { encoding: 'utf8' },
).trim();
const manifest = JSON.parse(fs.readFileSync(`plugins/${plugin}/plugin.json`, 'utf8'));

const login = await api('POST', '/api/v1/auth/login', { body: { email, password } });
const token = login.json?.data?.access_token;

const platformLogin = await api('POST', '/api/v1/auth/login', {
  body: { email: 'qa-s08-platform-mvzantur@example.com', password },
});
const platformToken = platformLogin.json?.data?.access_token;
console.log('platform login:', platformLogin.status, platformLogin.json?.code ?? '');

// Re-upload artifact + register version (idempotent-ish; 409 on dup is fine).
const fd = new FormData();
fd.append('file', new Blob([fs.readFileSync(`plugins/${plugin}/dist/bundle.zip`)]), 'bundle.zip');
const artifact = await api('POST', '/api/v1/platform/plugins/artifacts/upload', {
  token: platformToken, form: fd,
});
console.log('artifact:', artifact.status, JSON.stringify(artifact.json)?.slice(0, 300));
const version = await api('POST', `/api/v1/platform/plugins/${plugin}/versions`, {
  token: platformToken,
  body: {
    source: 'JAR_BUNDLE', version: manifest.version,
    artifact_ref: artifact.json?.data?.artifact_ref,
    checksum: artifact.json?.data?.checksum,
    manifest,
  },
});
console.log('version:', version.status, version.json?.code ?? '', (version.json?.message ?? '').slice(0, 200));
if (version.status === 201) {
  const publish = await api('PATCH', `/api/v1/platform/plugins/${plugin}/versions/${manifest.version}`, {
    token: platformToken, body: { action: 'PUBLISH', reason: 'QA fix' },
  });
  console.log('publish:', publish.status, publish.json?.code ?? '');
}

const upgrade = await api('POST', `/api/v1/tenant/plugins/${plugin}/upgrade`, {
  token, body: { target_version: manifest.version, reason: 'QA fix' },
});
console.log('upgrade:', upgrade.status, upgrade.json?.code ?? '');
const operationId = upgrade.json?.data?.operation_id;
for (let i = 0; i < 80; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  const op = await api('GET', `/api/v1/plugins/operations/${operationId}`, { token });
  const status = op.json?.data?.status;
  console.log('operation:', status);
  if (status === 'ACTIVE' || status === 'FAILED') break;
}
