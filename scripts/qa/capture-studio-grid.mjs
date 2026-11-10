// scripts/qa/capture-studio-grid.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const evidenceDir = path.resolve('docs/sprints/sprint_08_plugin_form_workflow/08_testing/evidence/s08_qa_real/screenshots');
const artifactDir = path.resolve('C:/Users/Minh/.gemini/antigravity/brain/d6c236a0-8ff5-4d1f-9059-b4d7dfb1199b/screenshots');

function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    if (out && out.trim()) console.log(out.trim());
    return out;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const session = 'studiosess';
  console.log('=== CAPTURING FORM STUDIO WITH EXCEL GRID ===');
  
  run(`agent-browser --session ${session} close`);
  run(`agent-browser --session ${session} set viewport 1440 900`);
  run(`agent-browser --session ${session} open "http://localhost:4200/login"`);
  await sleep(3000);

  // Fill login
  console.log('Logging in...');
  const snapLogin = run(`agent-browser --session ${session} snapshot -i`);
  const linesLogin = snapLogin.split('\n');
  const emailInput = linesLogin.find((l) => l.includes('textbox') && (l.includes('Email') || l.includes('ten@congty')));
  const passInput = linesLogin.find((l) => l.includes('textbox') || l.includes('password') || l.includes('Mật khẩu'));
  const loginBtn = linesLogin.find((l) => l.includes('button') && (l.includes('Đăng nhập') || l.includes('Login')));

  const parseRef = (line) => {
    const m = line?.match(/\[ref=(e\d+)\]/);
    return m ? `@${m[1]}` : null;
  };

  const emailRef = parseRef(emailInput);
  const loginBtnRef = parseRef(loginBtn);

  if (emailRef) run(`agent-browser --session ${session} fill "${emailRef}" "qa-s08-admin-mwac4v5u@example.com"`);
  run(`agent-browser --session ${session} fill "input[type='password']" "E2eForm!2026"`);
  await sleep(300);
  if (loginBtnRef) {
    run(`agent-browser --session ${session} click "${loginBtnRef}"`);
    await sleep(4000);
  }

  // Navigate to Form Builder
  console.log('Navigating to /app/form...');
  run(`agent-browser --session ${session} open "http://localhost:4200/app/form"`);
  await sleep(4000);

  // Find quotation form row and click it
  console.log('Selecting quotation form...');
  run(`agent-browser --session ${session} eval "
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const r = rows.find(x => x.textContent.includes('Báo Giá') || x.textContent.includes('Excel Grid') || x.textContent.includes('quotation-excel-grid-v1'));
    if (r) r.click();
  "`);
  await sleep(3000);

  // Click on the Grid Item on Canvas to select it in the Inspector
  console.log('Selecting grid item on canvas...');
  run(`agent-browser --session ${session} eval "
    const items = Array.from(document.querySelectorAll('[data-ref], div'));
    const target = items.find(el => el.textContent.includes('Bảng Chi Tiết') || el.textContent.includes('order_items'));
    if (target) target.click();
  "`);
  await sleep(2000);

  // Screenshot 1: Form Studio Designer & Inspector with Excel Grid
  const screen1_evidence = path.join(evidenceDir, 'excel_grid_01_builder_inspector.png');
  const screen1_artifact = path.join(artifactDir, 'excel_grid_01_builder_inspector.png');
  run(`agent-browser --session ${session} screenshot --full "${screen1_evidence}"`);
  fs.copyFileSync(screen1_evidence, screen1_artifact);
  console.log('Captured screenshot 1:', screen1_evidence);

  // Switch to Responses / Preview tab
  console.log('Opening Responses / Details...');
  run(`agent-browser --session ${session} eval "
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const respTab = tabs.find(x => x.textContent.includes('Phản hồi') || x.textContent.includes('Responses'));
    if (respTab) respTab.click();
  "`);
  await sleep(2500);

  // Screenshot 5: Response list / details
  const screen5_evidence = path.join(evidenceDir, 'excel_grid_05_response_details.png');
  const screen5_artifact = path.join(artifactDir, 'excel_grid_05_response_details.png');
  run(`agent-browser --session ${session} screenshot --full "${screen5_evidence}"`);
  fs.copyFileSync(screen5_evidence, screen5_artifact);
  console.log('Captured screenshot 5:', screen5_evidence);

  run(`agent-browser --session ${session} close`);
  console.log('Done capturing studio screens.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

