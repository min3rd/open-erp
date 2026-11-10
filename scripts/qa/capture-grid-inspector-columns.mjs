// scripts/qa/capture-grid-inspector-columns.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const FRONTEND = 'http://localhost:4200';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const evidenceDir = path.resolve('docs/sprints/sprint_08_plugin_form_workflow/08_testing/evidence/s08_qa_real/screenshots');
const artifactDir = path.resolve('C:/Users/Minh/.gemini/antigravity/brain/d6c236a0-8ff5-4d1f-9059-b4d7dfb1199b/screenshots');

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
  const adminRow = psql(
    "SELECT u.email, t.slug, t.id FROM users u JOIN user_tenants ut ON ut.user_id = u.id JOIN tenants t ON ut.tenant_id = t.id WHERE u.email LIKE 'qa-s08-admin%' AND u.status='ACTIVE' ORDER BY u.created_at DESC LIMIT 1;"
  );
  const [email] = adminRow.split('|');

  run('agent-browser --session insp close');
  run('agent-browser --session insp set viewport 1600 1000');
  
  // Login
  run(`agent-browser --session insp open "${FRONTEND}/login"`);
  await sleep(2500);

  const snap = run('agent-browser --session insp snapshot');
  const emailRefMatch = snap?.match(/textbox "Địa chỉ Email \*"[^\]]*ref=([a-z0-9]+)/i);
  const pwdRefMatch = snap?.match(/textbox "Mật khẩu \*"[^\]]*ref=([a-z0-9]+)/i);
  const btnRefMatch = snap?.match(/button "Đăng nhập"[^\]]*ref=([a-z0-9]+)/i);

  const emailRef = emailRefMatch ? `@${emailRefMatch[1]}` : 'input[type=email]';
  const pwdRef = pwdRefMatch ? `@${pwdRefMatch[1]}` : 'input[type=password]';
  const btnRef = btnRefMatch ? `@${btnRefMatch[1]}` : 'button[type=submit]';

  run(`agent-browser --session insp fill "${emailRef}" "${email}"`);
  await sleep(300);
  run(`agent-browser --session insp fill "${pwdRef}" "E2eForm!2026"`);
  await sleep(300);
  run(`agent-browser --session insp click "${btnRef}"`);
  await sleep(3500);

  // Open Form Studio
  run(`agent-browser --session insp open "${FRONTEND}/settings/apps/form"`);
  await sleep(4000);

  // Click "Mở"
  const clickOpen = `(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const r = rows.find(x => x.textContent.includes('grid-cascading') || x.textContent.includes('Phiếu Yêu Cầu'));
    if (r) {
      const openBtn = Array.from(r.querySelectorAll('button')).find(b => b.textContent.includes('Mở') || b.textContent.includes('Open'));
      if (openBtn) { openBtn.click(); return 'OPEN_CLICKED'; }
    }
    return 'NOT_FOUND';
  })()`;
  run(`agent-browser --session insp eval "${clickOpen.replace(/\n/g, ' ')}"`);
  await sleep(3500);

  // Click Grid card on canvas
  const clickGrid = `(() => {
    const cards = Array.from(document.querySelectorAll('[draggable=true]'));
    const gridCard = cards.find(c => c.textContent.includes('deployment_items') || c.textContent.includes('Bảng Thiết Bị'));
    if (gridCard) { gridCard.click(); return 'CLICKED'; }
    return 'NOT_FOUND';
  })()`;
  run(`agent-browser --session insp eval "${clickGrid.replace(/\n/g, ' ')}"`);
  await sleep(2000);

  // 1. Scroll into view: Grid Column 1 (Tỉnh / Thành - PROVINCE)
  const scrollCol1 = `(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const target = all.find(el => el.textContent && el.textContent.includes('#1') && el.textContent.includes('province'));
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
      return 'COL1_SCROLLED';
    }
    return 'TARGET_NOT_FOUND';
  })()`;
  const res1 = run(`agent-browser --session insp eval "${scrollCol1.replace(/\n/g, ' ')}"`);
  console.log('Scroll Col 1 result:', res1);
  await sleep(1500);

  const screen1Evidence = path.join(evidenceDir, 'grid_studio_inspector_col1_province.png');
  const screen1Artifact = path.join(artifactDir, 'grid_studio_inspector_col1_province.png');
  run(`agent-browser --session insp screenshot --full "${screen1Evidence}"`);
  fs.copyFileSync(screen1Evidence, screen1Artifact);
  console.log('Captured screen 1:', screen1Evidence);

  // 2. Scroll into view: Grid Column 2 (Quận / Huyện - DISTRICT with depends_on: province)
  const scrollCol2 = `(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const target = all.find(el => el.textContent && el.textContent.includes('#2') && el.textContent.includes('district'));
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
      return 'COL2_SCROLLED';
    }
    return 'TARGET_NOT_FOUND';
  })()`;
  const res2 = run(`agent-browser --session insp eval "${scrollCol2.replace(/\n/g, ' ')}"`);
  console.log('Scroll Col 2 result:', res2);
  await sleep(1500);

  // Click Test Fetch button on District column to demonstrate real-time catalog verification
  const clickTestFetch = `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const testBtn = btns.find(b => b.textContent.includes('Kiểm tra tải') || b.textContent.includes('Test Fetch') || b.textContent.includes('Fetch'));
    if (testBtn) { testBtn.click(); return 'FETCH_CLICKED'; }
    return 'NO_FETCH_BTN';
  })()`;
  run(`agent-browser --session insp eval "${clickTestFetch.replace(/\n/g, ' ')}"`);
  await sleep(2000);

  const screen2Evidence = path.join(evidenceDir, 'grid_studio_inspector_col2_district_cascading.png');
  const screen2Artifact = path.join(artifactDir, 'grid_studio_inspector_col2_district_cascading.png');
  run(`agent-browser --session insp screenshot --full "${screen2Evidence}"`);
  fs.copyFileSync(screen2Evidence, screen2Artifact);
  console.log('Captured screen 2:', screen2Evidence);

  // 3. Scroll into view: Grid Column 7 (Thành tiền - FORMULA qty * price & SUM summary)
  const scrollCol7 = `(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const target = all.find(el => el.textContent && el.textContent.includes('#7') && el.textContent.includes('subtotal'));
    if (target) {
      target.scrollIntoView({ behavior: 'instant', block: 'center' });
      return 'COL7_SCROLLED';
    }
    return 'TARGET_NOT_FOUND';
  })()`;
  const res7 = run(`agent-browser --session insp eval "${scrollCol7.replace(/\n/g, ' ')}"`);
  console.log('Scroll Col 7 result:', res7);
  await sleep(1500);

  const screen3Evidence = path.join(evidenceDir, 'grid_studio_inspector_col7_formula_summary.png');
  const screen3Artifact = path.join(artifactDir, 'grid_studio_inspector_col7_formula_summary.png');
  run(`agent-browser --session insp screenshot --full "${screen3Evidence}"`);
  fs.copyFileSync(screen3Evidence, screen3Artifact);
  console.log('Captured screen 3:', screen3Evidence);

  run('agent-browser --session insp close');
  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
