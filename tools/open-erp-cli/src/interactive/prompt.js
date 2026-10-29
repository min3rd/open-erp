import { createInterface } from 'node:readline/promises';

async function session() {
  return createInterface({ input: process.stdin, output: process.stdout });
}

export async function askText(question, fallback = null) {
  const rl = await session();
  try {
    const suffix = fallback === null || fallback === '' ? '' : ` [${fallback}]`;
    const answer = (await rl.question(`${question}${suffix}: `)).trim();
    return answer || fallback;
  } finally {
    rl.close();
  }
}

export async function askConfirm(question, fallback = true) {
  const suffix = fallback ? ' [Y/n]' : ' [y/N]';
  const answer = (await askText(`${question}${suffix}`, '')).toLowerCase();
  if (!answer) {
    return fallback;
  }
  return answer === 'y' || answer === 'yes' || answer === 'c' || answer === 'có';
}

export async function askSelect(question, options, fallbackIndex = 0) {
  console.log(`\n${question}`);
  options.forEach((option, index) => {
    const marker = index === fallbackIndex ? ' (default)' : '';
    console.log(`  ${index + 1}) ${option}${marker}`);
  });
  const answer = await askText('Chọn số', String(fallbackIndex + 1));
  const index = Number(answer) - 1;
  return options[index] ?? options[fallbackIndex];
}

export async function askMulti(question, options) {
  console.log(`\n${question}`);
  options.forEach((option, index) => console.log(`  ${index + 1}) ${option}`));
  const answer = await askText('Chọn số, cách nhau bằng dấu phẩy (Enter = tất cả)', '');
  if (!answer) {
    return [...options];
  }
  return answer
    .split(',')
    .map((value) => Number(value.trim()) - 1)
    .filter((index) => index >= 0 && index < options.length)
    .map((index) => options[index]);
}
