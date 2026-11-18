export type FileKind = 'ZIP' | 'OLE2' | 'PDF' | 'CSV_TEXT' | 'UNKNOWN';

const SIGNATURES: Array<{ kind: FileKind; bytes: number[] }> = [
  { kind: 'ZIP', bytes: [0x50, 0x4b, 0x03, 0x04] },
  { kind: 'OLE2', bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] },
  { kind: 'PDF', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
];

export function detectFileKind(bytes: Uint8Array): FileKind {
  for (const signature of SIGNATURES) {
    if (signature.bytes.every((value, index) => bytes[index] === value)) {
      return signature.kind;
    }
  }
  if (bytes.length > 0 && !bytes.includes(0)) {
    return 'CSV_TEXT';
  }
  return 'UNKNOWN';
}

export function assertExtensionMatches(extension: string, kind: FileKind): void {
  const ext = extension.toLowerCase();
  if ((ext === 'docx' || ext === 'xlsx' || ext === 'pptx') && kind === 'OLE2') {
    throw new OfficeBinaryError('OFFICE_ENCRYPTED_FILE_UNSUPPORTED', { extension });
  }
  const expected: Record<string, FileKind> = {
    docx: 'ZIP', xlsx: 'ZIP', pptx: 'ZIP',
    doc: 'OLE2', xls: 'OLE2', ppt: 'OLE2',
    pdf: 'PDF', csv: 'CSV_TEXT',
  };
  const want = expected[ext];
  if (!want || want !== kind) {
    throw new OfficeBinaryError('OFFICE_INVALID_MAGIC_BYTES', { extension });
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
