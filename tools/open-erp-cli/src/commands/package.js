import { cpSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { readManifest } from '../lib/manifest.js';
import { sha256File } from '../lib/checksum.js';
import { listFiles, writeFile } from '../lib/fsx.js';

export async function packageCommand(flags) {
  const dir = resolve(flags.dir || process.cwd());
  const manifest = readManifest(dir);
  const dist = join(dir, flags.out || 'dist');
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(dist, { recursive: true });
  if (flags.skipBuild !== true && flags.skipBuild !== 'true') {
    runOptional('mvn', ['-q', '-DskipTests', 'package'], dir, 'maven build');
  }
  const artifacts = [];
  const jar = join(dir, 'target/quarkus-app/quarkus-run.jar');
  if (existsSync(jar)) {
    const target = join(dist, 'plugin-backend.jar');
    cpSync(jar, target);
    artifacts.push(target);
  } else {
    console.warn('backend jar not found (target/quarkus-app/quarkus-run.jar) — packaging manifest only');
  }
  if (flags.withWeb === true || flags.withWeb === 'true') {
    const webDir = join(dir, 'web');
    if (existsSync(join(webDir, 'package.json'))) {
      runOptional('npm', ['run', 'build'], webDir, 'web build');
    }
    const webDist = join(webDir, 'dist');
    if (existsSync(webDist)) {
      const target = join(dist, 'web');
      cpSync(webDist, target, { recursive: true });
      artifacts.push(target);
    }
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
