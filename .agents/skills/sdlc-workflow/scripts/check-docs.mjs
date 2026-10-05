import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Read-only: validate supplied Markdown files, or the workflow/onboarding entrypoints.
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const defaults = [
  'AGENTS.md', '.agents/rules', '.agents/skills/sdlc-workflow/SKILL.md',
  'docs/README.md', 'docs/system/templates',
  'docs/08_developer_guides/00_READING_GUIDE.md',
  'docs/08_developer_guides/01_project_walkthrough.md',
  'docs/08_developer_guides/coding_standards.md',
  'docs/08_developer_guides/shared_ui_contribution_guide.md',
];
const errors = [];
const display = (file) => path.relative(root, file).replaceAll('\\', '/');
async function markdownFiles(file) {
  const info = await stat(file);
  if (info.isFile()) return file.endsWith('.md') ? [file] : [];
  const entries = await readdir(file, { withFileTypes: true });
  const result = [];
  for (const entry of entries) result.push(...await markdownFiles(path.join(file, entry.name)));
  return result;
}
function prose(source) {
  return source.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, '');
}
function anchors(source) {
  const seen = new Map();
  const ids = new Set();
  for (const match of prose(source).matchAll(/^ {0,3}#{1,6}\s+(.+?)\s*#*$/gm)) {
    const base = match[1].replace(/<[^>]*>/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .toLowerCase().replace(/[^\p{L}\p{N}\p{M}_\-\s]/gu, '').replace(/\s/g, '-');
    const count = seen.get(base) ?? 0;
    ids.add(count ? `${base}-${count}` : base);
    seen.set(base, count + 1);
  }
  for (const match of source.matchAll(/\b(?:id|name)=["']([^"']+)["']/g)) ids.add(match[1]);
  return ids;
}
const inputs = process.argv.slice(2);
const files = new Set();
if (!inputs.length) {
  for (const entry of await readdir(path.join(root, 'docs/sprints'), { withFileTypes: true })) {
    if (entry.isDirectory() && /^sprint_\d+_/.test(entry.name)) {
      defaults.push(`docs/sprints/${entry.name}/00_READING_GUIDE.md`);
    }
  }
}
for (const input of inputs.length ? inputs : defaults) {
  const resolved = path.resolve(root, input);
  try { for (const file of await markdownFiles(resolved)) files.add(file); }
  catch (error) { errors.push(`${display(resolved)}: ${error.code}`); }
}
let checkedLinks = 0;
const documentIds = new Map();
for (const file of files) {
  const source = prose(await readFile(file, 'utf8'));
  if (!display(file).includes('/templates/')) {
    const metadataId = source.match(/^\|\s*ID(?:\s*\/[^|]*)?\s*\|\s*([A-Z][A-Z0-9-]*-\d+)\b/m)?.[1];
    if (metadataId) {
      if (documentIds.has(metadataId)) errors.push(`duplicate document ID ${metadataId}: ${display(documentIds.get(metadataId))}, ${display(file)}`);
      else documentIds.set(metadataId, file);
      const numbered = path.basename(file).match(/^(\d{2,})_([A-Z][A-Z0-9-]*-S\d{2,}-\d{3,})_/);
      if (numbered && numbered[2] !== metadataId) {
        errors.push(`${display(file)}: filename ID ${numbered[2]} differs from metadata ${metadataId}`);
      }
      const sprint = display(file).match(/sprint_(\d+)_/);
      const idSprint = metadataId.match(/-S(\d+)-/);
      if (sprint && idSprint && Number(sprint[1]) !== Number(idSprint[1])) {
        errors.push(`${display(file)}: document ID belongs to Sprint ${idSprint[1]}`);
      }
    }
  }
  for (const match of source.matchAll(/!?\[[^\]\n]*\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+["'][^)]*)?\s*\)/g)) {
    let target = match[1].replace(/^<|>$/g, '');
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('//')) continue;
    if (/[<>]/.test(target)) continue; // Template placeholder, not a real path.
    const split = target.indexOf('#');
    let fragment = split < 0 ? '' : target.slice(split + 1);
    target = split < 0 ? target : target.slice(0, split);
    try {
      target = decodeURIComponent(target);
      fragment = decodeURIComponent(fragment);
      const resolved = target ? path.resolve(path.dirname(file), target) : file;
      const info = await stat(resolved);
      checkedLinks += 1;
      if (fragment && info.isFile() && resolved.endsWith('.md')) {
        if (!anchors(await readFile(resolved, 'utf8')).has(fragment)) {
          errors.push(`${display(file)}: missing anchor ${match[1]}`);
        }
      }
    } catch (error) { errors.push(`${display(file)}: broken link ${match[1]} (${error.code ?? error.message})`); }
  }
}
// File item IDs are global; historical inline tasks require coordinator review.
const itemIds = new Map();
let checkedItems = 0;
for (const file of await markdownFiles(path.join(root, 'docs/sprints'))) {
  if (!display(file).includes('/07_items/')) continue;
  const id = path.basename(file).match(/^(FEAT|TASK|BUG|REFACTOR)-(\d+)(?:_|\.md)/);
  if (!id) continue;
  const key = `${id[1]}-${Number(id[2])}`;
  if (itemIds.has(key)) errors.push(`duplicate item ID ${key}: ${display(itemIds.get(key))}, ${display(file)}`);
  else itemIds.set(key, file);
  checkedItems += 1;
}
console.log(JSON.stringify({ markdownFiles: files.size, checkedLinks, checkedItems, checkedDocumentIds: documentIds.size, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
