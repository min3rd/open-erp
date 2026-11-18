export interface PdfTextPage {
  page: number;
  text: string;
}

export interface PdfSearchHit {
  page: number;
  index: number;
  before: string;
  match: string;
  after: string;
}

interface PdfObject {
  id: number;
  body: string;
}

const OBJECT_PATTERN = /(\d+)\s+0\s+obj([\s\S]*?)endobj/g;

export async function extractPdfTextPages(bytes: Uint8Array): Promise<PdfTextPage[]> {
  const raw = latin1Decode(bytes);
  const objects = new Map<number, PdfObject>();
  let match: RegExpExecArray | null;
  while ((match = OBJECT_PATTERN.exec(raw)) !== null) {
    objects.set(Number(match[1]), { id: Number(match[1]), body: match[2] });
  }
  const pages = [...objects.values()]
    .filter((object) => /\/Type\s*\/Page\b/.test(object.body))
    .sort((a, b) => a.id - b.id);
  const result: PdfTextPage[] = [];
  for (const [index, page] of pages.entries()) {
    const contentIds = [...page.body.matchAll(/\/Contents\s*(\[[^\]]*\]|\d+\s+0\s+R)/g)]
      .flatMap((entry) => [...entry[1].matchAll(/(\d+)\s+0\s+R/g)].map((ref) => Number(ref[1])));
    let text = '';
    for (const id of contentIds) {
      const object = objects.get(id);
      if (!object) continue;
      const stream = readStream(object.body);
      if (stream === null) continue;
      const decoded = await decodeStream(object.body, stream);
      text += `${extractStrings(decoded)}\n`;
    }
    result.push({ page: index + 1, text: text.replace(/[ \t]+/g, ' ').replace(/\n{2,}/g, '\n').trim() });
  }
  return result;
}

export function searchPdfPages(pages: PdfTextPage[], query: string, context = 32): PdfSearchHit[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const hits: PdfSearchHit[] = [];
  for (const page of pages) {
    const haystack = page.text.toLowerCase();
    let from = 0;
    while (from <= haystack.length) {
      const at = haystack.indexOf(needle, from);
      if (at < 0) break;
      hits.push({
        page: page.page,
        index: hits.length,
        before: page.text.slice(Math.max(0, at - context), at),
        match: page.text.slice(at, at + needle.length),
        after: page.text.slice(at + needle.length, at + needle.length + context),
      });
      from = at + Math.max(1, needle.length);
    }
  }
  return hits;
}

export function pdfSearchSummary(hits: PdfSearchHit[], index: number): { position: number; total: number } {
  return { position: hits.length ? Math.min(Math.max(index, 0) + 1, hits.length) : 0, total: hits.length };
}

function readStream(body: string): string | null {
  const start = body.indexOf('stream');
  if (start < 0) return null;
  const end = body.indexOf('endstream', start);
  if (end < 0) return null;
  let offset = start + 'stream'.length;
  if (body[offset] === '\r') offset++;
  if (body[offset] === '\n') offset++;
  return body.slice(offset, end).replace(/\r?\n$/, '');
}

async function decodeStream(body: string, stream: string): Promise<string> {
  if (!/\/Filter\s*\/FlateDecode/.test(body)) return stream;
  try {
    const bytes = Uint8Array.from(stream, (char) => char.charCodeAt(0) & 0xff);
    const decompressed = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    return await new Response(decompressed).text();
  } catch {
    return stream;
  }
}

function extractStrings(content: string): string {
  const parts: string[] = [];
  for (const literal of content.matchAll(/\((?:\\.|[^\\()])*\)/g)) {
    parts.push(decodeLiteral(literal[0].slice(1, -1)));
  }
  return parts.join(' ');
}

function decodeLiteral(value: string): string {
  return value.replace(/\\([nrtbf()\\]|[0-7]{1,3})/g, (_full, escape: string) => {
    if (/^[0-7]+$/.test(escape)) return String.fromCharCode(parseInt(escape, 8));
    const map: Record<string, string> = {
      n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\',
    };
    return map[escape] ?? escape;
  });
}

function latin1Decode(bytes: Uint8Array): string {
  let text = '';
  const chunk = 8192;
  for (let index = 0; index < bytes.length; index += chunk) {
    text += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return text;
}
