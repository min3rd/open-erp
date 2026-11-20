import { OfficeBinaryError } from './magic-bytes';

export interface Ole2Archive {
  entries: Map<string, Uint8Array>;
  listStreams(): string[];
  readStream(name: string): Uint8Array | undefined;
}

const OLE2_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const MAX_SECTORS = 1_000_000;
const MAX_STREAM_BYTES = 100 * 1024 * 1024;
const FREESECT = 0xffffffff;
const ENDOFCHAIN = 0xfffffffe;
const SPECIAL_SECTOR = 0xfffffffc;

/**
 * Pure TypeScript reader for Microsoft Compound File Binary Format ([MS-CFB]),
 * used to decode legacy `.doc` WordDocument/Table/Data streams and detect
 * encrypted OOXML (`EncryptedPackage`) without third-party libraries.
 */
export function readOle2(buffer: ArrayBuffer | Uint8Array): Ole2Archive {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  if (bytes.byteLength < 512 || !OLE2_MAGIC.every((value, index) => bytes[index] === value)) {
    throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'header-magic' });
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const majorVersion = view.getUint16(26, true);
  const sectorShift = view.getUint16(30, true);
  const miniSectorShift = view.getUint16(32, true);
  if ((majorVersion !== 3 && majorVersion !== 4)
    || (sectorShift !== 9 && sectorShift !== 12)
    || miniSectorShift !== 6) {
    throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'sector-shift' });
  }
  const sectorSize = 1 << sectorShift;
  const miniSectorSize = 1 << miniSectorShift;
  const numFatSectors = view.getUint32(44, true);
  const firstDirSector = view.getUint32(48, true);
  const miniStreamCutoff = view.getUint32(56, true) || 4096;
  const firstMiniFatSector = view.getUint32(60, true);
  const numMiniFatSectors = view.getUint32(64, true);
  const firstDifatSector = view.getUint32(68, true);
  const numDifatSectors = view.getUint32(72, true);

  const maxDataSectors = Math.floor(Math.max(0, bytes.byteLength - sectorSize) / sectorSize) + 1;
  if (numFatSectors === 0 || numFatSectors > MAX_SECTORS || numDifatSectors > MAX_SECTORS) {
    throw new OfficeBinaryError('OFFICE_OLE2_TOO_LARGE');
  }

  const fatSectorIds: number[] = [];
  for (let index = 0; index < 109 && fatSectorIds.length < numFatSectors; index++) {
    const sector = view.getUint32(76 + index * 4, true);
    if (sector < SPECIAL_SECTOR) fatSectorIds.push(sector);
  }
  if (firstDifatSector < SPECIAL_SECTOR && numDifatSectors > 0) {
    let difatSector = firstDifatSector;
    const seenDifat = new Set<number>();
    const perDifat = sectorSize / 4 - 1;
    for (let step = 0; step < numDifatSectors && difatSector < SPECIAL_SECTOR; step++) {
      if (seenDifat.has(difatSector)) {
        throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'difat-cycle' });
      }
      seenDifat.add(difatSector);
      const offset = sectorOffset(difatSector, sectorSize, bytes.byteLength);
      for (let slot = 0; slot < perDifat && fatSectorIds.length < numFatSectors; slot++) {
        const entry = view.getUint32(offset + slot * 4, true);
        if (entry < SPECIAL_SECTOR) fatSectorIds.push(entry);
      }
      difatSector = view.getUint32(offset + perDifat * 4, true);
    }
  }

  const entriesPerFat = sectorSize / 4;
  const fat = new Uint32Array(fatSectorIds.length * entriesPerFat);
  fat.fill(FREESECT);
  fatSectorIds.forEach((sectorId, tableIndex) => {
    const offset = sectorOffset(sectorId, sectorSize, bytes.byteLength);
    const available = Math.min(entriesPerFat, Math.floor((bytes.byteLength - offset) / 4));
    for (let slot = 0; slot < available; slot++) {
      fat[tableIndex * entriesPerFat + slot] = view.getUint32(offset + slot * 4, true);
    }
  });

  const readFatChain = (startSector: number, maxBytes?: number): Uint8Array => {
    if (startSector === ENDOFCHAIN || startSector === FREESECT) return new Uint8Array(0);
    const chain: number[] = [];
    const seen = new Set<number>();
    let current = startSector;
    let reachedMax = false;
    while (current < SPECIAL_SECTOR) {
      if (seen.has(current)) {
        throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'fat-cycle' });
      }
      if (current >= fat.length || current >= maxDataSectors) {
        throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'fat-oob' });
      }
      seen.add(current);
      chain.push(current);
      if (chain.length > MAX_SECTORS) {
        throw new OfficeBinaryError('OFFICE_OLE2_TOO_LARGE');
      }
      if (maxBytes !== undefined && chain.length * sectorSize >= maxBytes) {
        reachedMax = true;
        break;
      }
      current = fat[current];
    }
    if (!reachedMax && current !== ENDOFCHAIN && current < SPECIAL_SECTOR) {
      throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'fat-tail' });
    }
    const targetLength = maxBytes !== undefined ? maxBytes : chain.length * sectorSize;
    if (targetLength > MAX_STREAM_BYTES) {
      throw new OfficeBinaryError('OFFICE_OLE2_TOO_LARGE');
    }
    const output = new Uint8Array(targetLength);
    let cursor = 0;
    for (const sector of chain) {
      const start = (sector + 1) * sectorSize;
      if (start >= bytes.byteLength) break;
      const take = Math.min(sectorSize, targetLength - cursor, bytes.byteLength - start);
      if (take <= 0) break;
      output.set(bytes.subarray(start, start + take), cursor);
      cursor += take;
      if (cursor >= targetLength) break;
    }
    return output;
  };

  const dirBytes = readFatChain(firstDirSector);
  if (dirBytes.byteLength < 128) {
    throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'directory-empty' });
  }
  const dirView = new DataView(dirBytes.buffer, dirBytes.byteOffset, dirBytes.byteLength);
  interface DirEntry { name: string; objectType: number; startSector: number; size: number }
  const dirEntries: DirEntry[] = [];
  for (let offset = 0; offset + 128 <= dirBytes.byteLength; offset += 128) {
    const objectType = dirBytes[offset + 66];
    if (objectType === 0) continue;
    const nameLen = dirView.getUint16(offset + 64, true);
    const charBytes = Math.max(0, Math.min(64, nameLen) - 2);
    const name = decodeUtf16Le(dirBytes.subarray(offset, offset + charBytes));
    const startSector = dirView.getUint32(offset + 116, true);
    const lowSize = dirView.getUint32(offset + 120, true);
    const highSize = majorVersion === 4 ? dirView.getUint32(offset + 124, true) : 0;
    const size = highSize * 0x100000000 + lowSize;
    if (size > MAX_STREAM_BYTES) {
      throw new OfficeBinaryError('OFFICE_OLE2_TOO_LARGE');
    }
    dirEntries.push({ name, objectType, startSector, size });
  }

  const rootEntry = dirEntries.find((entry) => entry.objectType === 5);
  const miniStream = rootEntry && rootEntry.size > 0 && rootEntry.startSector < SPECIAL_SECTOR
    ? readFatChain(rootEntry.startSector, rootEntry.size)
    : new Uint8Array(0);
  const miniFatBytes = firstMiniFatSector < SPECIAL_SECTOR && numMiniFatSectors > 0
    ? readFatChain(firstMiniFatSector)
    : new Uint8Array(0);
  const miniFatView = new DataView(miniFatBytes.buffer, miniFatBytes.byteOffset, miniFatBytes.byteLength);
  const miniFatCount = Math.floor(miniFatBytes.byteLength / 4);
  const miniFat = new Uint32Array(miniFatCount);
  for (let index = 0; index < miniFatCount; index++) {
    miniFat[index] = miniFatView.getUint32(index * 4, true);
  }

  const readMiniChain = (startSector: number, size: number): Uint8Array => {
    if (size === 0 || startSector === ENDOFCHAIN || startSector === FREESECT) return new Uint8Array(0);
    const output = new Uint8Array(size);
    const seen = new Set<number>();
    let current = startSector;
    let cursor = 0;
    while (current < SPECIAL_SECTOR && cursor < size) {
      if (seen.has(current)) {
        throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'minifat-cycle' });
      }
      if (current >= miniFat.length) {
        throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'minifat-oob' });
      }
      seen.add(current);
      const start = current * miniSectorSize;
      if (start >= miniStream.byteLength) {
        throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'ministream-oob' });
      }
      const take = Math.min(miniSectorSize, size - cursor, miniStream.byteLength - start);
      output.set(miniStream.subarray(start, start + take), cursor);
      cursor += take;
      current = miniFat[current];
    }
    return output;
  };

  const entries = new Map<string, Uint8Array>();
  const lowerLookup = new Map<string, string>();
  let totalStreamBytes = 0;
  for (const entry of dirEntries) {
    if (entry.objectType !== 2) continue;
    totalStreamBytes += entry.size;
    if (totalStreamBytes > MAX_STREAM_BYTES) {
      throw new OfficeBinaryError('OFFICE_OLE2_TOO_LARGE');
    }
    const data = entry.size === 0
      ? new Uint8Array(0)
      : entry.size < miniStreamCutoff && miniStream.byteLength > 0 && miniFat.length > 0
        ? readMiniChain(entry.startSector, entry.size)
        : readFatChain(entry.startSector, entry.size);
    entries.set(entry.name, data);
    lowerLookup.set(entry.name.toLowerCase(), entry.name);
  }

  return {
    entries,
    listStreams: () => [...entries.keys()],
    readStream: (name: string) => {
      const exact = entries.get(name);
      if (exact) return exact;
      const canonical = lowerLookup.get(name.toLowerCase());
      return canonical ? entries.get(canonical) : undefined;
    },
  };
}

function sectorOffset(sector: number, sectorSize: number, byteLength: number): number {
  const offset = (sector + 1) * sectorSize;
  if (sector >= MAX_SECTORS || offset < sectorSize || offset >= byteLength) {
    throw new OfficeBinaryError('OFFICE_OLE2_CORRUPT', { reason: 'sector-offset', sector });
  }
  return offset;
}

function decodeUtf16Le(bytes: Uint8Array): string {
  let result = '';
  for (let index = 0; index + 1 < bytes.length; index += 2) {
    const code = bytes[index] | (bytes[index + 1] << 8);
    if (code === 0) break;
    result += String.fromCharCode(code);
  }
  return result;
}
