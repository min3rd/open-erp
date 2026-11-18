export type PdfAnnotationType = 'highlight' | 'ink' | 'note';

export interface PdfAnnotation {
  id: string;
  page: number;
  type: PdfAnnotationType;
  color: string;
  /** Normalized 0..1 coordinates relative to the page box. */
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number }>;
  text?: string;
  author?: string;
  createdAt?: string;
}

const MARKER = '%OPENERP-ANNOTATIONS ';
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function createAnnotation(input: Omit<PdfAnnotation, 'id' | 'createdAt'>, now = new Date()): PdfAnnotation {
  return {
    ...input,
    id: `ann-${now.getTime().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now.toISOString(),
  };
}

export function annotationsForPage(list: PdfAnnotation[], page: number): PdfAnnotation[] {
  return list.filter((annotation) => annotation.page === page);
}

export function addAnnotation(list: PdfAnnotation[], annotation: PdfAnnotation): PdfAnnotation[] {
  return [...list, annotation];
}

export function removeAnnotation(list: PdfAnnotation[], id: string): PdfAnnotation[] {
  return list.filter((annotation) => annotation.id !== id);
}

/** Embed annotations as a PDF comment line before the last %%EOF (ignored by readers). */
export function embedAnnotations(bytes: Uint8Array, annotations: PdfAnnotation[]): Uint8Array {
  const text = latin1Decode(bytes);
  const cleaned = removeEmbedded(text);
  if (!annotations.length) return latin1Encode(cleaned);
  const payload = MARKER + base64Encode(JSON.stringify(annotations));
  const eof = cleaned.lastIndexOf('%%EOF');
  const body = eof < 0
    ? `${cleaned}\n${payload}\n%%EOF\n`
    : `${cleaned.slice(0, eof)}${payload}\n${cleaned.slice(eof)}`;
  return latin1Encode(body);
}

export function parseEmbeddedAnnotations(bytes: Uint8Array): PdfAnnotation[] {
  const text = latin1Decode(bytes);
  const index = text.lastIndexOf(MARKER);
  if (index < 0) return [];
  const end = text.indexOf('\n', index);
  const value = text.slice(index + MARKER.length, end < 0 ? text.length : end).trim();
  try {
    const parsed = JSON.parse(base64Decode(value));
    return Array.isArray(parsed) ? parsed.filter(isAnnotation) : [];
  } catch {
    return [];
  }
}

export function stripEmbeddedAnnotations(bytes: Uint8Array): Uint8Array {
  return latin1Encode(removeEmbedded(latin1Decode(bytes)));
}

function removeEmbedded(text: string): string {
  return text.replace(new RegExp(`${escapeRegExp(MARKER)}[^\\r\\n]*\\r?\\n?`, 'g'), '');
}

export function annotationsStorageKey(fileName: string, size: number, modified?: number): string {
  return `office.pdf.annotations.${fileName}.${size}.${modified ?? 0}`;
}

export function serializeAnnotations(annotations: PdfAnnotation[]): string {
  return JSON.stringify(annotations);
}

export function parseAnnotations(value: string | null): PdfAnnotation[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(isAnnotation) : [];
  } catch {
    return [];
  }
}

function isAnnotation(value: unknown): value is PdfAnnotation {
  if (!value || typeof value !== 'object') return false;
  const item = value as PdfAnnotation;
  return typeof item.id === 'string'
    && typeof item.page === 'number'
    && (item.type === 'highlight' || item.type === 'ink' || item.type === 'note')
    && typeof item.x === 'number'
    && typeof item.y === 'number';
}

function latin1Decode(bytes: Uint8Array): string {
  let text = '';
  const chunk = 8192;
  for (let index = 0; index < bytes.length; index += chunk) {
    text += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return text;
}

function latin1Encode(text: string): Uint8Array {
  const bytes = new Uint8Array(text.length);
  for (let index = 0; index < text.length; index++) bytes[index] = text.charCodeAt(index) & 0xff;
  return bytes;
}

function base64Encode(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1] ?? 0;
    const c = bytes[index + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    output += BASE64_ALPHABET[(triple >> 18) & 0x3f] + BASE64_ALPHABET[(triple >> 12) & 0x3f];
    output += index + 1 < bytes.length ? BASE64_ALPHABET[(triple >> 6) & 0x3f] : '=';
    output += index + 2 < bytes.length ? BASE64_ALPHABET[triple & 0x3f] : '=';
  }
  return output;
}

function base64Decode(value: string): string {
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, '');
  const bytes: number[] = [];
  for (let index = 0; index < clean.length; index += 4) {
    const a = BASE64_ALPHABET.indexOf(clean[index]);
    const b = BASE64_ALPHABET.indexOf(clean[index + 1]);
    const c = clean[index + 2] === '=' ? -1 : BASE64_ALPHABET.indexOf(clean[index + 2]);
    const d = clean[index + 3] === '=' ? -1 : BASE64_ALPHABET.indexOf(clean[index + 3]);
    if (a < 0 || b < 0) break;
    bytes.push((a << 2) | (b >> 4));
    if (c >= 0) bytes.push(((b & 0x0f) << 4) | (c >> 2));
    if (d >= 0) bytes.push(((c & 0x03) << 6) | d);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
