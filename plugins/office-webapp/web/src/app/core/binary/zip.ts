import { crc32 } from './crc32';
import { OfficeBinaryError } from './magic-bytes';

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

export interface ZipArchive {
  entries: Map<string, Uint8Array>;
  order: string[];
}

export interface ZipWriteEntry {
  name: string;
  data: Uint8Array;
}

const MAX_TOTAL_UNCOMPRESSED = 200 * 1024 * 1024;
const MAX_RATIO = 120;
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const UTF8_FLAG = 0x0800;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

export async function readZip(buffer: ArrayBuffer | Uint8Array): Promise<ZipArchive> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocd = findEocd(view);
  if (eocd < 0) {
    throw new OfficeBinaryError('OFFICE_ZIP_UNSUPPORTED', { reason: 'eocd-not-found' });
  }
  const total = view.getUint16(eocd + 10, true);
  const centralOffset = view.getUint32(eocd + 16, true);
  let offset = centralOffset;
  const entries = new Map<string, Uint8Array>();
  const order: string[] = [];
  let totalUncompressed = 0;

  for (let index = 0; index < total; index++) {
    if (view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
      throw new OfficeBinaryError('OFFICE_ZIP_UNSUPPORTED', { reason: 'central-directory' });
    }
    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    offset += 46 + nameLength + extraLength + commentLength;

    if (name.endsWith('/')) continue;
    if (name.includes('..') || name.startsWith('/') || name.includes('\\')) {
      throw new OfficeBinaryError('OFFICE_ZIP_UNSAFE_PATH', { name });
    }
    if (method !== 0 && method !== 8) {
      throw new OfficeBinaryError('OFFICE_ZIP_UNSUPPORTED', { reason: 'method', method });
    }
    if (compressedSize === 0 && uncompressedSize > 0) {
      throw new OfficeBinaryError('OFFICE_ZIP_UNSUPPORTED', { reason: 'zip64' });
    }
    totalUncompressed += uncompressedSize;
    if (totalUncompressed > MAX_TOTAL_UNCOMPRESSED) {
      throw new OfficeBinaryError('OFFICE_ZIP_TOO_LARGE', { limit_mb: 200 });
    }
    if (compressedSize > 0 && uncompressedSize / compressedSize > MAX_RATIO) {
      throw new OfficeBinaryError('OFFICE_ZIP_TOO_LARGE', { reason: 'ratio' });
    }

    if (view.getUint32(localOffset, true) !== LOCAL_SIGNATURE) {
      throw new OfficeBinaryError('OFFICE_ZIP_UNSUPPORTED', { reason: 'local-header', name });
    }
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const raw = bytes.subarray(dataStart, dataStart + compressedSize);
    const data = method === 0 ? raw.slice() : await inflateRaw(raw);
    if (data.length !== uncompressedSize) {
      throw new OfficeBinaryError('OFFICE_ZIP_UNSUPPORTED', { reason: 'size-mismatch', name });
    }
    entries.set(name, data);
    order.push(name);
  }
  return { entries, order };
}

export async function writeZip(entries: ZipWriteEntry[]): Promise<Uint8Array> {
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let localOffset = 0;
  const fixedTime = 0;
  const fixedDate = ((2026 - 1980) << 9) | (1 << 5) | 1;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const crc = crc32(entry.data);
    const deflated = entry.data.length > 32 ? await deflateRaw(entry.data) : entry.data;
    const useDeflate = deflated.length < entry.data.length;
    const payload = useDeflate ? deflated : entry.data;
    const method = useDeflate ? 8 : 0;

    const local = new Uint8Array(30 + nameBytes.length + payload.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, LOCAL_SIGNATURE, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, UTF8_FLAG, true);
    lv.setUint16(8, method, true);
    lv.setUint16(10, fixedTime, true);
    lv.setUint16(12, fixedDate, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, payload.length, true);
    lv.setUint32(22, entry.data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(payload, 30 + nameBytes.length);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, CENTRAL_SIGNATURE, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, UTF8_FLAG, true);
    cv.setUint16(10, method, true);
    cv.setUint16(12, fixedTime, true);
    cv.setUint16(14, fixedDate, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, payload.length, true);
    cv.setUint32(24, entry.data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, localOffset, true);
    central.set(nameBytes, 46);

    locals.push(local);
    centrals.push(central);
    localOffset += local.length;
  }

  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, EOCD_SIGNATURE, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, localOffset, true);

  const totalSize = localOffset + centralSize + eocd.length;
  const output = new Uint8Array(totalSize);
  let cursor = 0;
  for (const local of locals) { output.set(local, cursor); cursor += local.length; }
  for (const central of centrals) { output.set(central, cursor); cursor += central.length; }
  output.set(eocd, cursor);
  return output;
}

function findEocd(view: DataView): number {
  const min = Math.max(0, view.byteLength - 65557);
  for (let i = view.byteLength - 22; i >= min; i--) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) return i;
  }
  return -1;
}

async function deflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
