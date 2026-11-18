import fs from 'node:fs';
import { parsePptx } from '../src/app/core/office/pptx.ts';
import { savePptx } from '../src/app/core/office/pptx-save.ts';
import { addSlide, addSlideComment, deleteSlide, moveSlide, setSlideBackground, setSlideNotes, setSlideSize, toggleSlideHidden } from '../src/app/core/office/ppt-edit.ts';

const bytes = fs.readFileSync(process.argv[2]);
const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const deck = await parsePptx(buffer);
console.log('before', deck.slides.length, deck.slides.map((s) => ({ path: s.path, layout: s.layoutName, notes: s.notes, comments: s.comments?.length })));
addSlide(deck);
addSlide(deck, 0);
moveSlide(deck, 2, 0);
toggleSlideHidden(deck, 1);
setSlideSize(deck, 960, 720);
setSlideBackground(deck, 1, '#112233');
console.log('notesOk', setSlideNotes(deck, 1, 'Ghi chú slide 1'));
console.log('commentOk', addSlideComment(deck, 1, 'Bình luận QA', 'QA', '2026-11-16T00:00:00Z'));
const saved = await savePptx(deck, buffer);
const parsed = await parsePptx(saved);
console.log('after', parsed.slides.length, parsed.width, parsed.slides.map((s) => ({
  path: s.path, hidden: s.hidden, bg: s.background, notes: s.notes, notesPath: s.notesPath,
  comments: s.comments, layout: s.layoutName, shapes: s.shapes.length,
})));
console.log('delete 0', deleteSlide(parsed, 0), parsed.slides.length, parsed.slides.map((s) => s.path));
const saved2 = await savePptx(parsed, buffer);
const parsed2 = await parsePptx(saved2);
console.log('after delete', parsed2.slides.length, parsed2.slides.map((s) => ({ path: s.path, notes: s.notes, comments: s.comments, shapes: s.shapes.length })));
fs.writeFileSync('plugins/office-webapp/web/.tmp/debug-ppt.pptx', saved2);
