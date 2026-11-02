// Install form 1.0.7 onto the existing QA tenant (mvzantur) so the browser
// review sees the BUG-177/178 fixes. Uses the platform + tenant admins of
// that tenant.
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:8088';
const email = 'qa-s08-admin-mvzantur@example.com';
const platformEmail = 'qa-s08-platform-mvzantur@example.com';
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
console.log('tenant:', tenantId);

const tenantLogin = await api('POST', '/api/v1/auth/login', { body: { email, password } });
const tenantToken = tenantLogin.json?.data?.access_token;
console.log('tenant login:', tenantLogin.status, tenantLogin.json?.code ?? '');

const platformLogin = await api('POST', '/api/v1/auth/login', { body: { email: platformEmail, password } });
const platformToken = platformLogin.json?.data?.access_token;
console.log('platform login:', platformLogin.status, platformLogin.json?.code ?? '');

const fd = new FormData();
fd.append('file', new Blob([fs.readFileSync('plugins/form/dist/bundle.zip')]), 'bundle.zip');
const artifact = await api('POST', '/api/v1/platform/plugins/artifacts/upload', {
  token: platformToken, form: fd,
});
console.log('artifact:', artifact.status, artifact.json?.code ?? '');
const artifactRef = artifact.json?.data?.artifact_ref;
const checksum = artifact.json?.data?.checksum;
const manifest = JSON.parse(fs.readFileSync('plugins/form/plugin.json', 'utf8'));

const version = await api('POST', '/api/v1/platform/plugins/form/versions', {
  token: platformToken,
  body: { source: 'JAR_BUNDLE', version: manifest.version, artifact_ref: artifactRef, checksum, manifest },
});
console.log('version:', version.status, version.json?.code ?? '', version.json?.message ?? '');

const publish = await api('PATCH', `/api/v1/platform/plugins/form/versions/${manifest.version}`, {
  token: platformToken, body: { action: 'PUBLISH', reason: 'BUG-177/178 fix' },
});
console.log('publish:', publish.status, publish.json?.code ?? '');

const install = await api('POST', '/api/v1/tenant/plugins/form/install', {
  token: tenantToken, body: { version: manifest.version },
});
console.log('install:', install.status, install.json?.code ?? '');
let operationId = install.json?.data?.operation_id;
if (install.status === 409) {
  // Already installed (older version) — upgrade instead. The contract field
  // is target_version (PluginRequests.Upgrade).
  const upgrade = await api('POST', '/api/v1/tenant/plugins/form/upgrade', {
    token: tenantToken, body: { target_version: manifest.version, reason: 'BUG-177/178 fix' },
  });
  console.log('upgrade:', upgrade.status, upgrade.json?.code ?? '');
  operationId = upgrade.json?.data?.operation_id;
}
if (operationId) {
  for (let i = 0; i < 80; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const op = await api('GET', `/api/v1/plugins/operations/${operationId}`, { token: tenantToken });
    const status = op.json?.data?.status;
    console.log('operation:', status);
    if (status === 'ACTIVE' || status === 'FAILED') break;
  }
}
