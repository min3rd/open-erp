// scripts/qa/debug-grid-select.mjs
import { execSync } from 'node:child_process';

function run(cmd) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    return out ? out.trim() : '';
  } catch (err) {
    return 'ERR: ' + err.message;
  }
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function test() {
  const url = 'http://localhost:8088/public/forms/qa-s08-mwac4v5u/grid-cascading-equipment-request-v1';
  run('agent-browser --session dbg close');
  run('agent-browser --session dbg set viewport 1440 900');
  run(`agent-browser --session dbg open "${url}"`);
  await sleep(4000);

  const check = `(() => {
    const table = document.querySelector('table');
    const r2 = table.querySelectorAll('tbody tr')[1];
    const r2Dist = r2.querySelectorAll('select')[1];
    return {
      hasDisabledAttr: r2Dist.hasAttribute('disabled'),
      propDisabled: r2Dist.disabled,
      outerHTML: r2Dist.outerHTML.slice(0, 150)
    };
  })()`;
  const res = run(`agent-browser --session dbg eval "${check.replace(/\n/g, ' ')}"`);
  console.log('Disabled check:', res);

  run('agent-browser --session dbg close');
}

test();
