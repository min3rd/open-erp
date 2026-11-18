import { attr, findChild, findChildren, parseXml, textOf, type XmlNode } from '../binary/xml';
import type { ExcelComment, ExcelSheet } from './types';

const COMMENTS_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml';
const COMMENTS_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/comments';
const VML_REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/vmlDrawing';

export function parseSheetComments(entries: Map<string, Uint8Array>, sheetPath: string | undefined): Map<string, ExcelComment> {
  const result = new Map<string, ExcelComment>();
  if (!sheetPath) return result;
  const relsPath = sheetRelsPath(sheetPath);
  const relsBytes = entries.get(relsPath);
  if (!relsBytes) return result;
  const rels = new TextDecoder('utf-8').decode(relsBytes);
  const match = /<Relationship[^>]*Type="[^"]*\/comments"[^>]*Target="([^"]+)"[^>]*\/>/.exec(rels)
    ?? /<Relationship[^>]*Target="([^"]+)"[^>]*Type="[^"]*\/comments"[^>]*\/>/.exec(rels);
  if (!match) return result;
  const commentsPath = resolveTarget(sheetPath, match[1]);
  const bytes = entries.get(commentsPath);
  if (!bytes) return result;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const comments = findChild(root, 'comments') ?? root;
  const authors = findChildren(findChild(comments, 'authors'), 'author').map((author) => textOf(author));
  for (const comment of findChildren(findChild(comments, 'commentList'), 'comment')) {
    const ref = attr(comment, 'ref');
    if (!ref) continue;
    const authorId = Number(attr(comment, 'authorId') ?? 0);
    const text = textOf(findChild(comment, 'text'));
    result.set(ref, { ref, author: authors[authorId] ?? 'Author', text });
  }
  return result;
}

export function writeSheetComments(entries: Map<string, Uint8Array>, sheet: ExcelSheet): void {
  if (!sheet.path) return;
  const comments = [...(sheet.comments ?? new Map()).values()];
  const relsPath = sheetRelsPath(sheet.path);
  let rels = read(entries.get(relsPath)) || '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  const commentsRelId = existingRelId(rels, 'comments') ?? 'rIdComments';
  const vmlRelId = existingRelId(rels, 'vmlDrawing') ?? 'rIdVml';
  let commentsPath = existingTarget(entries, sheet.path, rels, 'comments') ?? 'xl/comments1.xml';
  let vmlPath = existingTarget(entries, sheet.path, rels, 'vmlDrawing') ?? 'xl/drawings/vmlDrawing1.vml';

  const authors = [...new Set(comments.map((comment) => comment.author))];
  const commentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<comments xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
    + `<authors>${authors.map((author) => `<author>${escapeXml(author)}</author>`).join('')}</authors>`
    + `<commentList>${comments.map((comment) => {
      const authorId = Math.max(0, authors.indexOf(comment.author));
      return `<comment ref="${comment.ref}" authorId="${authorId}"><text><r><rPr><sz val="9"/><color indexed="81"/><rFont val="Tahoma"/></rPr><t xml:space="preserve">${escapeXml(comment.text)}</t></r></text></comment>`;
    }).join('')}</commentList></comments>`;
  entries.set(commentsPath, new TextEncoder().encode(commentXml));

  if (comments.length) {
    entries.set(vmlPath, new TextEncoder().encode(vmlDrawing(comments)));
    if (!rels.includes('Type="' + COMMENTS_REL + '"')) {
      rels = rels.replace('</Relationships>', `<Relationship Id="${commentsRelId}" Type="${COMMENTS_REL}" Target="${relativeTarget(sheet.path, commentsPath)}"/></Relationships>`);
    }
    if (!rels.includes('Type="' + VML_REL + '"')) {
      rels = rels.replace('</Relationships>', `<Relationship Id="${vmlRelId}" Type="${VML_REL}" Target="${relativeTarget(sheet.path, vmlPath)}"/></Relationships>`);
    }
    entries.set(relsPath, new TextEncoder().encode(rels));
    ensureLegacyDrawing(sheet, vmlRelId);
    ensureContentTypes(entries);
  } else {
    entries.set(relsPath, new TextEncoder().encode(rels));
    removeLegacyDrawing(sheet);
  }
}

function ensureLegacyDrawing(sheet: ExcelSheet, relId: string): void {
  const root = sheet.xmlRoot;
  if (!root) return;
  root.children = root.children.filter((child) => child.name !== 'legacyDrawing');
  const node: XmlNode = { name: 'legacyDrawing', attrs: { 'r:id': relId }, text: '', children: [] };
  const anchor = root.children.findIndex((child) => child.name === 'extLst');
  root.children.splice(anchor < 0 ? root.children.length : anchor, 0, node);
}

function removeLegacyDrawing(sheet: ExcelSheet): void {
  if (sheet.xmlRoot) sheet.xmlRoot.children = sheet.xmlRoot.children.filter((child) => child.name !== 'legacyDrawing');
}

function ensureContentTypes(entries: Map<string, Uint8Array>): void {
  let types = read(entries.get('[Content_Types].xml')) || '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>';
  if (!types.includes('Extension="vml"')) {
    types = types.replace('</Types>', '<Default Extension="vml" ContentType="application/vnd.openxmlformats-officedocument.vmlDrawing"/></Types>');
  }
  if (!types.includes('/xl/comments1.xml')) {
    types = types.replace('</Types>', `<Override PartName="/xl/comments1.xml" ContentType="${COMMENTS_CONTENT_TYPE}"/></Types>`);
  }
  entries.set('[Content_Types].xml', new TextEncoder().encode(types));
}

function vmlDrawing(comments: ExcelComment[]): string {
  const shapes = comments.map((comment, index) => {
    const { row, col } = cellPosition(comment.ref);
    return `<v:shape id="_x0000_s${1025 + index}" type="#_x0000_t202" style="position:absolute;margin-left:59.25pt;margin-top:1.5pt;width:108pt;height:59.25pt;z-index:1;visibility:hidden" fillcolor="#ffffe1" o:insetmode="auto">`
      + '<v:fill color2="#ffffe1"/><v:shadow on="t" color="black" obscured="t"/><v:path o:connecttype="none"/>'
      + '<v:textbox style="mso-direction-alt:auto"><div style="text-align:left"></div></v:textbox>'
      + `<x:ClientData ObjectType="Note"><x:MoveWithCells/><x:SizeWithCells/><x:Anchor>${col + 1}, 15, ${row}, 2, ${col + 3}, 15, ${row + 4}, 4</x:Anchor><x:AutoFill>False</x:AutoFill><x:Row>${row}</x:Row><x:Column>${col}</x:Column></x:ClientData></v:shape>`;
  }).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<xml xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">'
    + '<v:shapetype id="_x0000_t202" coordsize="21600,21600" o:spt="202" path="m,l,21600r21600,l21600,xe"><v:stroke joinstyle="miter"/><v:path gradientshapeok="t" o:connecttype="rect"/></v:shapetype>'
    + shapes + '</xml>';
}

function sheetRelsPath(sheetPath: string): string {
  const slash = sheetPath.lastIndexOf('/');
  const dir = sheetPath.slice(0, slash);
  const file = sheetPath.slice(slash + 1);
  return `${dir}/_rels/${file}.rels`;
}

function resolveTarget(basePart: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1);
  const base = basePart.slice(0, basePart.lastIndexOf('/')).split('/');
  for (const segment of target.split('/')) {
    if (segment === '..') base.pop();
    else if (segment !== '.') base.push(segment);
  }
  return base.join('/');
}

function relativeTarget(basePart: string, target: string): string {
  const base = basePart.slice(0, basePart.lastIndexOf('/')).split('/');
  const parts = target.split('/');
  let common = 0;
  while (common < base.length && common < parts.length && base[common] === parts[common]) common++;
  return `${'../'.repeat(base.length - common)}${parts.slice(common).join('/')}`;
}

function existingRelId(rels: string, type: string): string | null {
  const match = new RegExp(`<Relationship[^>]*Id="([^"]+)"[^>]*Type="[^"]*\\/${type}"`).exec(rels)
    ?? new RegExp(`<Relationship[^>]*Type="[^"]*\\/${type}"[^>]*Id="([^"]+)"`).exec(rels);
  return match ? match[1] : null;
}

function existingTarget(entries: Map<string, Uint8Array>, sheetPath: string, rels: string, type: string): string | null {
  const match = new RegExp(`<Relationship[^>]*Target="([^"]+)"[^>]*Type="[^"]*\\/${type}"`).exec(rels)
    ?? new RegExp(`<Relationship[^>]*Type="[^"]*\\/${type}"[^>]*Target="([^"]+)"`).exec(rels);
  return match ? resolveTarget(sheetPath, match[1]) : null;
}

function cellPosition(ref: string): { row: number; col: number } {
  const match = /^([A-Z]+)(\d+)$/i.exec(ref);
  if (!match) return { row: 0, col: 0 };
  let col = 0;
  for (const char of match[1].toUpperCase()) col = col * 26 + char.charCodeAt(0) - 64;
  return { row: Number(match[2]) - 1, col: col - 1 };
}

function read(bytes: Uint8Array | undefined): string {
  return bytes ? new TextDecoder('utf-8').decode(bytes) : '';
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
