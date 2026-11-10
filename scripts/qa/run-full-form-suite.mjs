// scripts/qa/run-full-form-suite.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    if (out.trim()) console.log(out.trim());
    return out;
  } catch (err) {
    console.error(`Error: ${err.message}`);
    return null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evidenceDir = path.resolve('docs/sprints/sprint_08_plugin_form_workflow/08_testing/evidence/s08_qa_real/screenshots');
fs.mkdirSync(evidenceDir, { recursive: true });

async function main() {
  console.log('=== STARTING COMPREHENSIVE PUBLIC FORM QA WALKTHROUGH ===');

  const url = 'http://localhost:8088/public/forms/qa-s08-mwac4v5u/candidate-evaluation-master';

  // 1. Initial Blank Form State
  console.log('\n--- 1. Initial State (Desktop 1440x900) ---');
  run('agent-browser --session s1 close');
  run('agent-browser --session s1 set viewport 1440 900');
  run(`agent-browser --session s1 open "${url}"`);
  await sleep(4000);
  run(`agent-browser --session s1 screenshot --full "${path.join(evidenceDir, 'public_form_01_comprehensive_full_page.png')}"`);

  // 2. Validation Error State (Negative Test)
  console.log('\n--- 2. Validation Error State (Negative Test) ---');
  run('agent-browser --session s2 close');
  run('agent-browser --session s2 set viewport 1440 900');
  run(`agent-browser --session s2 open "${url}"`);
  await sleep(4000);
  run('agent-browser --session s2 click "button[type=\\"submit\\"]"');
  await sleep(1500);
  run(`agent-browser --session s2 screenshot --full "${path.join(evidenceDir, 'public_form_02_validation_errors.png')}"`);
  run('agent-browser --session s2 close');

  // 3. Positive User Flow: Clean Filling of All 10 Field Types
  console.log('\n--- 3. Clean Filling of All 10 Field Types ---');
  run('agent-browser --session s3 close');
  run('agent-browser --session s3 set viewport 1440 900');
  run(`agent-browser --session s3 open "${url}"`);
  await sleep(4000);

  // Short text
  run('agent-browser --session s3 fill "#input-full_name" "Nguyen Van An"');
  await sleep(200);

  // Email
  run('agent-browser --session s3 fill "#input-contact_email" "nguyenvanan@openerp.9ms.io.vn"');
  await sleep(200);

  // Number
  run('agent-browser --session s3 fill "#input-years_experience" "6"');
  await sleep(200);

  // Radio (Single Choice)
  run('agent-browser --session s3 click "input[value=\\"HYBRID\\"]"');
  await sleep(200);

  // Dropdown (Select)
  run('agent-browser --session s3 select "#input-target_department" "ARCHITECT"');
  await sleep(200);

  // Checkboxes (Multi Choice)
  run('agent-browser --session s3 click "#fill-tech_skills label:nth-child(1) input"');
  run('agent-browser --session s3 click "#fill-tech_skills label:nth-child(2) input"');
  run('agent-browser --session s3 click "#fill-tech_skills label:nth-child(3) input"');
  await sleep(200);

  // Long text
  run('agent-browser --session s3 fill "#input-key_projects" "Kien truc su Giai phap ERP cap cao: Thiet ke he thong Cloud-Native tren Quarkus va Angular 22, bao dam phan lap du lieu Multi-tenant tren PostgreSQL."');
  await sleep(200);

  // Rating: 5 stars
  run('agent-browser --session s3 click "button[aria-label=\\"5\\"]"');
  await sleep(200);

  // Matrix: Select column 4 (Xuất sắc) for all 4 rows
  run('agent-browser --session s3 click "tbody tr:nth-child(1) td:nth-child(5) input"');
  run('agent-browser --session s3 click "tbody tr:nth-child(2) td:nth-child(5) input"');
  run('agent-browser --session s3 click "tbody tr:nth-child(3) td:nth-child(4) input"');
  run('agent-browser --session s3 click "tbody tr:nth-child(4) td:nth-child(5) input"');
  await sleep(200);

  // Responder email
  run('agent-browser --session s3 fill "input[name=\\"responder_email\\"]" "nguyenvanan@openerp.9ms.io.vn"');
  await sleep(1500);

  // Capture pristine fully filled screenshot
  run(`agent-browser --session s3 screenshot --full "${path.join(evidenceDir, 'public_form_03_comprehensive_fully_filled.png')}"`);

  // 4. Submit & Verify Reference Screen
  console.log('\n--- 4. Submitting & Capturing Success Screen ---');
  run('agent-browser --session s3 click "button[type=\\"submit\\"]"');
  await sleep(4000);
  run(`agent-browser --session s3 screenshot "${path.join(evidenceDir, 'public_form_04_submission_success.png')}"`);
  run('agent-browser --session s3 close');

  // 5. Mobile Responsive Test (390x844)
  console.log('\n--- 5. Mobile Responsive Test (390x844) ---');
  run('agent-browser --session mob close');
  run('agent-browser --session mob set viewport 390 844');
  run(`agent-browser --session mob open "${url}"`);
  await sleep(3500);
  run(`agent-browser --session mob screenshot --full "${path.join(evidenceDir, 'public_form_05_mobile_390x844_full.png')}"`);
  run('agent-browser --session mob close');

  console.log('\n=== ALL COMPREHENSIVE TESTS FINISHED SUCCESSFULLY ===');
}

main().catch(console.error);
