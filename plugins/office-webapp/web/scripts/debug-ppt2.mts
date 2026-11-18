import fs from 'node:fs';
import { writeZip } from '../src/app/core/binary/zip.ts';
import { parsePptx } from '../src/app/core/office/pptx.ts';
import { savePptx } from '../src/app/core/office/pptx-save.ts';
import { addSlide, addSlideComment, moveSlide, setSlideBackground, setSlideNotes, setSlideSize, toggleSlideHidden } from '../src/app/core/office/ppt-edit.ts';

const enc = new TextEncoder();
const text = (value: string) => enc.encode(value);
const pptx = await writeZip([
  { name: 'ppt/presentation.xml', data: text('<?xml version="1.0"?><p:presentation xmlns:p="p" xmlns:r="r"><p:sldSz cx="12192000" cy="6858000"/><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>') },
  { name: 'ppt/_rels/presentation.xml.rels', data: text('<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="slides/slide1.xml" Type="slide"/></Relationships>') },
  { name: 'ppt/slides/slide1.xml', data: text('<?xml version="1.0"?><p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="914400"/><a:ext cx="7315200" cy="1828800"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:rPr sz="4000" b="1"/><a:t>Báo cáo Sprint 12</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>') },
]);
const deck = await parsePptx(pptx);
addSlide(deck);
addSlide(deck, 0);
moveSlide(deck, 2, 0);
toggleSlideHidden(deck, 1);
setSlideSize(deck, 960, 720);
setSlideBackground(deck, 1, '#112233');
setSlideNotes(deck, 1, 'Ghi chú slide 1');
addSlideComment(deck, 1, 'Bình luận QA', 'QA', '2026-11-16T00:00:00Z');
const saved = await parsePptx(await savePptx(deck, pptx));
console.log(JSON.stringify(saved.slides.map((s) => ({
  path: s.path, shapes: s.shapes.map((shape) => shape.text), hidden: s.hidden, bg: s.background,
  notes: s.notes, comments: s.comments,
})), null, 2));
fs.writeFileSync('plugins/office-webapp/web/.tmp/debug-ppt2.pptx', await savePptx(deck, pptx));
