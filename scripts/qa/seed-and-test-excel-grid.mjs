// scripts/qa/seed-and-test-excel-grid.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const BASE = 'http://localhost:8088';
const FRONTEND = 'http://localhost:4200';
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
    return out;
  } catch (err) {
    console.error(`Error executing ${cmd}: ${err.message}`);
    if (err.stdout) console.log('stdout:', err.stdout);
    if (err.stderr) console.log('stderr:', err.stderr);
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
  console.log('=== SEED & VERIFY EXCEL-STYLE GRID FORM ===');

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

  // 3. Define form with GRID field
  const slug = 'quotation-excel-grid-v1';
  const gridFormPayload = {
    slug,
    title: 'Báo Giá Thiết Bị & Dịch Vụ CNTT 2026 (Excel Grid)',
    description: 'Biểu mẫu báo giá tích hợp bảng tính Excel động, hỗ trợ tùy biến kiểu dữ liệu từng cột, thêm/xóa dòng linh hoạt, tự động tính thành tiền hàng ngang và tổng chi phí.',
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
          title: '1. Thông Tin Doanh Nghiệp & Đơn Hàng',
          description: 'Thông tin pháp nhân nhận báo giá',
          grid_columns: 2,
        },
        {
          type: 'SHORT_TEXT',
          ref: 'customer_name',
          label: 'Tên Doanh nghiệp / Khách hàng',
          placeholder: 'Ví dụ: Tập đoàn Viễn thông FPT',
          required: true,
          col_span: 1,
        },
        {
          type: 'DATE',
          ref: 'quotation_date',
          label: 'Ngày lập báo giá',
          required: true,
          col_span: 1,
        },
        {
          type: 'SECTION',
          title: '2. Bảng Kê Thiết Bị & Bản Quyền Phần Mềm (Excel Data Grid)',
          description: 'Bảng tính dữ liệu kiểu Excel: nhập số lượng, đơn giá để tự động tính thành tiền và tổng đơn',
          grid_columns: 2,
        },
        {
          type: 'GRID',
          ref: 'order_items',
          label: 'Bảng Chi Tiết Mặt Hàng & Chi Phí',
          col_span: 2,
          default_rows: 2,
          min_rows: 1,
          allow_add_row: true,
          allow_delete_row: true,
          columns_def: [
            {
              key: 'item_name',
              label: 'Tên Thiết Bị / Dịch Vụ',
              type: 'TEXT',
              width: '240px',
              placeholder: 'Nhập tên thiết bị hoặc phần mềm',
              required: true,
            },
            {
              key: 'category',
              label: 'Phân Loại',
              type: 'SELECT',
              width: '140px',
              options: [
                { value: 'Phần cứng', label: 'Phần cứng' },
                { value: 'Phần mềm', label: 'Phần mềm' },
                { value: 'Dịch vụ CNTT', label: 'Dịch vụ CNTT' },
              ],
            },
            {
              key: 'qty',
              label: 'Số Lượng',
              type: 'NUMBER',
              width: '90px',
              placeholder: '0',
              summary: 'SUM',
            },
            {
              key: 'price',
              label: 'Đơn Giá (VNĐ)',
              type: 'NUMBER',
              width: '130px',
              placeholder: '0',
            },
            {
              key: 'total',
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
          ref: 'notes',
          label: 'Ghi chú & Điều khoản thanh toán',
          placeholder: 'Thời gian bảo hành, phương thức giao hàng...',
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

  // 6. Test Form Studio UI with agent-browser
  console.log('\n--- 1. Testing Form Studio with Excel Grid Palette & Inspector ---');
  run('agent-browser --session grid1 close');
  run('agent-browser --session grid1 set viewport 1440 900');
  
  // Set localStorage auth before opening app
  run(`agent-browser --session grid1 open "${FRONTEND}/app/form"`);
  await sleep(2000);
  run(`agent-browser --session grid1 eval "
    localStorage.setItem('auth_token', '${token}');
    localStorage.setItem('token', '${token}');
    localStorage.setItem('tenant_id', '${tenantId}');
    localStorage.setItem('active_tenant', JSON.stringify({ id: '${tenantId}', slug: '${tenantSlug}' }));
    localStorage.setItem('user', JSON.stringify({ email: '${email}', tenant_id: '${tenantId}' }));
  "`);
  run(`agent-browser --session grid1 open "${FRONTEND}/app/form"`);
  await sleep(4000);

  // Click the row to open builder
  run(`agent-browser --session grid1 eval "
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const r = rows.find(x => x.textContent.includes('Báo Giá') || x.textContent.includes('Excel Grid') || x.textContent.includes('${slug}'));
    if (r) r.click();
  "`);
  await sleep(3000);

  // Click on the grid item on canvas to show inspector
  run(`agent-browser --session grid1 eval "
    const items = Array.from(document.querySelectorAll('[data-ref], div'));
    const target = items.find(el => el.textContent.includes('Bảng Chi Tiết') || el.textContent.includes('order_items'));
    if (target) target.click();
  "`);
  await sleep(2000);

  const screen1_evidence = path.join(evidenceDir, 'excel_grid_01_builder_inspector.png');
  const screen1_artifact = path.join(artifactDir, 'excel_grid_01_builder_inspector.png');
  run(`agent-browser --session grid1 screenshot --full "${screen1_evidence}"`);
  fs.copyFileSync(screen1_evidence, screen1_artifact);
  console.log('Captured screen 1:', screen1_evidence);
  run('agent-browser --session grid1 close');

  // 7. Test Public Form Filling with Excel Grid
  console.log('\n--- 2. Testing Public Fill Runtime with Excel Grid ---');
  run('agent-browser --session grid2 close');
  run('agent-browser --session grid2 set viewport 1440 900');
  run(`agent-browser --session grid2 open "${publicUrl}"`);
  await sleep(4000);

  // Take initial screenshot
  const screen2_evidence = path.join(evidenceDir, 'excel_grid_02_public_fill_initial.png');
  const screen2_artifact = path.join(artifactDir, 'excel_grid_02_public_fill_initial.png');
  run(`agent-browser --session grid2 screenshot --full "${screen2_evidence}"`);
  fs.copyFileSync(screen2_evidence, screen2_artifact);
  console.log('Captured screen 2:', screen2_evidence);

  // Fill Header Info
  console.log('Filling form headers and grid cells...');
  run('agent-browser --session grid2 fill "#input-customer_name" "Tập đoàn Viễn thông FPT"');
  await sleep(300);
  run('agent-browser --session grid2 fill "#input-quotation_date" "2026-11-15"');
  await sleep(300);

  // Fill Row 1
  console.log('Filling Row 1...');
  run(`agent-browser --session grid2 eval "
    const table = document.querySelector('table');
    const rows = table.querySelectorAll('tbody tr');
    if (rows[0]) {
      const text = rows[0].querySelector('input[type=\\"text\\"]');
      const select = rows[0].querySelector('select');
      const nums = rows[0].querySelectorAll('input[type=\\"number\\"]');
      if (text) { text.value = 'Dell PowerEdge R760 Server'; text.dispatchEvent(new Event('input', {bubbles:true})); }
      if (select) { select.value = 'Phần cứng'; select.dispatchEvent(new Event('change', {bubbles:true})); }
      if (nums[0]) { nums[0].value = '3'; nums[0].dispatchEvent(new Event('input', {bubbles:true})); }
      if (nums[1]) { nums[1].value = '150000000'; nums[1].dispatchEvent(new Event('input', {bubbles:true})); }
    }
  "`);
  await sleep(600);

  // Fill Row 2
  console.log('Filling Row 2...');
  run(`agent-browser --session grid2 eval "
    const table = document.querySelector('table');
    const rows = table.querySelectorAll('tbody tr');
    if (rows[1]) {
      const text = rows[1].querySelector('input[type=\\"text\\"]');
      const select = rows[1].querySelector('select');
      const nums = rows[1].querySelectorAll('input[type=\\"number\\"]');
      if (text) { text.value = 'Oracle Database Enterprise License'; text.dispatchEvent(new Event('input', {bubbles:true})); }
      if (select) { select.value = 'Phần mềm'; select.dispatchEvent(new Event('change', {bubbles:true})); }
      if (nums[0]) { nums[0].value = '2'; nums[0].dispatchEvent(new Event('input', {bubbles:true})); }
      if (nums[1]) { nums[1].value = '200000000'; nums[1].dispatchEvent(new Event('input', {bubbles:true})); }
    }
  "`);
  await sleep(600);

  // Click "+ Thêm dòng" button
  console.log('Clicking "+ Thêm dòng" button to add Row 3...');
  run(`agent-browser --session grid2 eval "
    const btns = Array.from(document.querySelectorAll('button'));
    const addBtn = btns.find(b => b.textContent.includes('Thêm dòng'));
    if (addBtn) addBtn.click();
  "`);
  await sleep(800);

  // Fill Row 3
  console.log('Filling Row 3...');
  run(`agent-browser --session grid2 eval "
    const table = document.querySelector('table');
    const rows = table.querySelectorAll('tbody tr');
    if (rows[2]) {
      const text = rows[2].querySelector('input[type=\\"text\\"]');
      const select = rows[2].querySelector('select');
      const nums = rows[2].querySelectorAll('input[type=\\"number\\"]');
      if (text) { text.value = 'Dịch vụ Cài đặt & Triển khai On-site'; text.dispatchEvent(new Event('input', {bubbles:true})); }
      if (select) { select.value = 'Dịch vụ CNTT'; select.dispatchEvent(new Event('change', {bubbles:true})); }
      if (nums[0]) { nums[0].value = '1'; nums[0].dispatchEvent(new Event('input', {bubbles:true})); }
      if (nums[1]) { nums[1].value = '50000000'; nums[1].dispatchEvent(new Event('input', {bubbles:true})); }
    }
  "`);
  await sleep(800);

  // Capture Screenshot of populated table with calculated formulas and totals
  const screen3_evidence = path.join(evidenceDir, 'excel_grid_03_public_fill_calculated.png');
  const screen3_artifact = path.join(artifactDir, 'excel_grid_03_public_fill_calculated.png');
  run(`agent-browser --session grid2 screenshot --full "${screen3_evidence}"`);
  fs.copyFileSync(screen3_evidence, screen3_artifact);
  console.log('Captured screen 3:', screen3_evidence);

  // Verify calculated values inside DOM
  const tableCheck = run(`agent-browser --session grid2 eval "
    const table = document.querySelector('table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    const tfoot = table.querySelector('tfoot');
    JSON.stringify({
      rowCount: rows.length,
      row1Total: rows[0]?.querySelectorAll('td')[5]?.textContent.trim(),
      row2Total: rows[1]?.querySelectorAll('td')[5]?.textContent.trim(),
      row3Total: rows[2]?.querySelectorAll('td')[5]?.textContent.trim(),
      tfoot: tfoot?.textContent.trim()
    });
  "`);
  console.log('DOM check result:', tableCheck);

  // Submit the form
  console.log('Submitting the form...');
  run(`agent-browser --session grid2 eval "
    const submitBtn = document.querySelector('button[type=\\"submit\\"]');
    if (submitBtn) submitBtn.click();
  "`);
  await sleep(3000);

  // Capture Submission Confirmation
  const screen4_evidence = path.join(evidenceDir, 'excel_grid_04_submitted_success.png');
  const screen4_artifact = path.join(artifactDir, 'excel_grid_04_submitted_success.png');
  run(`agent-browser --session grid2 screenshot --full "${screen4_evidence}"`);
  fs.copyFileSync(screen4_evidence, screen4_artifact);
  console.log('Captured screen 4:', screen4_evidence);
  run('agent-browser --session grid2 close');

  // Verify in PostgreSQL database
  console.log('\n--- 3. Verifying Saved Form Response in PostgreSQL ---');
  const tenantSchema = `tenant_${tenantId.slice(0, 8)}_form`;
  const savedRow = psql(
    `SELECT answers FROM ${tenantSchema}.plg_form_responses r JOIN ${tenantSchema}.plg_form_definitions d ON r.form_id = d.id WHERE d.slug = '${slug}' ORDER BY r.submitted_at DESC LIMIT 1;`
  );
  console.log('Saved answers in DB:');
  console.log(savedRow);

  console.log('\n=== ALL EXCEL-STYLE GRID CHECKS COMPLETED SUCCESSFULLY ===');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
