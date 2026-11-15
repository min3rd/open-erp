const BASE = process.env.QA_BASE_URL || 'http://localhost:8088';
const PLUGIN = '/api/v1/plugins/runtime/attendance/api/v1/attendance';
const EMAIL = process.env.QA_ADMIN_EMAIL || 'review50c@acme.test';
const PASSWORD = process.env.QA_ADMIN_PASSWORD || 'Review@12345';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

async function main() {
  console.log(`Attendance Kiosk public QA → ${BASE}`);
  const loginResponse = await fetch(BASE + '/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const login = await loginResponse.json();
  check('Admin login returns access token', loginResponse.status === 200 && Boolean(login.data?.access_token));
  const jwt = login.data.access_token;
  const tenantSlug = login.data.user?.tenant_slug;
  check('Login exposes tenant slug', Boolean(tenantSlug), String(tenantSlug));

  const devicesResponse = await fetch(BASE + PLUGIN + '/admin/devices?page=1&size=200', {
    headers: { Authorization: 'Bearer ' + jwt },
  });
  const devices = await devicesResponse.json();
  const kiosk = (devices.data?.items || []).find((device) => device.device_type === 'KIOSK' && device.public_token);
  check('Kiosk device exposes a persisted public token', Boolean(kiosk), `${(devices.data?.items || []).length} devices`);
  if (!kiosk) {
    return;
  }

  const missingToken = await fetch(BASE + '/api/v1/plugins/public-session/attendance/kiosk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenant_slug: tenantSlug, device_code: kiosk.device_code }),
  });
  const missingTokenBody = await missingToken.json();
  check('Kiosk session requires the device token',
    missingToken.status === 400 && missingTokenBody.code === 'KIOSK_DEVICE_TOKEN_REQUIRED',
    `${missingToken.status} ${missingTokenBody.code}`);

  const sessionResponse = await fetch(BASE + '/api/v1/plugins/public-session/attendance/kiosk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenant_slug: tenantSlug,
      device_code: kiosk.device_code,
      device_token: kiosk.public_token,
    }),
  });
  const session = await sessionResponse.json();
  check('Device-scoped kiosk session is issued',
    sessionResponse.status === 200 && session.data?.plugin_key === 'attendance',
    `${sessionResponse.status} ${session.code}`);
  const pluginToken = session.data?.token;

  const employeesResponse = await fetch(
    BASE + PLUGIN + `/kiosks/${kiosk.device_code}/employees?token=${encodeURIComponent(kiosk.public_token)}`,
    { headers: { 'X-Plugin-Token': pluginToken } },
  );
  const employees = await employeesResponse.json();
  check('Anonymous kiosk lists employees without a core session',
    employeesResponse.status === 200 && (employees.data?.items || []).length > 0,
    `${employeesResponse.status} rows=${(employees.data?.items || []).length}`);
  check('Kiosk rows resolve employee code, name and department',
    (employees.data?.items || []).every((row) => row.code && row.name && row.department));

  const otherDevice = await fetch(
    BASE + PLUGIN + '/kiosks/KIOSK-OTHER/employees?token=' + encodeURIComponent(kiosk.public_token),
    { headers: { 'X-Plugin-Token': pluginToken } },
  );
  check('Device-scoped token cannot access another kiosk',
    otherDevice.status === 403,
    `${otherDevice.status}`);

  const asset = await fetch(
    BASE + '/api/v1/plugins/runtime/attendance/main.js?plugin_token=' + encodeURIComponent(pluginToken),
  );
  check('Device-scoped token can load the kiosk assets', asset.status === 200, `${asset.status}`);

  const withoutDeviceToken = await fetch(BASE + PLUGIN + `/kiosks/${kiosk.device_code}/employees`, {
    headers: { 'X-Plugin-Token': pluginToken },
  });
  const rejected = await withoutDeviceToken.json();
  check('Kiosk session still requires the device token on each call',
    withoutDeviceToken.status === 401 && rejected.code === 'KIOSK_DEVICE_TOKEN_INVALID',
    `${withoutDeviceToken.status} ${rejected.code}`);

  const staleToken = await fetch(BASE + PLUGIN + `/kiosks/${kiosk.device_code}/employees?token=stale-token`, {
    headers: { 'X-Plugin-Token': pluginToken },
  });
  const stale = await staleToken.json();
  check('Stale device token is rejected',
    staleToken.status === 401 && stale.code === 'KIOSK_DEVICE_TOKEN_INVALID',
    `${staleToken.status} ${stale.code}`);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('Failures: ' + failures.join('; '));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('QA run crashed: ' + error.message);
  process.exitCode = 1;
});
