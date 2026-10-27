/**
 * gen-admin-units.mjs — sinh một lần tệp dữ liệu địa giới 2 cấp (tỉnh → xã/phường)
 * cho plugin core `catalog` (Sprint 05, TASK-393).
 *
 * Nguồn: https://provinces.open-api.vn (api/v2 — dữ liệu sau sáp nhập 2025:
 * tỉnh → phường/xã trực tiếp, không có huyện).
 *
 * Kết quả: plugins/catalog/src/main/resources/db/seed/provinces-communes.csv
 *   # source: ...
 *   # generated: <ISO date>
 *   # provinces: N
 *   # communes: M
 *   province_code,province_name,commune_code,commune_name
 *   1,Thành phố Hà Nội,4,Phường Ba Đình
 *   ...
 *
 * Runtime KHÔNG gọi mạng: tệp CSV được commit vào repo và nạp khi seed.
 * Chạy lại: node scripts/gen-admin-units.mjs   (chỉ khi cần cập nhật dữ liệu)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

const API = 'https://provinces.open-api.vn/api/v2';
const OUT = join('plugins', 'catalog', 'src', 'main', 'resources', 'db', 'seed', 'provinces-communes.csv');
const DELAY_MS = 250;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url, attempt = 1) {
  try {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    if (attempt >= 3) throw new Error(`${url}: ${err.message}`);
    await sleep(DELAY_MS * 4 * attempt);
    return getJson(url, attempt + 1);
  }
}

/** Tên không được chứa dấu phẩy để tệp CSV parse được bằng cách tách 4 trường. */
const clean = (s) => String(s ?? '').replace(/"/g, "'").replace(/,/g, ' -').replace(/\s+/g, ' ').trim();

const provinces = await getJson(`${API}/p/`);
if (!Array.isArray(provinces) || provinces.length === 0) throw new Error('Không lấy được danh sách tỉnh');

const rows = [];
for (const p of provinces) {
  const detail = await getJson(`${API}/p/${p.code}?depth=2`);
  const wards = detail.wards ?? [];
  if (wards.length === 0) console.warn(`! ${p.name}: không có xã/phường`);
  for (const w of wards) {
    rows.push([clean(p.code), clean(p.name), clean(w.code), clean(w.name)]);
  }
  console.log(`${String(p.code).padStart(3)} ${clean(p.name)} — ${wards.length} xã/phường`);
  await sleep(DELAY_MS);
}

const header = [
  '# source: provinces.open-api.vn (api/v2; dữ liệu sau sáp nhập hành chính 2025 — tỉnh → phường/xã, không có huyện)',
  `# generated: ${new Date().toISOString().slice(0, 10)}`,
  `# provinces: ${provinces.length}`,
  `# communes: ${rows.length}`,
  'province_code,province_name,commune_code,commune_name',
];

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, [...header, ...rows.map((r) => r.join(','))].join('\n') + '\n', 'utf8');
console.log(`\n✔ ${OUT}: ${provinces.length} tỉnh, ${rows.length} xã/phường`);
