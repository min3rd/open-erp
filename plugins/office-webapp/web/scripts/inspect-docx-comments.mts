import fs from 'node:fs';
import { parseDocx } from '../src/app/core/office/docx.ts';
import { listRevisions } from '../src/app/core/office/track-changes.ts';
import { parseBookmarks } from '../src/app/core/office/word-toc.ts';
import { descendants } from '../src/app/core/binary/xml.ts';

function exportsBookmarks(word: import('../src/app/core/office/types.ts').WordDocument) {
  return parseBookmarks(word);
}

const bytes = fs.readFileSync(process.argv[2]);
const word = await parseDocx(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
const comments = word.comments ?? [];
const anchors = word.blocks.map((block, index) => {
  if (block.kind !== 'paragraph' || !block.paragraph.xmlNode) return null;
  const ids = descendants(block.paragraph.xmlNode, 'w:commentRangeStart').map((node) => node.attrs['w:id']);
  return ids.length ? { index, ids } : null;
}).filter(Boolean);
console.log(JSON.stringify({
  comments: comments.map((comment) => ({ id: comment.id, parentId: comment.parentId, author: comment.author, text: comment.text, resolved: comment.resolved, paragraphIndex: comment.paragraphIndex })),
  anchors,
  revisions: listRevisions(word).map((revision) => ({ type: revision.type, text: revision.text })),
  sections: (word.sections ?? []).map((section) => ({
    header: section.headers.map((ref) => ({ type: ref.type, text: ref.text, path: ref.path, page: ref.hasPageNumber })),
    footer: section.footers.map((ref) => ({ type: ref.type, text: ref.text, path: ref.path, page: ref.hasPageNumber })),
    pageNumberFormat: section.pageNumberFormat,
    pageNumberStart: section.pageNumberStart ?? null,
    titlePg: section.titlePg,
  })),
  notes: {
    footnotes: (word.notes?.footnotes ?? []).map((note) => ({ id: note.id, text: note.text, refParagraph: note.refParagraph })),
    endnotes: (word.notes?.endnotes ?? []).map((note) => ({ id: note.id, text: note.text, refParagraph: note.refParagraph })),
    footnoteFormat: word.notes?.footnoteFormat ?? null,
    footnoteRestart: word.notes?.footnoteRestart ?? null,
  },
  sources: (word.sources ?? []).map((source) => ({ tag: source.tag, author: source.author, title: source.title, year: source.year })),
  equations: (word.equations ?? []).map((equation) => ({ kind: equation.kind, label: equation.label, paragraphIndex: equation.paragraphIndex })),
  ink: (word.inkStrokes ?? []).map((stroke) => ({ color: stroke.color, width: stroke.width, points: stroke.points.length })),
  bookmarks: exportsBookmarks(word),
  fields: descendants(word.xmlRoot!, 'w:instrText').map((node) => node.text.trim()),
  bodyText: word.blocks.map((block) => block.kind === 'paragraph' ? block.paragraph.runs.map((run) => run.text).join('') : '[table]').join(' | '),
  firstParagraph: word.blocks[0].kind === 'paragraph' ? word.blocks[0].paragraph.runs.map((run) => run.text).join('') : null,
}, null, 2));
