// Sprint 08 real-runtime E2E (TC-E + TC-S of TP-S08-001).
// Prereqs: `npm run dev` stack healthy on :8088; bundles packaged in
// plugins/{form,workflow,employee}/dist/bundle.zip; docker CLI on PATH.
// Usage: node scripts/qa/sprint08-e2e.mjs [--base http://localhost:8088]
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const BASE = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:8088';
const EVIDENCE = path.resolve(
  'docs/sprints/sprint_08_plugin_form_workflow/08_testing/evidence/s08_qa_real',
);
fs.mkdirSync(EVIDENCE, { recursive: true });

const results = [];
function record(id, name, pass, detail) {
  results.push({ id, name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${name}${detail ? ' — ' + detail : ''}`);
}
async function api(method, url, { token, body, raw, form } = {}) {
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
  if (raw) return response;
  let json = null;
  try {
    json = await response.json();
  } catch {
    /* non-JSON */
  }
  return { status: response.status, json };
}
function psql(query) {
  const flat = query.replace(/\s+/g, ' ').trim();
  return execSync(
    `docker exec openerp-postgres-primary psql -U openerp -d openerp_dev -tAc "${flat.replace(/"/g, '\\"')}"`,
    { encoding: 'utf8' },
  ).trim();
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------- setup
// Two separate identities: the tenant admin must NOT be a super admin, a
// super-admin login returns a platform-scope token without tenant context.
// Slugs are unique per run so reruns start from a clean tenant.
const runId = Date.now().toString(36);
const tenantSlug = `qa-s08-${runId}`;
const platformSlug = `qa-s08p-${runId}`;
const email = `qa-s08-admin-${runId}@example.com`;
const password = 'E2eForm!2026';
const platformEmail = `qa-s08-platform-${runId}@example.com`;

let register = await api('POST', '/api/v1/auth/register/business', {
  body: {
    admin: { full_name: 'QA Sprint 08', email, password },
    tenant: { name: 'QA Sprint 08', slug: tenantSlug, currency: 'VND' },
  },
});
console.log('register:', register.status, register.json?.code ?? '');
const tenantId = psql(`SELECT id FROM tenants WHERE slug='${tenantSlug}'`);
let login = await api('POST', '/api/v1/auth/login', { body: { email, password } });
let token = login.json?.data?.access_token;
if (!token) {
  console.log('login response:', login.status, JSON.stringify(login.json).slice(0, 400));
  const preAuth = login.json?.data?.pre_auth_token ?? login.json?.data?.preAuthToken;
  if (preAuth) {
    const select = await api('POST', '/api/v1/auth/select-tenant', {
      body: { pre_auth_token: preAuth, tenant_id: tenantId },
    });
    token = select.json?.data?.access_token;
  }
}
if (!token) throw new Error('Cannot obtain tenant token: ' + JSON.stringify(login.json).slice(0, 400));
console.log('tenant:', tenantId);

// Dev-only super admin seed (mirrors scripts/e2e/plugin-cli-e2e.mjs) on a
// SECOND business identity so the tenant admin token stays tenant-scoped.
await api('POST', '/api/v1/auth/register/business', {
  body: {
    admin: { full_name: 'QA Platform', email: platformEmail, password },
    tenant: { name: 'QA Sprint 08 Platform', slug: platformSlug, currency: 'VND' },
  },
});
psql(`INSERT INTO platform_super_admins (user_id, role, is_active, status, must_change_password, two_factor_required)
  SELECT id,'SUPER_ADMIN',TRUE,'ACTIVE',FALSE,FALSE FROM users WHERE email='${platformEmail}'
  ON CONFLICT (user_id) DO UPDATE SET role='SUPER_ADMIN', is_active=TRUE, status='ACTIVE',
  must_change_password=FALSE, two_factor_required=FALSE`);
const platformLogin = await api('POST', '/api/v1/auth/login', { body: { email: platformEmail, password } });
const platformToken = platformLogin.json?.data?.access_token;
if (!platformToken) {
  console.log('platform login:', platformLogin.status, JSON.stringify(platformLogin.json).slice(0, 300));
  throw new Error('Cannot obtain platform token');
}

// ------------------------------------------------- install the 3 plugins
async function installPlugin(key, version) {
  const catalog = await api('POST', '/api/v1/platform/plugins', {
    token: platformToken,
    body: { plugin_key: key, name_key: `PLUGIN_${key.toUpperCase()}_NAME`,
      description_key: `PLUGIN_${key.toUpperCase()}_DESCRIPTION` },
  });
  console.log(`catalog ${key}:`, catalog.status, catalog.json?.code ?? '');
  const distZip = path.resolve(`plugins/${key}/dist/bundle.zip`);
  const artifact = await api('POST', '/api/v1/platform/plugins/artifacts/upload', {
    token: platformToken,
    form: (() => {
      const fd = new FormData();
      fd.append('file', new Blob([fs.readFileSync(distZip)]), 'bundle.zip');
      return fd;
    })(),
  });
  console.log(`artifact ${key}:`, artifact.status, artifact.json?.code ?? '');
  const artifactRef = artifact.json?.data?.artifact_ref;
  const checksum = artifact.json?.data?.checksum;
  const manifest = JSON.parse(fs.readFileSync(path.resolve(`plugins/${key}/plugin.json`), 'utf8'));
  const registered = await api('POST', `/api/v1/platform/plugins/${key}/versions`, {
    token: platformToken,
    body: {
      source: 'JAR_BUNDLE',
      version,
      artifact_ref: artifactRef,
      checksum,
      manifest,
    },
  });
  console.log(`version ${key}:`, registered.status, registered.json?.code ?? '',
    registered.json?.message ?? '');
  const published = await api('PATCH', `/api/v1/platform/plugins/${key}/versions/${version}`, {
    token: platformToken,
    body: { action: 'PUBLISH', reason: 'S08 QA E2E' },
  });
  console.log(`publish ${key}:`, published.status, published.json?.code ?? '');
  const entitled = await api(
    'PUT', `/api/v1/platform/tenants/${tenantId}/plugins/${key}/entitlement`,
    { token: platformToken, body: { allowed: true } });
  console.log(`entitlement ${key}:`, entitled.status, entitled.json?.code ?? '');
  const install = await api('POST', `/api/v1/tenant/plugins/${key}/install`, {
    token,
    body: { version },
  });
  console.log(`install ${key}:`, install.status, install.json?.code ?? '');
  const operationId = install.json?.data?.operation_id;
  for (let i = 0; i < 80; i++) {
    await sleep(3000);
    const op = await api('GET', `/api/v1/plugins/operations/${operationId}`, { token });
    const status = op.json?.data?.status;
    if (status === 'ACTIVE') return true;
    if (status === 'FAILED') {
      console.log(`install ${key} failed:`, JSON.stringify(op.json?.data));
      return false;
    }
  }
  return false;
}

for (const plugin of ['workflow', 'form', 'employee']) {
  const manifest = JSON.parse(
    fs.readFileSync(path.resolve(`plugins/${plugin}/plugin.json`), 'utf8'));
  const ok = await installPlugin(plugin, manifest.version);
  record(`E-${plugin}`, `install ${plugin}@${manifest.version} ACTIVE via runtime deployer`, ok);
}

// ------------------------------------------- TC-E0 engine bootstrap check
const definitions = await api('GET', '/api/v1/plugins/runtime/workflow/api/v1/workflow/definitions', { token });
const seeded = (definitions.json?.data?.items ?? []).some(
  (item) => item.key === 'employee-profile-change' && item.status === 'PUBLISHED',
);
record('TC-E0', 'bootstrap seeded employee-profile-change PUBLISHED', seeded,
  JSON.stringify(definitions.json?.data?.items?.map((item) => item.key + ':' + item.status)));

// ------------------------------------------------ TC-E2 form -> workflow
const formPayload = {
  slug: 'contact-requests',
  title: 'Contact requests',
  description: 'Public intake form',
  document: {
    items: [
      { type: 'SECTION', title: 'Info' },
      { type: 'SHORT_TEXT', ref: 'full_name', label: 'Full name', required: true },
      { type: 'SINGLE_CHOICE', ref: 'priority', label: 'Priority', options: [
        { value: 'normal' },
        { value: 'urgent' },
      ] },
    ],
  },
};
const created = await api('POST', '/api/v1/plugins/runtime/form/api/v1/form/forms', {
  token, body: formPayload,
});
const formId = created.json?.data?.id;
record('TC-E2.1', 'form created via runtime gateway', Boolean(formId), `id=${formId}`);

const published = await api(
  'POST',
  `/api/v1/plugins/runtime/form/api/v1/form/forms/${formId}/publish`,
  { token, body: {} },
);
record('TC-E2.2', 'form published', published.json?.data?.publish_status === 'PUBLISHED');

// workflow definition + trigger wiring form.response.submitted
const adminUserId = psql(`SELECT id FROM users WHERE email='${email}'`);
const flowDocument = {
  nodes: [
    { id: 'start', type: 'START', next: 'triage' },
    { id: 'triage', type: 'APPROVAL', approval_mode: 'ANY_ONE',
      assignment: { kind: 'USER', user_id: adminUserId },
      sla: { due_hours: 24, remind_before_hours: 4 },
      next: 'end' },
    { id: 'end', type: 'END', outcome: 'APPROVED' },
  ],
};
const flowCreated = await api('POST', '/api/v1/plugins/runtime/workflow/api/v1/workflow/definitions', {
  token, body: { key: 'form-intake-approval', document: flowDocument },
});
const flowId = flowCreated.json?.data?.id;
const flowPublished = await api(
  'POST',
  `/api/v1/plugins/runtime/workflow/api/v1/workflow/definitions/${flowId}/publish`,
  { token, body: {} },
);
record('TC-E2.3', 'form-intake-approval definition published',
  flowPublished.json?.data?.status === 'PUBLISHED');

const trigger = await api('POST', '/api/v1/plugins/runtime/workflow/api/v1/workflow/triggers', {
  token,
  body: { definition_id: flowId, source_plugin: 'form', entity: 'FormResponse',
    event_type: 'form.response.submitted' },
});
record('TC-E2.4', 'trigger registered form.response.submitted',
  Boolean(trigger.json?.data?.id));

// anonymous session + submit
const session = await api('POST', '/api/v1/plugins/public-session/form', {
  body: { tenant_slug: tenantSlug, ref: 'contact-requests' },
});
console.log('public session:', session.status, session.json?.code ?? '',
  session.json?.message ?? '');
const anonToken = session.json?.data?.token;
record('TC-E2.5', 'anonymous public session issued', Boolean(anonToken));

const publicView = await api(
  'GET',
  `/api/v1/plugins/runtime/form/api/v1/form/public/forms/contact-requests?plugin_token=${encodeURIComponent(anonToken)}`,
);
record('TC-E2.6', 'anonymous view returns published document',
  publicView.status === 200 && publicView.json?.data?.form_version === 1);

const submit = await api(
  'POST',
  `/api/v1/plugins/runtime/form/api/v1/form/public/forms/contact-requests/responses?plugin_token=${encodeURIComponent(anonToken)}`,
  { body: { answers: { full_name: 'Nguyen Van A', priority: 'urgent' },
    responder_email: 'customer@example.com', idempotency_key: 'e2e-s08-1' } },
);
record('TC-E2.7', 'anonymous submit accepted (idempotent first)',
  submit.status === 200 && Boolean(submit.json?.data?.id),
  `entity_write=${submit.json?.data?.entity_write_status}`);
const responseId = submit.json?.data?.id;

const submitDuplicate = await api(
  'POST',
  `/api/v1/plugins/runtime/form/api/v1/form/public/forms/contact-requests/responses?plugin_token=${encodeURIComponent(anonToken)}`,
  { body: { answers: { full_name: 'Nguyen Van A' }, idempotency_key: 'e2e-s08-1' } },
);
record('TC-S1', 'duplicate idempotency_key returns same response (no duplicate row)',
  submitDuplicate.json?.data?.id === responseId);

// relay (10s) -> trigger -> instance; poll up to 3 min (delivery retry backoff)
let instance = null;
for (let i = 0; i < 60; i++) {
  await sleep(3000);
  const instances = await api(
    'GET', '/api/v1/plugins/runtime/workflow/api/v1/workflow/instances', { token });
  instance = (instances.json?.data?.items ?? []).find(
    (item) => item.trigger_type === 'EVENT'
      && JSON.stringify(item.source_ref ?? {}).includes(responseId));
  if (instance) break;
}
record('TC-E2.8', 'form response triggered workflow instance via event hub',
  Boolean(instance), instance ? `id=${instance.id} status=${instance.status}` : 'not found');

let pendingTask = null;
if (instance) {
  for (let i = 0; i < 10 && !pendingTask; i++) {
    await sleep(2000);
    const progress = await api(
      'GET',
      `/api/v1/plugins/runtime/workflow/api/v1/workflow/instances/${instance.id}`,
      { token },
    );
    pendingTask = (progress.json?.data?.tasks ?? []).find(
      (task) => task.status === 'PENDING' || task.status === 'IN_PROGRESS');
  }
}
record('TC-E2.9', 'approval task assigned to configured user', Boolean(pendingTask),
  pendingTask ? `node=${pendingTask.node_id} assignees=${JSON.stringify(pendingTask.assignees)}` : 'no task');

if (pendingTask) {
  const approved = await api(
    'POST',
    `/api/v1/plugins/runtime/workflow/api/v1/workflow/tasks/${pendingTask.id}/actions`,
    { token, body: { actor_user_id: adminUserId, action: 'APPROVE', comment: 'E2E approve' } },
  );
  record('TC-E2.10', 'approval action applied', approved.status === 200);
}

let completed = null;
for (let i = 0; i < 10 && !completed; i++) {
  await sleep(2000);
  const instances = await api(
    'GET', '/api/v1/plugins/runtime/workflow/api/v1/workflow/instances', { token });
  completed = (instances.json?.data?.items ?? []).find(
    (item) => instance && item.id === instance.id && item.status === 'COMPLETED');
}
record('TC-E2.11', 'instance completed APPROVED after approval', Boolean(completed),
  completed ? `outcome=${completed.outcome}` : 'still running');

// ------------------------------------------- TC-E1 employee via engine
// Tenant setup: allow self-edit of personal_email with approval required —
// mirrors a real tenant configuring its own approval fields.
const fieldConfig = await api(
  'PUT',
  '/api/v1/plugins/runtime/employee/api/v1/employee/config/fields',
  { token, body: [{ field_key: 'personal_email', editable_by_employee: true,
    requires_approval: true, sort_order: 5 }] },
);
console.log('field config:', fieldConfig.status, fieldConfig.json?.code ?? '');
const employee = await api(
  'POST',
  '/api/v1/plugins/runtime/employee/api/v1/employee/employees',
  { token, body: { full_name: 'QA Self User', employee_code: 'QA-001',
    user_id: adminUserId, status: 'ACTIVE' } },
);
const employeeId = employee.json?.data?.id;
console.log('employee create:', employee.status, employee.json?.code ?? '');
const selfChange = await api(
  'POST',
  '/api/v1/plugins/runtime/employee/api/v1/employee/me/change-requests',
  { token, body: { changes: { personal_email: 'qa-self@example.com' } } },
);
console.log('self change:', selfChange.status, selfChange.json?.code ?? '');
record('TC-E1.1', 'self change request opened', selfChange.status === 200,
  `code=${selfChange.json?.code} id=${selfChange.json?.data?.id ?? ''}`);
const changeId = selfChange.json?.data?.id;
let changeInstanceId = null;
if (changeId) {
  for (let i = 0; i < 6; i++) {
    try {
      changeInstanceId = psql(
        `SELECT workflow_instance_id FROM tenant_${tenantId.slice(0, 8)}_employee.plg_employee_change_requests
         WHERE id='${changeId}' AND workflow_instance_id IS NOT NULL`);
      if (changeInstanceId) break;
    } catch {
      // schema/migration may still be committing right after install
    }
    await sleep(2500);
  }
}
record('TC-E1.2', 'change request bound to workflow instance',
  Boolean(changeInstanceId), changeInstanceId ?? 'null');

if (changeInstanceId) {
  const progress = await api(
    'GET',
    `/api/v1/plugins/runtime/workflow/api/v1/workflow/instances/${changeInstanceId}`,
    { token },
  );
  const task = (progress.json?.data?.tasks ?? []).find(
    (item) => item.status === 'PENDING' || item.status === 'IN_PROGRESS');
  if (task) {
    const wrongApprover = await api(
      'POST',
      `/api/v1/plugins/runtime/workflow/api/v1/workflow/tasks/${task.id}/actions`,
      { token, body: { actor_user_id: adminUserId, action: 'APPROVE' } },
    );
    record('TC-S2', 'engine rejects approver outside assignee list (new enforcement)',
      wrongApprover.json?.code === 'WORKFLOW_TASK_NOT_ASSIGNEE'
        || wrongApprover.json?.code === 'WORKFLOW_SELF_APPROVAL_FORBIDDEN',
      `code=${wrongApprover.json?.code}`);
  }
}

// ---------------------------------------------------- TC-S negatives
const badSession = await api('POST', '/api/v1/plugins/public-session/form', {
  body: { tenant_slug: 'no-such-tenant-xyz', ref: 'contact-requests' },
});
record('TC-S3', 'public session for unknown tenant rejected',
  badSession.status === 404 || badSession.json?.code === 'PUBLIC_TENANT_NOT_FOUND',
  `code=${badSession.json?.code ?? badSession.status}`);

const anonAdminCall = await api(
  'GET',
  `/api/v1/plugins/runtime/form/api/v1/form/forms?plugin_token=${encodeURIComponent(anonToken)}`,
);
record('TC-S4', 'anonymous token cannot read admin response data (empty permission set)',
  anonAdminCall.json?.code === 'IAM_PERMISSION_DENIED_FUNCTIONAL' || anonAdminCall.status === 403 || anonAdminCall.json?.success === false,
  `code=${anonAdminCall.json?.code ?? anonAdminCall.status}`);

let rateLimited = false;
for (let i = 0; i < 70; i++) {
  const probe = await api('POST', '/api/v1/plugins/public-session/form', {
    body: { tenant_slug: 'qa-s08', ref: 'contact-requests' },
  });
  if (probe.status === 429 || probe.json?.code === 'PUBLIC_RATE_LIMITED') {
    rateLimited = true;
    break;
  }
}
record('TC-S5', 'public session rate limited (429) after burst', rateLimited);

// ---------------------------------------------------------------- report
const summary = {
  generated_at: new Date().toISOString(),
  base: BASE,
  tenant: tenantSlug,
  total: results.length,
  passed: results.filter((item) => item.pass).length,
  failed: results.filter((item) => !item.pass).length,
  results,
};
fs.writeFileSync(path.join(EVIDENCE, 'e2e_results.json'), JSON.stringify(summary, null, 2));
console.log(`\nE2E summary: ${summary.passed}/${summary.total} PASS — ${path.join(EVIDENCE, 'e2e_results.json')}`);
if (summary.failed > 0) {
  process.exitCode = 1;
}
