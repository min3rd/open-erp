/**
 * check-admin-units.mjs — kiểm tra tệp dữ liệu địa giới seed (TASK-393).
 * Chạy: node scripts/check-admin-units.mjs   (offline, không gọi mạng)
 * Kiểm tra: header counts khớp số dòng, mỗi dòng đúng 4 trường, mã xã duy nhất,
 * mọi xã đều thuộc một tỉnh có trong danh sách.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FILE = join('plugins', 'catalog', 'src', 'main', 'resources', 'db', 'seed', 'provinces-communes.csv');
const lines = readFileSync(FILE, 'utf8').split('\n').filter((l) => l.trim().length > 0);

const meta = {};
const rows = [];
let headerSeen = false;
for (const line of lines) {
  if (line.startsWith('#')) {
    const m = line.match(/^#\s*([a-z]+):\s*(.+)$/);
    if (m) meta[m[1]] = m[2];
    continue;
  }
  if (!headerSeen) {
    if (line !== 'province_code,province_name,commune_code,commune_name') {
      throw new Error(`header row sai: ${line}`);
    }
    headerSeen = true;
    continue;
  }
  const parts = line.split(',');
  if (parts.length !== 4) throw new Error(`dòng không đúng 4 trường: ${line}`);
  rows.push(parts);
}

const provinces = new Map();
const communes = new Map();
for (const [pCode, pName, cCode, cName] of rows) {
  provinces.set(pCode, pName);
  if (communes.has(cCode)) throw new Error(`mã xã trùng: ${cCode} (${cName} / ${communes.get(cCode)})`);
  communes.set(cCode, { pCode, cName });
  if (!cName || !pName || !cCode || !pCode) throw new Error(`dòng thiếu dữ liệu: ${line}`);
}

const nProv = Number(meta.provinces);
const nCom = Number(meta.communes);
if (!Number.isFinite(nProv) || !Number.isFinite(nCom)) throw new Error('thiếu header # provinces/# communes');
if (provinces.size !== nProv) throw new Error(`header provinces=${nProv} nhưng có ${provinces.size} tỉnh`);
if (rows.length !== nCom) throw new Error(`header communes=${nCom} nhưng có ${rows.length} xã`);
if (!meta.source || !meta.generated) throw new Error('thiếu header # source/# generated');

console.log(`OK — ${provinces.size} tỉnh, ${rows.length} xã/phường`);
console.log(`nguồn: ${meta.source}`);
console.log(`sinh ngày: ${meta.generated}`);
