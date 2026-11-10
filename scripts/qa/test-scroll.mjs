// scripts/qa/test-scroll.mjs
import { execSync } from 'node:child_process';
const run = c => execSync(c, { encoding: 'utf8', stdio: 'pipe' }).trim();

const code = `(() => {
  const elements = Array.from(document.querySelectorAll('*')).filter(el => {
    return el.scrollHeight > el.clientHeight && el.clientHeight > 100;
  });
  return elements.map(el => ({
    tag: el.tagName,
    cls: el.className,
    scrollHeight: el.scrollHeight,
    clientHeight: el.clientHeight,
    scrollTop: el.scrollTop
  }));
})()`;

console.log(run(`agent-browser --session insp eval "${code.replace(/\n/g, ' ')}"`));

