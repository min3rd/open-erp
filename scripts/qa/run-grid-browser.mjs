// scripts/qa/run-grid-browser.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    if (out && out.trim()) console.log(out.trim());
    return out;
  } catch (err) {
    console.error(`Command error: ${err.message}`);
    if (err.stdout) console.log('stdout:', err.stdout);
    if (err.stderr) console.log('stderr:', err.stderr);
    return null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evidenceDir = path.resolve('docs/sprints/sprint_08_plugin_form_workflow/08_testing/evidence/s08_qa_real/screenshots');
const artifactDir = path.resolve('C:/Users/Minh/.gemini/antigravity/brain/d6c236a0-8ff5-4d1f-9059-b4d7dfb1199b/screenshots');

function psql(query) {
  const flat = query.replace(/\s+/g, ' ').trim();
  return execSync(
    `docker exec openerp-postgres-primary psql -U openerp -d openerp_dev -tAc "${flat.replace(/"/g, '\\"')}"`,
    { encoding: 'utf8' },
  ).trim();
}

async function main() {
  const session = 'excelsess';
  const url = 'http://localhost:8088/public/forms/qa-s08-mwac4v5u/quotation-excel-grid-v1';

  console.log('=== OPENING BROWSER FOR EXCEL GRID ===');
  run(`agent-browser --session ${session} close`);
  run(`agent-browser --session ${session} set viewport 1440 900`);
  run(`agent-browser --session ${session} open "${url}"`);
  await sleep(4000);

  // Take snapshot to inspect refs
  console.log('Taking snapshot...');
  const snap1 = run(`agent-browser --session ${session} snapshot -i`);
  
  // Find refs from snapshot
  const parseRef = (text, pattern) => {
    const match = text.match(pattern);
    return match ? `@${match[1]}` : null;
  };

  const refCust = parseRef(snap1, /textbox "Tên Doanh nghiệp \/ Khách hàng \*" \[ref=(e\d+)\]/);
  const refDateYear = parseRef(snap1, /spinbutton "Year Year" \[ref=(e\d+)\]/);
  const refDateMonth = parseRef(snap1, /spinbutton "Month Month" \[ref=(e\d+)\]/);
  const refDateDay = parseRef(snap1, /spinbutton "Day Day" \[ref=(e\d+)\]/);

  console.log('Customer input ref:', refCust);

  // Fill customer name
  if (refCust) {
    run(`agent-browser --session ${session} fill "${refCust}" "Tập đoàn Viễn thông FPT"`);
    await sleep(300);
  }
  // Fill date via spinbuttons if present, or eval input
  if (refDateYear && refDateMonth && refDateDay) {
    run(`agent-browser --session ${session} fill "${refDateYear}" "2026"`);
    run(`agent-browser --session ${session} fill "${refDateMonth}" "11"`);
    run(`agent-browser --session ${session} fill "${refDateDay}" "15"`);
  }

  // Parse Row 1 refs
  // Let's re-snapshot to get fresh refs
  const snap2 = run(`agent-browser --session ${session} snapshot -i`);
  console.log('Snapshot 2 length:', snap2?.length);

  // Parse Row 1 and Row 2 inputs
  const lines = snap2.split('\n');
  const findRefNear = (keyword) => {
    const line = lines.find((l) => l.includes(keyword));
    return line ? parseRef(line, /\[ref=(e\d+)\]/) : null;
  };

  // Find textboxes with placeholder "Nhập tên thiết bị"
  const itemInputs = lines
    .filter((l) => l.includes('textbox "Nhập tên thiết bị hoặc phần mềm"'))
    .map((l) => parseRef(l, /\[ref=(e\d+)\]/));
  console.log('Item inputs:', itemInputs);

  const selectInputs = lines
    .filter((l) => l.includes('combobox'))
    .map((l) => parseRef(l, /\[ref=(e\d+)\]/));
  console.log('Select inputs:', selectInputs);

  const numInputs = lines
    .filter((l) => l.includes('spinbutton "0"'))
    .map((l) => parseRef(l, /\[ref=(e\d+)\]/));
  console.log('Number inputs:', numInputs);

  const addRowBtn = findRefNear('+ Add Row') || findRefNear('Thêm dòng');
  console.log('Add row button ref:', addRowBtn);

  // Fill Row 1
  if (itemInputs[0]) run(`agent-browser --session ${session} fill "${itemInputs[0]}" "Dell PowerEdge R760 Server"`);
  await sleep(200);
  if (selectInputs[0]) run(`agent-browser --session ${session} select "${selectInputs[0]}" "Phần cứng"`);
  await sleep(200);
  if (numInputs[0]) run(`agent-browser --session ${session} fill "${numInputs[0]}" "3"`);
  await sleep(200);
  if (numInputs[1]) run(`agent-browser --session ${session} fill "${numInputs[1]}" "150000000"`);
  await sleep(400);

  // Fill Row 2
  if (itemInputs[1]) run(`agent-browser --session ${session} fill "${itemInputs[1]}" "Oracle Database Enterprise License"`);
  await sleep(200);
  if (selectInputs[1]) run(`agent-browser --session ${session} select "${selectInputs[1]}" "Phần mềm"`);
  await sleep(200);
  if (numInputs[2]) run(`agent-browser --session ${session} fill "${numInputs[2]}" "2"`);
  await sleep(200);
  if (numInputs[3]) run(`agent-browser --session ${session} fill "${numInputs[3]}" "200000000"`);
  await sleep(400);

  // Click "+ Add Row"
  if (addRowBtn) {
    console.log('Clicking Add Row...');
    run(`agent-browser --session ${session} click "${addRowBtn}"`);
    await sleep(1000);
  }

  // Get Row 3 refs from new snapshot
  const snap3 = run(`agent-browser --session ${session} snapshot -i`);
  const lines3 = snap3.split('\n');
  const allTextInputs = lines3
    .filter((l) => l.includes('textbox "Nhập tên thiết bị hoặc phần mềm"'))
    .map((l) => parseRef(l, /\[ref=(e\d+)\]/));
  const allSelectInputs = lines3
    .filter((l) => l.includes('combobox'))
    .map((l) => parseRef(l, /\[ref=(e\d+)\]/));
  const allNumInputs = lines3
    .filter((l) => l.includes('spinbutton "0"'))
    .map((l) => parseRef(l, /\[ref=(e\d+)\]/));

  const row3Name = allTextInputs[allTextInputs.length - 1];
  const row3Select = allSelectInputs[allSelectInputs.length - 1];
  const row3Qty = allNumInputs[allNumInputs.length - 2];
  const row3Price = allNumInputs[allNumInputs.length - 1];

  console.log('Row 3 inputs:', { row3Name, row3Select, row3Qty, row3Price });

  if (row3Name) run(`agent-browser --session ${session} fill "${row3Name}" "Dịch vụ Triển khai On-site"`);
  await sleep(200);
  if (row3Select) run(`agent-browser --session ${session} select "${row3Select}" "Dịch vụ CNTT"`);
  await sleep(200);
  if (row3Qty) run(`agent-browser --session ${session} fill "${row3Qty}" "1"`);
  await sleep(200);
  if (row3Price) run(`agent-browser --session ${session} fill "${row3Price}" "50000000"`);
  await sleep(800);

  // Take fresh snapshot to verify calculations
  const snapFinal = run(`agent-browser --session ${session} snapshot -i`);
  console.log('Final Snapshot Summary Lines:');
  snapFinal.split('\n').filter((l) => l.includes('cell') || l.includes('SUM:')).forEach((l) => console.log('  ', l));

  // Screenshot 3: Calculated Excel Grid
  const screen3_evidence = path.join(evidenceDir, 'excel_grid_03_public_fill_calculated.png');
  const screen3_artifact = path.join(artifactDir, 'excel_grid_03_public_fill_calculated.png');
  run(`agent-browser --session ${session} screenshot --full "${screen3_evidence}"`);
  fs.copyFileSync(screen3_evidence, screen3_artifact);
  console.log('Captured screenshot 3');

  // Submit form
  const submitBtn = lines3.find((l) => l.includes('button "Submit"'));
  const submitRef = submitBtn ? parseRef(submitBtn, /\[ref=(e\d+)\]/) : null;
  console.log('Submit button ref:', submitRef);
  if (submitRef) {
    run(`agent-browser --session ${session} click "${submitRef}"`);
    await sleep(3500);
  }

  // Screenshot 4: Success state
  const screen4_evidence = path.join(evidenceDir, 'excel_grid_04_submitted_success.png');
  const screen4_artifact = path.join(artifactDir, 'excel_grid_04_submitted_success.png');
  run(`agent-browser --session ${session} screenshot --full "${screen4_evidence}"`);
  fs.copyFileSync(screen4_evidence, screen4_artifact);
  console.log('Captured screenshot 4');

  run(`agent-browser --session ${session} close`);

  // Verify in PostgreSQL
  console.log('\n--- Checking Saved Answers in PostgreSQL ---');
  const savedRow = psql(
    `SELECT answers FROM tenant_d0bbcb6d_form.plg_form_responses r JOIN tenant_d0bbcb6d_form.plg_form_definitions d ON r.form_id = d.id WHERE d.slug = 'quotation-excel-grid-v1' ORDER BY r.submitted_at DESC LIMIT 1;`
  );
  console.log('Saved answers:');
  console.log(savedRow);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
