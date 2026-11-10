// scripts/qa/test-ui-login.mjs
import { execSync } from 'node:child_process';

function run(cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    if (out && out.trim()) console.log(out.trim());
    return out ? out.trim() : '';
  } catch (err) {
    console.error('ERR:', err.message);
    return '';
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  run('agent-browser --session uilog close');
  run('agent-browser --session uilog set viewport 1560 960');
  run('agent-browser --session uilog open "http://localhost:4200/login"');
  await sleep(3000);

  // Snapshot to see selectors
  const snap = run('agent-browser --session uilog snapshot');
  console.log('Snapshot:\n', snap);

  run('agent-browser --session uilog close');
}

main();

