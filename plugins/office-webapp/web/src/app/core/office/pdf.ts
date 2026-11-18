import { OfficeBinaryError } from '../binary/magic-bytes';
import type { PdfPageInfo } from './types';

export function parsePdfInfo(buffer: ArrayBuffer | Uint8Array): PdfPageInfo {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const text = new TextDecoder('latin1').decode(bytes);
  if (!text.startsWith('%PDF-')) {
    throw new OfficeBinaryError('OFFICE_INVALID_MAGIC_BYTES', { extension: 'pdf' });
  }
  if (/\/Encrypt\b/.test(text)) {
    throw new OfficeBinaryError('OFFICE_ENCRYPTED_FILE_UNSUPPORTED', { extension: 'pdf' });
  }
  const pageMatches = text.match(/\/Type\s*\/Page\b/g);
  const pageCount = pageMatches ? pageMatches.length : 0;
  const mediaBox = /\/MediaBox\s*\[\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(text);
  const widthPt = mediaBox ? Number(mediaBox[3]) - Number(mediaBox[1]) : 612;
  const heightPt = mediaBox ? Number(mediaBox[4]) - Number(mediaBox[2]) : 792;
  return {
    pageCount: Math.max(pageCount, 1),
    width: Math.round((widthPt * 96) / 72),
    height: Math.round((heightPt * 96) / 72),
  };
}
