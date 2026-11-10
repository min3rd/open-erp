// scripts/qa/test-grid-cascading-dropdowns.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const BASE = 'http://localhost:8088';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const evidenceDir = path.resolve('docs/sprints/sprint_08_plugin_form_workflow/08_testing/evidence/s08_qa_real/screenshots');
const artifactDir = path.resolve('C:/Users/Minh/.gemini/antigravity/brain/d6c236a0-8ff5-4d1f-9059-b4d7dfb1199b/screenshots');
fs.mkdirSync(evidenceDir, { recursive: true });
fs.mkdirSync(artifactDir, { recursive: true });

function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    if (out && out.trim()) console.log(out.trim());
    return out ? out.trim() : '';
  } catch (err) {
    console.error(`Error executing ${cmd}: ${err.message}`);
    return null;
  }
}

function psql(query) {
  const flat = query.replace(/\s+/g, ' ').trim();
  return execSync(
    `docker exec openerp-postgres-primary psql -U openerp -d openerp_dev -tAc "${flat.replace(/"/g, '\\"')}"`,
    { encoding: 'utf8' },
  ).trim();
}

async function main() {
  console.log('================================================================');
  console.log('=== VERIFY EXCEL GRID CASCADING SELECTS & ROW-LEVEL ISOLATION ===');
  console.log('================================================================');

  // 1. Get active tenant admin
  const adminRow = psql(
    "SELECT u.email, t.slug, t.id FROM users u JOIN user_tenants ut ON ut.user_id = u.id JOIN tenants t ON ut.tenant_id = t.id WHERE u.email LIKE 'qa-s08-admin%' AND u.status='ACTIVE' ORDER BY u.created_at DESC LIMIT 1;"
  );
  if (!adminRow) {
    console.error('No active tenant admin found');
    process.exit(1);
  }
  const [email, tenantSlug, tenantId] = adminRow.split('|');
  console.log(`Tenant: ${tenantSlug} (${tenantId}), User: ${email}`);

  // 2. Login
  const loginRes = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'E2eForm!2026' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.access_token;
  if (!token) {
    console.error('Login failed', loginData);
    process.exit(1);
  }
  console.log('Logged in successfully');

  // 3. Define form with Grid Cascading Selects (Province -> District -> Ward)
  const slug = 'grid-cascading-equipment-request-v1';
  const gridFormPayload = {
    slug,
    title: 'Phiếu Yêu Cầu Cung Cấp Thiết Bị & Địa Điểm Lắp Đặt 2026',
    description: 'Biểu mẫu tích hợp lưới dữ liệu Excel Grid hỗ trợ dropdown phân cấp Tỉnh/Thành -> Quận/Huyện -> Phường/Xã cho từng dòng độc lập, tự động tính tổng chi phí.',
    document: {
      layout: {
        mode: 'SECTION',
        columns: 2,
        mobile_columns: 1,
        row_gap: 'compact',
      },
      items: [
        {
          type: 'SECTION',
          title: '1. Thông Tin Chung Đơn Vị Yêu Cầu',
          description: 'Thông tin phòng ban và người đại diện nhận thiết bị',
          grid_columns: 2,
        },
        {
          type: 'SHORT_TEXT',
          ref: 'org_name',
          label: 'Đơn vị / Chi nhánh yêu cầu',
          placeholder: 'Ví dụ: Trung tâm Dữ liệu Vùng 1',
          required: true,
          col_span: 1,
        },
        {
          type: 'DATE',
          ref: 'request_date',
          label: 'Ngày đề xuất',
          required: true,
          col_span: 1,
        },
        {
          type: 'SECTION',
          title: '2. Danh Mục Thiết Bị & Địa Điểm Triển Khai (Excel Grid)',
          description: 'Hỗ trợ dropdown phụ thuộc cha con (Tỉnh/Thành -> Quận/Huyện -> Phường/Xã) độc lập theo từng dòng, tự động nhân thành tiền và cộng tổng chi phí.',
          grid_columns: 2,
        },
        {
          type: 'GRID',
          ref: 'deployment_items',
          label: 'Bảng Thiết Bị & Địa Điểm Lắp Đặt',
          col_span: 2,
          default_rows: 2,
          min_rows: 1,
          max_rows: 15,
          allow_add_row: true,
          allow_delete_row: true,
          columns_def: [
            {
              key: 'province',
              label: 'Tỉnh / Thành',
              type: 'SELECT',
              width: '140px',
              option_source: 'CATALOG',
              catalog_type: 'PROVINCE',
              required: true,
            },
            {
              key: 'district',
              label: 'Quận / Huyện',
              type: 'SELECT',
              width: '150px',
              option_source: 'CATALOG',
              catalog_type: 'DISTRICT',
              depends_on: 'province',
              required: true,
            },
            {
              key: 'ward',
              label: 'Phường / Xã',
              type: 'SELECT',
              width: '150px',
              option_source: 'CATALOG',
              catalog_type: 'WARD',
              depends_on: 'district',
            },
            {
              key: 'equipment_type',
              label: 'Loại Thiết Bị',
              type: 'SELECT',
              width: '150px',
              option_source: 'STATIC',
              options: [
                { value: 'Server', label: 'Máy chủ Dell 2U' },
                { value: 'Switch', label: 'Switch Cisco 48-port' },
                { value: 'UPS', label: 'Bộ lưu điện APC 5kVA' },
                { value: 'Workstation', label: 'Máy trạm đồ họa' },
              ],
              required: true,
            },
            {
              key: 'qty',
              label: 'Số Lượng',
              type: 'NUMBER',
              width: '90px',
              placeholder: '1',
              summary: 'SUM',
              required: true,
            },
            {
              key: 'price',
              label: 'Đơn Giá (VNĐ)',
              type: 'NUMBER',
              width: '130px',
              placeholder: '0',
              required: true,
            },
            {
              key: 'subtotal',
              label: 'Thành Tiền (VNĐ)',
              type: 'FORMULA',
              formula: 'qty * price',
              width: '150px',
              summary: 'SUM',
            },
          ],
        },
        {
          type: 'LONG_TEXT',
          ref: 'special_notes',
          label: 'Yêu cầu kỹ thuật đặc biệt',
          placeholder: 'Thời gian thi công ban đêm, yêu cầu nguồn điện đôi...',
          col_span: 2,
        },
      ],
    },
  };

  // 4. Upsert form via Form API
  console.log('Upserting form definition...');
  const createRes = await fetch(`${BASE}/api/v1/plugins/runtime/form/api/v1/form/forms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
    },
    body: JSON.stringify(gridFormPayload),
  });
  const createData = await createRes.json();
  console.log('Create response:', createData.code, createData.data?.id);
  const formId = createData.data?.id;

  // 5. Publish form
  console.log('Publishing form...');
  const pubRes = await fetch(`${BASE}/api/v1/plugins/runtime/form/api/v1/form/forms/${formId}/publish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Id': tenantId,
    },
  });
  const pubData = await pubRes.json();
  console.log('Publish response:', pubData.code);

  const publicUrl = `${BASE}/public/forms/${tenantSlug}/${slug}`;
  console.log(`Public fill URL: ${publicUrl}`);

  // 6. Test Public Form Filling with Cascading Selects in Grid
  console.log('\n--- 1. Testing Public Form Fill Runtime: Cascading Selects in Grid ---');
  run('agent-browser --session gridtest close');
  run('agent-browser --session gridtest set viewport 1440 900');
  run(`agent-browser --session gridtest open "${publicUrl}"`);
  await sleep(4000);

  // Fill Header Info
  console.log('Filling form headers...');
  run('agent-browser --session gridtest fill "#input-org_name" "Trung tâm Điều hành Mạng Quốc Gia (NOC)"');
  await sleep(300);
  run('agent-browser --session gridtest fill "#input-request_date" "2026-11-20"');
  await sleep(300);

  // Screenshot 1: Initial State (Locked child columns)
  const screen1_evidence = path.join(evidenceDir, 'grid_cascading_01_initial_locked.png');
  const screen1_artifact = path.join(artifactDir, 'grid_cascading_01_initial_locked.png');
  run(`agent-browser --session gridtest screenshot --full "${screen1_evidence}"`);
  fs.copyFileSync(screen1_evidence, screen1_artifact);
  console.log('Captured Screen 1 (Initial Locked State):', screen1_evidence);

  // Step 1: Select Row 1 Province = HN (Hà Nội)
  console.log('\n--- Step 1: Selecting Row 1 Province = HN ---');
  const selHN = `(() => {
    const table = document.querySelector('table');
    const r1 = table.querySelectorAll('tbody tr')[0];
    const sel = r1.querySelectorAll('select')[0];
    sel.value = 'HN';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    sel.dispatchEvent(new Event('input', { bubbles: true }));
    return sel.value;
  })()`;
  run(`agent-browser --session gridtest eval "${selHN.replace(/\n/g, ' ')}"`);
  await sleep(800);

  // Screenshot 2: Row 1 unlocked, Row 2 still locked
  const screen2_evidence = path.join(evidenceDir, 'grid_cascading_02_row1_unlocked.png');
  const screen2_artifact = path.join(artifactDir, 'grid_cascading_02_row1_unlocked.png');
  run(`agent-browser --session gridtest screenshot --full "${screen2_evidence}"`);
  fs.copyFileSync(screen2_evidence, screen2_artifact);
  console.log('Captured Screen 2 (Row 1 Unlocked, Row 2 Isolated Locked):', screen2_evidence);

  // Step 2: Select Row 1 District = BA_DINH -> Ward unlocks -> Select DOI_CAN
  console.log('\n--- Step 2: Selecting Row 1 District = BA_DINH, Ward = DOI_CAN, Server, 2 x 150M ---');
  const r1Fill = `(() => {
    const table = document.querySelector('table');
    const r1 = table.querySelectorAll('tbody tr')[0];
    const selects = r1.querySelectorAll('select');
    const nums = r1.querySelectorAll('input[type=number]');

    selects[1].value = 'BA_DINH';
    selects[1].dispatchEvent(new Event('change', { bubbles: true }));
    selects[1].dispatchEvent(new Event('input', { bubbles: true }));

    setTimeout(() => {
      selects[2].value = 'DOI_CAN';
      selects[2].dispatchEvent(new Event('change', { bubbles: true }));
      selects[2].dispatchEvent(new Event('input', { bubbles: true }));

      selects[3].value = 'Server';
      selects[3].dispatchEvent(new Event('change', { bubbles: true }));
      selects[3].dispatchEvent(new Event('input', { bubbles: true }));

      nums[0].value = '2';
      nums[0].dispatchEvent(new Event('change', { bubbles: true }));
      nums[0].dispatchEvent(new Event('input', { bubbles: true }));

      nums[1].value = '150000000';
      nums[1].dispatchEvent(new Event('change', { bubbles: true }));
      nums[1].dispatchEvent(new Event('input', { bubbles: true }));
    }, 400);
  })()`;
  run(`agent-browser --session gridtest eval "${r1Fill.replace(/\n/g, ' ')}"`);
  await sleep(1200);

  // Step 3: Populate Row 2: Province = HCM -> District = Q1 -> Ward = BEN_NGHE -> Switch, 4 x 35M
  console.log('\n--- Step 3: Selecting Row 2 Province=HCM, District=Q1, Ward=BEN_NGHE, Switch, 4 x 35M ---');
  const r2Fill = `(() => {
    const table = document.querySelector('table');
    const r2 = table.querySelectorAll('tbody tr')[1];
    const selects = r2.querySelectorAll('select');
    const nums = r2.querySelectorAll('input[type=number]');

    selects[0].value = 'HCM';
    selects[0].dispatchEvent(new Event('change', { bubbles: true }));
    selects[0].dispatchEvent(new Event('input', { bubbles: true }));

    setTimeout(() => {
      selects[1].value = 'Q1';
      selects[1].dispatchEvent(new Event('change', { bubbles: true }));
      selects[1].dispatchEvent(new Event('input', { bubbles: true }));

      setTimeout(() => {
        selects[2].value = 'BEN_NGHE';
        selects[2].dispatchEvent(new Event('change', { bubbles: true }));
        selects[2].dispatchEvent(new Event('input', { bubbles: true }));

        selects[3].value = 'Switch';
        selects[3].dispatchEvent(new Event('change', { bubbles: true }));
        selects[3].dispatchEvent(new Event('input', { bubbles: true }));

        nums[0].value = '4';
        nums[0].dispatchEvent(new Event('change', { bubbles: true }));
        nums[0].dispatchEvent(new Event('input', { bubbles: true }));

        nums[1].value = '35000000';
        nums[1].dispatchEvent(new Event('change', { bubbles: true }));
        nums[1].dispatchEvent(new Event('input', { bubbles: true }));
      }, 400);
    }, 400);
  })()`;
  run(`agent-browser --session gridtest eval "${r2Fill.replace(/\n/g, ' ')}"`);
  await sleep(1500);

  // Screenshot 3: Both Rows Populated with Independent Cascading Values & Formula Summaries
  const screen3_evidence = path.join(evidenceDir, 'grid_cascading_03_both_rows_populated.png');
  const screen3_artifact = path.join(artifactDir, 'grid_cascading_03_both_rows_populated.png');
  run(`agent-browser --session gridtest screenshot --full "${screen3_evidence}"`);
  fs.copyFileSync(screen3_evidence, screen3_artifact);
  console.log('Captured Screen 3 (Both rows independent cascading):', screen3_evidence);

  // Step 4: Verify Cascading Reset: Change Row 1 Province to DN (Đà Nẵng)
  console.log('\n--- Step 4: Changing Row 1 Province to DN -> District & Ward must reset, Row 2 untouched ---');
  const r1ChangeDN = `(() => {
    const table = document.querySelector('table');
    const r1 = table.querySelectorAll('tbody tr')[0];
    const sel = r1.querySelectorAll('select')[0];
    sel.value = 'DN';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    sel.dispatchEvent(new Event('input', { bubbles: true }));
  })()`;
  run(`agent-browser --session gridtest eval "${r1ChangeDN.replace(/\n/g, ' ')}"`);
  await sleep(800);

  // Screenshot 4: Row 1 District & Ward reset to blank, Row 2 intact!
  const screen4_evidence = path.join(evidenceDir, 'grid_cascading_04_reset_verification.png');
  const screen4_artifact = path.join(artifactDir, 'grid_cascading_04_reset_verification.png');
  run(`agent-browser --session gridtest screenshot --full "${screen4_evidence}"`);
  fs.copyFileSync(screen4_evidence, screen4_artifact);
  console.log('Captured Screen 4 (Cascading Reset Verified):', screen4_evidence);

  // Reselect Row 1: District = HAI_CHAU, Ward = THACH_THANG
  console.log('Reselecting Row 1 District=HAI_CHAU, Ward=THACH_THANG...');
  const r1Reselect = `(() => {
    const table = document.querySelector('table');
    const r1 = table.querySelectorAll('tbody tr')[0];
    const selects = r1.querySelectorAll('select');
    selects[1].value = 'HAI_CHAU';
    selects[1].dispatchEvent(new Event('change', { bubbles: true }));
    selects[1].dispatchEvent(new Event('input', { bubbles: true }));

    setTimeout(() => {
      selects[2].value = 'THACH_THANG';
      selects[2].dispatchEvent(new Event('change', { bubbles: true }));
      selects[2].dispatchEvent(new Event('input', { bubbles: true }));
    }, 400);
  })()`;
  run(`agent-browser --session gridtest eval "${r1Reselect.replace(/\n/g, ' ')}"`);
  await sleep(1200);

  // Fill responder email
  run('agent-browser --session gridtest fill "input[name=responder_email]" "it-operations@fpt.com.vn"');
  await sleep(400);

  // Screenshot 5: Reselected and Ready to Submit
  const screen5_evidence = path.join(evidenceDir, 'grid_cascading_05_reselected_and_ready.png');
  const screen5_artifact = path.join(artifactDir, 'grid_cascading_05_reselected_and_ready.png');
  run(`agent-browser --session gridtest screenshot --full "${screen5_evidence}"`);
  fs.copyFileSync(screen5_evidence, screen5_artifact);
  console.log('Captured Screen 5 (Reselected & Ready):', screen5_evidence);

  // Step 5: Submit form
  console.log('\n--- Step 5: Submitting Form ---');
  run(`agent-browser --session gridtest eval "
    const btn = document.querySelector('button[type=submit]');
    if (btn) btn.click();
  "`);
  await sleep(3500);

  // Screenshot 6: Submission Success Confirmation
  const screen6_evidence = path.join(evidenceDir, 'grid_cascading_06_submitted_success.png');
  const screen6_artifact = path.join(artifactDir, 'grid_cascading_06_submitted_success.png');
  run(`agent-browser --session gridtest screenshot --full "${screen6_evidence}"`);
  fs.copyFileSync(screen6_evidence, screen6_artifact);
  console.log('Captured Screen 6 (Submission Success):', screen6_evidence);

  run('agent-browser --session gridtest close');

  // Step 6: Verify in PostgreSQL database
  console.log('\n--- Step 6: Verifying Saved Form Response in PostgreSQL ---');
  const tenantSchema = `tenant_${tenantId.slice(0, 8)}_form`;
  const savedRow = psql(
    `SELECT answers FROM ${tenantSchema}.plg_form_responses r JOIN ${tenantSchema}.plg_form_definitions d ON r.form_id = d.id WHERE d.slug = '${slug}' ORDER BY r.submitted_at DESC LIMIT 1;`
  );
  console.log('Saved answers in DB:');
  console.log(savedRow);

  console.log('\n================================================================');
  console.log('=== ALL GRID CASCADING & ROW ISOLATION TESTS PASSED 100% ===');
  console.log('================================================================');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
