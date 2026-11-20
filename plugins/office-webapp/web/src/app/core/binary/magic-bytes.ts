export type FileKind = 'ZIP' | 'OLE2' | 'PDF' | 'RTF' | 'XML' | 'HTML' | 'CSV_TEXT' | 'UNKNOWN';

const SIGNATURES: Array<{ kind: FileKind; bytes: number[] }> = [
  { kind: 'ZIP', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { kind: 'ZIP', bytes: [0x50, 0x4b, 0x05, 0x06] },
  { kind: 'OLE2', bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
  { kind: 'PDF', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
];

export function detectFileKind(bytes: Uint8Array): FileKind {
  for (const signature of SIGNATURES) {
    if (bytes.length >= signature.bytes.length
      && signature.bytes.every((value, index) => bytes[index] === value)) {
      return signature.kind;
    }
  }
  const hasNul = bytes.includes(0);
  if (bytes.length > 0 && !hasNul) {
    const startOffset = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? 3 : 0;
    const head = new TextDecoder('utf-8', { fatal: false })
      .decode(bytes.subarray(startOffset, Math.min(bytes.length, startOffset + 512)))
      .trimStart()
      .toLowerCase();
    if (head.startsWith('{\\rtf')) return 'RTF';
    if (head.startsWith('<?xml') || head.startsWith('<w:worddocument') || head.startsWith('<pkg:package')) {
      return 'XML';
    }
    if (head.startsWith('<!doctype html')
      || head.startsWith('<html')
      || head.startsWith('<head')
      || head.startsWith('<meta')
      || head.startsWith('mime-version:')) {
      return 'HTML';
    }
    return 'CSV_TEXT';
  }
  return 'UNKNOWN';
}

export function assertExtensionMatches(extension: string, kind: FileKind): void {
  const ext = extension.toLowerCase();
  if (ext === 'docm' || ext === 'dotm') {
    throw new OfficeBinaryError('OFFICE_MACRO_FILE_UNSUPPORTED', { extension: ext });
  }
  if ((ext === 'docx' || ext === 'dotx' || ext === 'odt' || ext === 'xlsx' || ext === 'pptx') && kind === 'OLE2') {
    throw new OfficeBinaryError('OFFICE_ENCRYPTED_FILE_UNSUPPORTED', { extension: ext });
  }
  if (ext === 'doc') {
    if (kind === 'OLE2' || kind === 'RTF' || kind === 'ZIP' || kind === 'XML' || kind === 'HTML') {
      return;
    }
    throw new OfficeBinaryError('OFFICE_INVALID_MAGIC_BYTES', { extension: ext });
  }
  const expected: Record<string, FileKind> = {
    docx: 'ZIP', dotx: 'ZIP', odt: 'ZIP',
    xlsx: 'ZIP', pptx: 'ZIP',
    xls: 'OLE2', ppt: 'OLE2',
    rtf: 'RTF',
    xml: 'XML',
    pdf: 'PDF',
    csv: 'CSV_TEXT',
  };
  const want = expected[ext];
  if (!want || want !== kind) {
    throw new OfficeBinaryError('OFFICE_INVALID_MAGIC_BYTES', { extension: ext });
  }
}

export class OfficeBinaryError extends Error {
  readonly code: string;
  readonly params: Record<string, string | number>;

  constructor(code: string, params: Record<string, string | number> = {}) {
    super(code);
    this.name = 'OfficeBinaryError';
    this.code = code;
    this.params = params;
  }
}
