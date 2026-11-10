// scripts/qa/capture-grid-studio-inspector.mjs
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
  console.log('=== CAPTURE FORM STUDIO GRID INSPECTOR EVIDENCE ===');

  const adminRow = psql(
    "SELECT u.email, t.slug, t.id FROM users u JOIN user_tenants ut ON ut.user_id = u.id JOIN tenants t ON ut.tenant_id = t.id WHERE u.email LIKE 'qa-s08-admin%' AND u.status='ACTIVE' ORDER BY u.created_at DESC LIMIT 1;"
  );
  const [email] = adminRow.split('|');

  run('agent-browser --session studio close');
  run('agent-browser --session studio set viewport 1600 1000');
  
  // 1. Open login page
  console.log('Opening login page...');
  run(`agent-browser --session studio open "${FRONTEND}/login"`);
  await sleep(2500);

  // 2. Snapshot to get refs
  const snap = run('agent-browser --session studio snapshot');
  const emailRefMatch = snap?.match(/textbox "Địa chỉ Email \*"[^\]]*ref=([a-z0-9]+)/i);
  const pwdRefMatch = snap?.match(/textbox "Mật khẩu \*"[^\]]*ref=([a-z0-9]+)/i);
  const btnRefMatch = snap?.match(/button "Đăng nhập"[^\]]*ref=([a-z0-9]+)/i);

  const emailRef = emailRefMatch ? `@${emailRefMatch[1]}` : 'input[type=email]';
  const pwdRef = pwdRefMatch ? `@${pwdRefMatch[1]}` : 'input[type=password]';
  const btnRef = btnRefMatch ? `@${btnRefMatch[1]}` : 'button[type=submit]';

  run(`agent-browser --session studio fill "${emailRef}" "${email}"`);
  await sleep(300);
  run(`agent-browser --session studio fill "${pwdRef}" "E2eForm!2026"`);
  await sleep(300);
  run(`agent-browser --session studio click "${btnRef}"`);
  console.log('Logging in...');
  await sleep(4000);

  // 3. Navigate to Form Studio
  console.log('Navigating to Form Studio...');
  run(`agent-browser --session studio open "${FRONTEND}/settings/apps/form"`);
  await sleep(4000);

  // 4. Click "Mở" (Open) button on the first row
  console.log('Clicking "Mở" (Open) button on form row...');
  const clickOpen = `(() => {
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const r = rows.find(x => x.textContent.includes('grid-cascading') || x.textContent.includes('Địa Điểm Lắp Đặt') || x.textContent.includes('Phiếu Yêu Cầu'));
    if (r) {
      const openBtn = Array.from(r.querySelectorAll('button')).find(b => b.textContent.includes('Mở') || b.textContent.includes('Open'));
      if (openBtn) { openBtn.click(); return 'OPEN_CLICKED'; }
    }
    return 'NOT_FOUND';
  })()`;
  const openRes = run(`agent-browser --session studio eval "${clickOpen.replace(/\n/g, ' ')}"`);
  console.log('Open click result:', openRes);
  await sleep(4000);

  // 5. Click on Grid card on canvas to select it in the Inspector
  console.log('Clicking on Grid card on canvas...');
  const clickGrid = `(() => {
    const cards = Array.from(document.querySelectorAll('[draggable=true]'));
    const gridCard = cards.find(c => c.textContent.includes('deployment_items') || c.textContent.includes('Bảng Thiết Bị') || c.textContent.includes('GRID'));
    if (gridCard) {
      gridCard.click();
      return 'GRID_CARD_CLICKED';
    }
    return 'GRID_CARD_NOT_FOUND';
  })()`;
  const gridRes = run(`agent-browser --session studio eval "${clickGrid.replace(/\n/g, ' ')}"`);
  console.log('Grid click result:', gridRes);
  await sleep(2500);

  // 6. Scroll inspector to show Column 2 (Quận / Huyện with depends_on: province and Test Fetch)
  console.log('Scrolling Inspector to show District cascading configuration...');
  const scrollInsp = `(() => {
    const inspector = document.querySelector('section.min-h-0.overflow-y-auto');
    if (inspector) {
      inspector.scrollTop = 700;
      return 'SCROLLED';
    }
    return 'NO_INSPECTOR';
  })()`;
  run(`agent-browser --session studio eval "${scrollInsp.replace(/\n/g, ' ')}"`);
  await sleep(1000);

  // Click Test Fetch button on column 2 to show live fetch status
  console.log('Clicking Test Fetch button on District column...');
  const clickTestFetch = `(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const testBtn = btns.find(b => b.textContent.includes('Kiểm tra tải') || b.textContent.includes('Test Fetch') || b.textContent.includes('Fetch'));
    if (testBtn) { testBtn.click(); return 'FETCH_CLICKED'; }
    return 'NO_FETCH_BTN';
  })()`;
  const fetchRes = run(`agent-browser --session studio eval "${clickTestFetch.replace(/\n/g, ' ')}"`);
  console.log('Fetch result:', fetchRes);
  await sleep(2000);

  const screenEvidence = path.join(evidenceDir, 'grid_studio_inspector_cascading_select.png');
  const screenArtifact = path.join(artifactDir, 'grid_studio_inspector_cascading_select.png');
  run(`agent-browser --session studio screenshot --full "${screenEvidence}"`);
  fs.copyFileSync(screenEvidence, screenArtifact);
  console.log('Captured Studio Inspector Evidence:', screenEvidence);

  run('agent-browser --session studio close');
  console.log('=== STUDIO EVIDENCE CAPTURE COMPLETED ===');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
