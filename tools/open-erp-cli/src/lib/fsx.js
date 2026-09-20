import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

export function ensureDir(path) {
  mkdirSync(path, { recursive: true });
}

export function writeFile(path, content) {
  ensureDir(dirname(path));
  writeFileSync(path, content, 'utf8');
}

export function listFiles(root, current = root, acc = []) {
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    const full = join(current, entry.name);
    if (entry.isDirectory()) {
      listFiles(root, full, acc);
    } else {
      acc.push(relative(root, full).replaceAll('\\', '/'));
    }
  }
  return acc;
}

export function readText(path) {
  return readFileSync(path, 'utf8');
}

export function exists(path) {
  return existsSync(path);
}

export function removeDir(path) {
  rmSync(path, { recursive: true, force: true });
}
