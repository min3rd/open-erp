import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readManifest, validateManifest } from '../lib/manifest.js';
import { writeFile } from '../lib/fsx.js';

export async function linkCommand(flags) {
  const repo = flags.repo;
  const id = flags.id;
  if (!repo || !id) {
    throw new Error('Usage: open-erp link --repo <git-url> --id <plugin-id>');
  }
  const root = resolve(flags.root || process.cwd());
  const target = `plugins/${id}`;
  const result = spawnSync('git', ['submodule', 'add', repo, target], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) {
    throw new Error('git submodule add failed');
  }
  console.log(`Linked ${repo} as submodule at ${target}`);
}

export async function inspectCommand(flags) {
  const dir = flags.dir || process.cwd();
  const manifest = readManifest(dir);
  const errors = validateManifest(manifest);
  console.log(`Plugin: ${manifest.id} (${manifest.name}) v${manifest.version}`);
  console.log(`Compatibility: ${manifest.core_version_compatibility}`);
  console.log(`Packaging: ${manifest.distribution?.type || 'unknown'}`);
  console.log(`Entities: ${(manifest.entities || []).map((entity) => entity.name).join(', ') || 'none'}`);
  console.log(`Permissions: ${(manifest.permissions || []).map((permission) => permission.code || permission).join(', ') || 'none'}`);
  console.log(`UI screens: ${((manifest.ui_manifest || {}).screens || []).length}, contributions: ${((manifest.ui_manifest || {}).contributions || []).length}`);
  console.log(errors.length === 0 ? 'Validation: OK' : `Validation: ${errors.length} error(s)`);
  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exitCode = 1;
  }
}

export async function devCommand(flags) {
  const dir = resolve(flags.dir || process.cwd());
  const manifest = readManifest(dir);
  const coreUrl = flags.coreUrl || 'http://localhost:8088';
  const compose = composeFile(manifest, coreUrl);
  writeFile(join(dir, 'docker-compose.dev.yml'), compose);
  console.log(`Wrote docker-compose.dev.yml for ${manifest.id}`);
  console.log(`Core dev URL: ${coreUrl}`);
  if (flags.run === true) {
    const result = spawnSync('docker', ['compose', '-f', 'docker-compose.dev.yml', 'up', '-d'], { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' });
    if (result.status !== 0) {
      throw new Error('docker compose up failed');
    }
    console.log('Local plugin runtime started (tenant dev context provided via env).');
  } else {
    console.log('Run: docker compose -f docker-compose.dev.yml up -d');
  }
}

function composeFile(manifest, coreUrl) {
  return `services:
  postgres-dev:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: openerp
      POSTGRES_PASSWORD: openerp_dev_password
      POSTGRES_DB: openerp_plugin_dev
    ports:
      - "5433:5432"
    deploy:
      resources:
        limits:
          memory: 384M
  plugin-${manifest.id}:
    build: .
    environment:
      DB_URL: jdbc:postgresql://postgres-dev:5432/openerp_plugin_dev
      DB_USER: openerp
      DB_PASSWORD: openerp_dev_password
      DB_SCHEMA: tenant_dev_${manifest.id.replaceAll('-', '_')}
      TENANT_ID: "00000000-0000-4000-a000-000000000001"
      PLUGIN_KEY: ${manifest.id}
      PLUGIN_VERSION: ${manifest.version}
      CORE_DEV_URL: ${coreUrl}
    ports:
      - "8081:8080"
    depends_on:
      - postgres-dev
    deploy:
      resources:
        limits:
          memory: 512M
`;
}
