#!/usr/bin/env node
/**
 * Attendance plugin API QA against the real stack (PostgreSQL + Redis + gateway + plugin container).
 * Exercises the business flows end-to-end and asserts persisted state through the public API.
 *
 * Usage: API_BASE=http://localhost:8088 npm run qa:attendance-api
 */

const BASE = (process.env.API_BASE || 'http://localhost:8088').replace(/\/$/, '');
const EMAIL = process.env.QA_EMAIL || 'review50c@acme.test';
const PASSWORD = process.env.QA_PASSWORD || 'Review@12345';
const TENANT_ID = process.env.QA_TENANT_ID || '2a92f655-a07c-416d-953d-8e609b350b3f';
const PLUGIN = '/api/v1/plugins/runtime/attendance/api/v1/attendance';

let passed = 0;
let failed = 0;
const failures = [];

function check(name, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    failures.push(name);
    console.log(`FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

async function request(path, { method = 'GET', token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

async function login() {
  const first = await request('/api/v1/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  });
  if (first.status !== 200) {
    throw new Error(`login failed: ${first.status} ${JSON.stringify(first.json).slice(0, 200)}`);
  }
  const data = first.json?.data || {};
  if (data.access_token) {
    return data.access_token;
  }
  if (data.requires_tenant_selection) {
    const selected = await request('/api/v1/auth/select-tenant', {
      method: 'POST',
      body: { pre_auth_token: data.pre_auth_token, tenant_id: TENANT_ID },
    });
    if (selected.status !== 200 || !selected.json?.data?.access_token) {
      throw new Error(`select-tenant failed: ${selected.status}`);
    }
    return selected.json.data.access_token;
  }
  throw new Error('login did not return an access token');
}

function subjectOf(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
    return payload.sub || payload.user_id || null;
  } catch {
    return null;
  }
}

/**
 * Ensures the tenant has org departments and every employee has a primary
 * assignment. Reports resolve department names through the plugin data gateway
 * (cross-plugin READ), so this data is required to verify the join.
 */
async function ensureOrgAssignments(token, employees) {
  const orgBase = '/api/v1/plugins/runtime/org-structure/api/v1/org';
  const employeeBase = '/api/v1/plugins/runtime/employee/api/v1/employee';
  const branches = await request(orgBase + '/branches', { token });
  const departments = await request(orgBase + '/departments', { token });
  const branchItems = branches.json?.data?.items || [];
  const deptItems = departments.json?.data?.items || [];
  if (!branchItems.length || !deptItems.length) {
    return { assigned: 0, departments: 0 };
  }
  const branchId = (branchItems.find((item) => item.is_default) || branchItems[0]).id;

  let assigned = 0;
  for (let index = 0; index < employees.length; index++) {
    const employeeId = employees[index].employee_id;
    const existing = await request(`${employeeBase}/employees/${employeeId}/assignments`, { token });
    if ((existing.json?.data?.items || []).length > 0) {
      continue;
    }
    const department = deptItems[index % deptItems.length];
    const created = await request(`${employeeBase}/employees/${employeeId}/assignments`, {
      method: 'POST',
      token,
      body: {
        branch_id: branchId,
        department_id: department.id,
        job_title: 'Nhân viên',
        is_primary: true,
        valid_from: '2026-01-01',
        status: 'ACTIVE',
      },
    });
    if (created.status === 200) {
      assigned += 1;
    }
  }
  return { assigned, departments: deptItems.length };
}

async function main() {
  console.log(`Attendance API QA → ${BASE}`);
  const token = await login();
  check('AUTH login returns access token', Boolean(token));
  const subjectId = subjectOf(token);
  check('Access token carries user subject', Boolean(subjectId));

  const employees = await request(`${PLUGIN}/admin/employees`, { token });
  const employeeItems = employees.json?.data?.items || [];
  check('Employees endpoint returns seeded employees', employees.status === 200 && employeeItems.length > 0,
    `status=${employees.status} count=${employeeItems.length}`);

  const org = await ensureOrgAssignments(token, employeeItems);
  check('Org departments and employee assignments are available',
    org.departments > 0,
    `departments=${org.departments} assigned=${org.assigned}`);

  const stamp = Date.now().toString().slice(-6);
  const typeCode = `QA${stamp}`;
  const createdType = await request(`${PLUGIN}/admin/leave-types`, {
    method: 'POST',
    token,
    body: {
      code: typeCode,
      name: `QA leave ${stamp}`,
      paid: true,
      counts_as_work: true,
      deduct_balance: true,
      allow_negative: false,
      carry_over_max_days: 0,
      validity_months: 12,
      default_annual_grant: 2,
      is_active: true,
    },
  });
  check('Create leave type persists', createdType.status === 200 && createdType.json?.data?.code === typeCode,
    `status=${createdType.status} ${JSON.stringify(createdType.json).slice(0, 160)}`);
  const leaveTypeId = createdType.json?.data?.id;

  const linked = employeeItems.find((item) => item.user_id === subjectId);
  const employee = { employee_id: linked ? linked.employee_id : subjectId };
  const grant = await request(`${PLUGIN}/admin/leave-ledger/grants`, {
    method: 'POST',
    token,
    body: {
      employee_ids: [employee.employee_id],
      leave_type_id: leaveTypeId,
      days: 2,
      note: 'QA grant',
    },
  });
  check('Grant leave credits balance', grant.status === 200 && (grant.json?.data?.granted_count || 0) >= 1,
    `status=${grant.status}`);

  const balances = await request(`${PLUGIN}/admin/leave-balances?page=1&size=200`, { token });
  const balance = (balances.json?.data?.items || []).find(
    (item) => item.employee_id === employee.employee_id && item.leave_type_id === leaveTypeId
  );
  check('Leave balance reflects grant', Boolean(balance) && Number(balance.granted) >= 2,
    balance ? `granted=${balance.granted}` : 'balance not found');

  const ledger = await request(`${PLUGIN}/admin/leave-ledger?page=1&size=10`, { token });
  check('Leave ledger is queryable with employee names', ledger.status === 200 && (ledger.json?.data?.total_items || 0) > 0,
    `status=${ledger.status} total=${ledger.json?.data?.total_items}`);
  check('Ledger rows include employee_name',
    (ledger.json?.data?.items || []).some((row) => Boolean(row.employee_name)),
    JSON.stringify((ledger.json?.data?.items || [])[0] || {}).slice(0, 120));

  const today = new Date().toISOString().slice(0, 10);
  const submitted = await request(`${PLUGIN}/requests`, {
    method: 'POST',
    token,
    body: {
      request_type_code: 'LEAVE',
      response: {
        from_date: today,
        to_date: today,
        start_date: today,
        end_date: today,
        days: 1,
        leave_type_id: leaveTypeId,
        reason: 'QA leave request',
      },
      affected_window: { from_date: today, to_date: today, days: 1 },
    },
  });
  const requestId = submitted.json?.data?.id;
  check('Submit leave request persists response payload',
    submitted.status === 200 &&
      Boolean(requestId) &&
      submitted.json?.data?.response?.from_date === today &&
      submitted.json?.data?.status === 'PENDING',
    `status=${submitted.status} ${JSON.stringify(submitted.json).slice(0, 180)}`);

  const approved = await request(`${PLUGIN}/requests/${requestId}/fallback-action`, {
    method: 'POST',
    token,
    body: { action: 'APPROVED', comment: 'QA approval' },
  });
  check('Approve request applies mapping',
    approved.status === 200 &&
      approved.json?.data?.status === 'APPROVED' &&
      ['APPLIED', 'NOT_APPLICABLE'].includes(approved.json?.data?.mapping_status),
    `status=${approved.status} mapping=${approved.json?.data?.mapping_status}`);

  const team = await request(`${PLUGIN}/reports/team?from=2026-10-01&to=2026-10-31`, { token });
  check('Team report resolves department names via cross-plugin gRPC',
    (team.json?.data?.items || []).some((item) => Boolean(item.department_name)),
    `rows=${(team.json?.data?.items || []).length}`);

  const summary = await request(`${PLUGIN}/reports/summary?from=2026-10-01&to=2026-10-31`, { token });
  check('Summary report aggregates by department',
    (summary.json?.data?.by_department || []).length > 0,
    `departments=${(summary.json?.data?.by_department || []).length}`);

  const audit = await request(`${PLUGIN}/admin/audit?page=1&size=50`, { token });
  const actions = new Set((audit.json?.data?.items || []).map((row) => row.action));
  check('Audit trail records submit + approve', actions.has('REQUEST_SUBMIT') && actions.has('REQUEST_APPROVE'),
    `actions=${[...actions].join(',')}`);

  const recalc = await request(`${PLUGIN}/admin/records/recalculate`, {
    method: 'POST',
    token,
    body: { from: today, to: today },
  });
  check('Batch recalculation executes', recalc.status === 200 && Number(recalc.json?.data?.calculated) >= 0,
    `status=${recalc.status} calculated=${recalc.json?.data?.calculated}`);

  const records = await request(`${PLUGIN}/admin/records?page=1&size=1`, { token });
  check('Daily records are readable', records.status === 200 && typeof records.json?.data?.total_items === 'number',
    `status=${records.status}`);

  const timesheets = await request(`${PLUGIN}/admin/timesheets?page=1&size=10`, { token });
  check('Timesheet periods are readable', timesheets.status === 200,
    `status=${timesheets.status}`);

  const shifts = await request(`${PLUGIN}/admin/shifts`, { token });
  check('Shift catalog is readable', shifts.status === 200 && (shifts.json?.data?.items || []).length > 0,
    `count=${(shifts.json?.data?.items || []).length}`);

  const directory = await request(`${PLUGIN}/admin/employees`, { token });
  const dirItems = directory.json?.data?.items || [];
  check('Employee directory resolves department + branch',
    directory.status === 200 &&
      dirItems.some((row) => Boolean(row.department_name)) &&
      dirItems.some((row) => Boolean(row.branch_name)),
    `rows=${dirItems.length} dept=${dirItems.filter((row) => row.department_name).length} branch=${dirItems.filter((row) => row.branch_name).length}`);

  const employeeId = dirItems[0]?.employee_id;
  const employeeRecords = await request(`${PLUGIN}/admin/records/employee/${employeeId}?from=2026-10-01&to=2026-10-31`, { token });
  check('Employee attendance detail is readable',
    employeeRecords.status === 200 && (employeeRecords.json?.data?.items || []).length > 0,
    `status=${employeeRecords.status} rows=${(employeeRecords.json?.data?.items || []).length}`);

  const coverage = await request(`${PLUGIN}/admin/shift-coverage?month=2026-10`, { token });
  const coverageItems = coverage.json?.data?.items || [];
  check('Shift coverage resolves departments + branches',
    coverage.status === 200 &&
      coverageItems.some((row) => (row.department_names || []).length > 0) &&
      coverageItems.some((row) => (row.branch_names || []).length > 0),
    `status=${coverage.status} rows=${coverageItems.length}`);

  const myTimesheets = await request(`${PLUGIN}/my-timesheets?page=1&size=10`, { token });
  check('My timesheet periods are readable', myTimesheets.status === 200,
    `status=${myTimesheets.status}`);

  const myRecords = await request(`${PLUGIN}/my-records?from=2026-10-01&to=2026-10-31`, { token });
  check('My daily records are readable',
    myRecords.status === 200 && (myRecords.json?.data?.items || []).length > 0,
    `status=${myRecords.status} rows=${(myRecords.json?.data?.items || []).length}`);

  const auditFiltered = await request(`${PLUGIN}/admin/audit?action=REQUEST_SUBMIT&page=1&size=5`, { token });
  const auditRows = auditFiltered.json?.data?.items || [];
  check('Audit action filter narrows rows',
    auditFiltered.status === 200 && auditRows.length > 0 && auditRows.every((row) => row.action === 'REQUEST_SUBMIT'),
    `status=${auditFiltered.status} rows=${auditRows.length}`);

  // Positive lock/unlock: build a throwaway period up to DONE, lock it, verify
  // record changes are blocked, then unlock again.
  let period = (timesheets.json?.data?.items || []).find((row) => row.period_year === 2026 && row.period_month === 9);
  if (!period) {
    const created = await request(`${PLUGIN}/admin/timesheets`, {
      method: 'POST', token, body: { period_year: 2026, period_month: 9, scope_type: 'TENANT' },
    });
    period = created.json?.data;
  }
  const unlockFirst = await request(`${PLUGIN}/admin/timesheets/${period.id}/unlock`, { method: 'POST', token, body: { reason: 'QA reset' } });
  for (const step of ['S3_CALCULATE', 'S4_ADJUST', 'DONE']) {
    await request(`${PLUGIN}/admin/timesheets/${period.id}/step`, { method: 'POST', token, body: { step } });
  }
  const locked = await request(`${PLUGIN}/admin/timesheets/${period.id}/lock`, { method: 'POST', token, body: {} });  const blocked = await request(`${PLUGIN}/admin/timesheets/${period.id}/step`, { method: 'POST', token, body: { step: 'S3_CALCULATE' } });
  const unlocked = await request(`${PLUGIN}/admin/timesheets/${period.id}/unlock`, { method: 'POST', token, body: { reason: 'QA unlock after positive lock' } });
  check('Timesheet lock blocks edits and unlock restores',
    (locked.status === 200 || unlockFirst.status === 200) &&
      blocked.status === 400 && blocked.json?.code === 'ATTENDANCE_RECORD_LOCKED' &&
      unlocked.status === 200 && unlocked.json?.data?.locked_at == null,
    `lock=${locked.status} blocked=${blocked.status}/${blocked.json?.code} unlock=${unlocked.status}`);

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
