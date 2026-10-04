import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readManifest } from '../lib/manifest.js';
import { sha256File } from '../lib/checksum.js';
import { listFiles, writeFile } from '../lib/fsx.js';
import { createZip } from '../lib/zip.js';

export async function packageCommand(flags) {
  const dir = resolve(flags.dir || process.cwd());
  const manifest = readManifest(dir);
  const dist = join(dir, flags.out || 'dist');
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  if (flags.skipBuild !== true && flags.skipBuild !== 'true') {
    runOptional('mvn', ['-q', '-DskipTests', '-Dquarkus.package.type=uber-jar', 'package'], dir, 'maven build');
  }
  const artifacts = [];
  const backendJar = findRunnableJar(dir);
  if (backendJar) {
    const target = join(dist, 'plugin-backend.jar');
    cpSync(backendJar, target);
    artifacts.push(target);
  } else {
    console.warn('runnable backend jar not found (target/*-runner.jar) — packaging manifest only');
  }
  let webDist = null;
  if (flags.withWeb === true || flags.withWeb === 'true') {
    const webDir = join(dir, 'web');
    if (existsSync(join(webDir, 'package.json')) && flags.skipBuild !== true && flags.skipBuild !== 'true') {
      if (!existsSync(join(webDir, 'node_modules'))) {
        runOptional('npm', ['install', '--no-audit', '--no-fund'], webDir, 'web install');
      }
      runOptional('npm', ['run', 'build'], webDir, 'web build');
    }
    webDist = findWebDist(webDir);
    if (webDist) {
      const target = join(dist, 'web');
      cpSync(webDist, target, { recursive: true });
      artifacts.push(target);
    } else {
      console.warn('web build output not found (web/dist/browser) — skipping web bundle');
    }
  }
  if (backendJar) {
    const bundle = join(dist, 'bundle.zip');
    writeFileSync(bundle, createBundle(backendJar, webDist));
    artifacts.push(bundle);
  }
  const checksumLines = [];
  for (const artifact of artifacts) {
    if (statSync(artifact).isDirectory()) {
      for (const file of listFiles(artifact)) {
        const full = join(artifact, file);
        checksumLines.push(`${await sha256File(full)}  ${relative(dist, full).replaceAll('\\', '/')}`);
      }
    } else {
      checksumLines.push(`${await sha256File(artifact)}  ${relative(dist, artifact).replaceAll('\\', '/')}`);
    }
  }
  writeFile(join(dist, 'checksums.txt'), `${checksumLines.join('\n')}\n`);
  const releaseManifest = {
    plugin_key: manifest.id,
    version: manifest.version,
    distribution: manifest.distribution || null,
    migration_policy: manifest.migration_policy || 'COMPATIBLE',
    rollback_strategy: manifest.rollback_strategy || 'SNAPSHOT_RESTORE',
    artifacts: checksumLines.map((line) => {
      const [checksum, file] = line.split('  ');
      return { file, sha256: checksum };
    }),
    generated_at: new Date().toISOString(),
  };
  writeFile(join(dist, 'release-manifest.json'), `${JSON.stringify(releaseManifest, null, 2)}\n`);
  console.log(`Packaged ${manifest.id}@${manifest.version} → ${dist}`);
  for (const line of checksumLines) {
    console.log(`  ${line}`);
  }
  console.log('Register the artifact with the Plugin Manager (Docker/registry or JAR bundle upload).');
}

/**
 * BUG-112: package must ship a self-contained runnable jar. The Quarkus
 * fast-jar `quarkus-run.jar` is a thin bootstrap (needs sibling lib/app dirs)
 * and the platform ImageBuilder only copies `app.jar` + `static`, so the
 * runnable artifact has to be the uber-jar produced with
 * `-Dquarkus.package.type=uber-jar` (target/*-runner.jar).
 */
function findRunnableJar(dir) {
  const target = join(dir, 'target');
  if (!existsSync(target)) {
    return null;
  }
  const runners = readdirSync(target)
    .filter((name) => name.endsWith('-runner.jar'))
    .map((name) => join(target, name))
    .filter((path) => statSync(path).isFile());
  if (runners.length > 0) {
    return runners.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
  }
  const legacy = join(target, 'quarkus-app/quarkus-run.jar');
  return existsSync(legacy) ? legacy : null;
}

function findWebDist(webDir) {
  const browser = join(webDir, 'dist/browser');
  if (existsSync(browser)) {
    return browser;
  }
  const plain = join(webDir, 'dist');
  return existsSync(plain) ? plain : null;
}

/**
 * ImageBuilder layout: the first `.jar` entry becomes the container `app.jar`;
 * web assets travel under `static/**` (copied into /app/static by the
 * platform Dockerfile).
 */
function createBundle(backendJar, webDist) {
  const entries = [{ name: 'app.jar', data: readFileSync(backendJar) }];
  if (webDist) {
    for (const file of listFiles(webDist)) {
      entries.push({ name: `static/${file}`, data: readFileSync(join(webDist, file)) });
    }
  }
  return createZip(entries);
}

function runOptional(binary, args, cwd, label) {
  const result = spawnSync(binary, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) {
    console.warn(`${label} skipped: ${result.error.message}`);
    return;
  }
  if (result.status !== 0) {
    throw new Error(`${label} failed with exit code ${result.status}`);
  }
}
