import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readManifest, writeManifest } from '../lib/manifest.js';
import { projectFiles } from '../lib/templates.js';
import { writeFile } from '../lib/fsx.js';

const TEMPLATE_VERSION = '2.0.0';
const REQUIRED = [
  'plugin.json',
  'pom.xml',
  'src/main/resources/application.properties',
  'deploy/Dockerfile',
  '.gitignore',
];

export async function upgradeCommand(flags) {
  const dir = resolve(flags.dir || process.cwd());
  const manifest = readManifest(dir);
  const findings = inspect(dir, manifest);
  if (!flags.apply) {
    for (const item of findings) {
      console.log(`  ${item.status} ${item.file}${item.message ? `: ${item.message}` : ''}`);
    }
    if (findings.some((item) => item.status !== 'OK')) {
      console.log('upgrade --check found template work (use --apply to update the manifest/backup).');
      if (flags.check) {
        process.exitCode = 1;
      }
    } else {
      console.log(`Template ${TEMPLATE_VERSION} is up to date.`);
    }
    return;
  }

  const backup = join(dir, '.open-erp', `upgrade-${timestamp()}`);
  mkdirSync(backup, { recursive: true });
  cpSync(join(dir, 'plugin.json'), join(backup, 'plugin.json'));
  for (const item of findings) {
    if (item.status === 'MISSING') {
      continue;
    }
    const source = join(dir, item.file);
    if (existsSync(source)) {
      const target = join(backup, item.file);
      mkdirSync(join(target, '..'), { recursive: true });
      cpSync(source, target);
    }
  }
  manifest.schema_version = '2.0';
  manifest.template_version = TEMPLATE_VERSION;
  writeManifest(dir, manifest);
  const missing = findings.filter((entry) => entry.status === 'MISSING').map((entry) => entry.file);
  const template = projectFiles({
    id: manifest.id,
    name: manifest.name || manifest.id,
    description: manifest.description || manifest.name || manifest.id,
    packaging: manifest.packaging || 'image',
    platforms: Object.keys(manifest.platforms || {}).join(',') || 'desktop',
    withWeb: existsSync(join(dir, 'web')),
  });
  for (const file of missing) {
    if (template[file]) {
      writeFile(join(dir, file), template[file]);
      console.log(`  WROTE ${file} (from template 2.0)`);
    }
  }
  console.log(`Backup: ${backup}`);
  console.log(`Updated plugin.json template_version=${TEMPLATE_VERSION}; existing files were not overwritten.`);
  if (!flags.yes && process.stdin.isTTY) {
    console.log('Tip: pass --yes in automation.');
  }
}

function inspect(dir, manifest) {
  const findings = [];
  if (manifest.schema_version !== '2.0') {
    findings.push({ file: 'plugin.json', status: 'OUTDATED', message: 'schema_version must be 2.0' });
  }
  if (!manifest.template_version) {
    findings.push({ file: 'plugin.json', status: 'OUTDATED', message: 'template_version is missing' });
  } else if (manifest.template_version !== TEMPLATE_VERSION) {
    findings.push({
      file: 'plugin.json',
      status: 'OUTDATED',
      message: `template_version ${manifest.template_version} -> ${TEMPLATE_VERSION}`,
    });
  }
  for (const file of REQUIRED) {
    if (!existsSync(join(dir, file))) {
      findings.push({ file, status: 'MISSING' });
    }
  }
  const pom = join(dir, 'pom.xml');
  if (existsSync(pom)) {
    const text = readFileSync(pom, 'utf8');
    for (const forbidden of ['hibernate-orm-panache', 'quarkus-jdbc-postgresql', 'quarkus-flyway', 'quarkus.datasource']) {
      if (text.includes(forbidden)) {
        findings.push({ file: 'pom.xml', status: 'CUSTOMIZED', message: `${forbidden} must be removed (zero-DB template)` });
      }
    }
  }
  return findings;
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}
