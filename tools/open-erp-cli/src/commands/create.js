import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { writeFile } from '../lib/fsx.js';
import { projectFiles } from '../lib/templates.js';
import { PLUGIN_KEY_PATTERN, RESERVED_KEYS, validateManifest } from '../lib/manifest.js';

export async function createCommand(flags) {
  const interactive = !flags.nonInteractive && process.stdin.isTTY;
  const options = {
    id: flags.id || (interactive ? await ask('Plugin ID (kebab-case)') : null),
    name: flags.name || (interactive ? await ask('Display name') : null),
    description: flags.description || (interactive ? await ask('Short description', '') : ''),
    packaging: flags.packaging || 'image',
    db: flags.db || 'postgres',
    withWeb: flags.withWeb !== false,
    platforms: flags.platforms || 'desktop',
    coreVersion: flags.coreVersion || '>=1.0.0 <2.0.0',
    target: flags.target || null,
    packageOverride: flags.package || null,
  };
  if (!options.id || !PLUGIN_KEY_PATTERN.test(options.id) || RESERVED_KEYS.has(options.id)) {
    throw new Error('A valid, non-reserved --id is required (lowercase kebab-case, 3-50 chars)');
  }
  if (!options.name) {
    throw new Error('--name is required in non-interactive mode');
  }
  if (!['image', 'bundle'].includes(options.packaging)) {
    throw new Error('--packaging must be "image" or "bundle"');
  }
  if (!['postgres', 'mongodb'].includes(options.db)) {
    throw new Error('--db must be "postgres" or "mongodb"');
  }
  const target = resolve(options.target || options.id);
  if (existsSync(target) && !flags.force) {
    throw new Error(`target already exists: ${target} (use --force to overwrite)`);
  }
  const files = projectFiles(options);
  const manifestPath = join(target, 'plugin.json');
  const manifest = JSON.parse(files['plugin.json']);
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`generated manifest is invalid: ${errors.join('; ')}`);
  }
  if (flags.dryRun) {
    console.log(`Dry run: ${Object.keys(files).length} files would be written to ${target}`);
    for (const path of Object.keys(files)) {
      console.log(`  ${path}`);
    }
    return;
  }
  for (const [path, content] of Object.entries(files)) {
    writeFile(join(target, path), content);
  }
  if (flags.gitInit !== false) {
    gitInit(target);
  }
  console.log(`Created plugin "${options.id}" at ${target}`);
  console.log(`Manifest: ${manifestPath}`);
  console.log('Next steps:');
  console.log('  1. npx @open-erp/cli validate');
  console.log('  2. npx @open-erp/cli generate entity --name Invoice');
  console.log('  3. npx @open-erp/cli dev');
  console.log('  4. npx @open-erp/cli package --with-web');
}

async function ask(question, fallback = null) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const suffix = fallback ? ` [${fallback}]` : '';
    const answer = (await rl.question(`${question}${suffix}: `)).trim();
    return answer || fallback;
  } finally {
    rl.close();
  }
}

function gitInit(target) {
  try {
    execFileSync('git', ['init', '-q'], { cwd: target, stdio: 'ignore' });
    execFileSync('git', ['add', '.'], { cwd: target, stdio: 'ignore' });
    execFileSync('git', ['commit', '-q', '-m', 'chore: scaffold plugin with @open-erp/cli'], { cwd: target, stdio: 'ignore' });
    console.log(`Initialized git repository (${basename(target)})`);
  } catch {
    console.log('git init skipped (git not available or identity not configured)');
  }
}
