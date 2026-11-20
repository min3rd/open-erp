import { crc32 } from '../src/app/core/binary/crc32.ts';
import fs from 'node:fs';
import path from 'node:path';
import { assertExtensionMatches, detectFileKind, OfficeBinaryError } from '../src/app/core/binary/magic-bytes.ts';
import { readOle2 } from '../src/app/core/binary/ole2.ts';
import { readZip, writeZip } from '../src/app/core/binary/zip.ts';
import { attr, findChild, findChildren, parseXml } from '../src/app/core/binary/xml.ts';
import { openOfficeFile } from '../src/app/core/office/parser.ts';
import { parseDocx, parseWordBlocks } from '../src/app/core/office/docx.ts';
import {
  deleteTableColumn, deleteTableRow, deleteWordTable, distributeTableColumns, insertTableColumn,
  insertTableRow, mergeTableCells, setRowVerticalAlign, setTableAlignment, setTableHeaderRow, splitTableCells,
  applyTableStyle, applyTableCellBorder,
  tableCellLayout, tableColumnCount,
} from '../src/app/core/office/word-tables.ts';
import { parseXlsx } from '../src/app/core/office/xlsx.ts';
import { parsePptx } from '../src/app/core/office/pptx.ts';
import { mediaMimeType } from '../src/app/core/office/pptx.ts';
import {
  addSlide, addSlideComment, deleteSlide, deleteSlideComment, moveSlide, setSlideBackground,
  setSlideNotes, setSlideSize, toggleSlideHidden,
} from '../src/app/core/office/ppt-edit.ts';
import { parseCsv } from '../src/app/core/office/csv.ts';
import { wordToMarkdown } from '../src/app/core/office/word-markdown.ts';
import { resizeRunObject, setRunAlt, setShapeColor } from '../src/app/core/office/word-object.ts';
import { imagesToPdf } from '../src/app/core/office/word-pdf.ts';
import { parsePdfInfo } from '../src/app/core/office/pdf.ts';
import { parseOdt } from '../src/app/core/office/odt.ts';
import { saveOdt } from '../src/app/core/office/odt-save.ts';
import { insertWordSmartArt, smartArtParts, updateWordSmartArt } from '../src/app/core/office/word-smartart.ts';
import { descendants } from '../src/app/core/binary/xml.ts';
import { saveDocx } from '../src/app/core/office/docx-save.ts';
import { saveXlsx } from '../src/app/core/office/xlsx-save.ts';
import { savePptx } from '../src/app/core/office/pptx-save.ts';
import { evaluateFormula, recalculateSheet, catalogueSize } from '../src/app/core/office/formula.ts';
import type { ExcelCell, ExcelSheet, WordBlock, WordDocument, WordParagraph } from '../src/app/core/office/types.ts';
import { buildPivot } from '../src/app/core/office/pivot.ts';
import { buildChartModel, layoutChart } from '../src/app/core/office/chart.ts';
import { parseConditionalRules, styleFor, clearConditionalRules, removeConditionalRule } from '../src/app/core/office/conditional.ts';
import { parseValidations, validate } from '../src/app/core/office/validation.ts';
import { addConditionalRule, addValidationRule } from '../src/app/core/office/excel-rules.ts';
import { createTableConfig, filterTableRows, slicerValues } from '../src/app/core/office/excel-table.ts';
import {
  applyCommentAnchor, buildCommentsExtendedXml, createComment, deleteThread,
  removeCommentAnchors, replyToComment, setResolved, threadOf,
} from '../src/app/core/office/comments.ts';
import {
  acceptAll, acceptRevision, listRevisions, rejectAll, rejectRevision, trackEdit,
} from '../src/app/core/office/track-changes.ts';
import {
  applyAnimations, applyTransition, parseAnimations, parseTransition,
} from '../src/app/core/office/ppt-effects.ts';
import {
  addAnnotation, annotationsForPage, createAnnotation, embedAnnotations,
  parseAnnotations, parseEmbeddedAnnotations, removeAnnotation, serializeAnnotations, stripEmbeddedAnnotations,
} from '../src/app/core/office/pdf-annotations.ts';
import { extractPdfTextPages, pdfSearchSummary, searchPdfPages } from '../src/app/core/office/pdf-text.ts';
import zlib from 'node:zlib';
import {
  ensureHeaderFooter, insertPageNumberField, insertSectionBreak, sectionAt, setColumns, setHeaderFooterText,
  setLineNumbering, setPageBorder, setPageColor, setPageNumbering, setPageSetup, setTitlePage,
} from '../src/app/core/office/word-section.ts';
import { markTableHeader, scanAccessibility, setImageAlt } from '../src/app/core/office/word-accessibility.ts';
import { findWordMatches, replaceWordText } from '../src/app/core/office/word-find.ts';
import { insertWordImage, insertWordTable, insertWordVideo, insertTextBox, insertWordShape } from '../src/app/core/office/word-insert.ts';
import { insertHyperlink } from '../src/app/core/office/word-link.ts';
import { applySpellSuggestion, checkWordSpelling, fixWordSpelling, spellcheckSummary } from '../src/app/core/office/word-spell.ts';
import { WORD_RIBBON, WORD_SINGLE_LINE_RIBBON, wordIconPaths, wordIconSvg, wordLayeredIconSvg } from '../src/app/core/office/word-ribbon.ts';
import { insertCaption, insertCoverPage, insertTableOfFigures, setWatermark } from '../src/app/core/office/word-extra.ts';
import { setDocumentProtection } from '../src/app/core/office/word-protect.ts';
import { setAutoHyphenation } from '../src/app/core/office/word-settings.ts';
import { applyStyleSet, applyWordTheme, WORD_THEMES } from '../src/app/core/office/word-theme.ts';
import { synonymsFor } from '../src/app/core/office/word-thesaurus.ts';
import { restoreWord, snapshotWord } from '../src/app/core/office/word-history.ts';
import { applyParagraphFormat, insertBlankPage, insertPageBreak, parseNumbering, setParagraphBorders, sortBodyParagraphs, toggleParagraphBorders } from '../src/app/core/office/word-format.ts';
import { applyRunFormat, clearRunFormat, paragraphPlainText, replaceParagraphRange } from '../src/app/core/office/word-runs.ts';
import { applyCellStyle, cellDisplayValue, clearFreezePane, parseCellStyleMap, setFreezePane, stylesheetSummary } from '../src/app/core/office/excel-format.ts';
import { findInSheet, sortSheet, sortSheetKeys, visibleRows } from '../src/app/core/office/excel-sort.ts';
import {
  autoSum, clearCell, deleteCells, deleteColumn, deleteRow, insertCells, insertColumn, insertRow,
  mergeAndCenter, mergeRange, unmergeRange,
} from '../src/app/core/office/excel-edit.ts';
import {
  addDefinedName, parseDefinedNames, removeDefinedName, setSheetProtection, setWorkbookProtection,
  workbookProtected,
} from '../src/app/core/office/excel-names.ts';
import { parseSheetComments, writeSheetComments } from '../src/app/core/office/excel-comments.ts';
import { deleteNote, ensureNote, setNoteNumbering } from '../src/app/core/office/word-notes.ts';
import {
  addCitationSource, apaBibliography, insertBibliography, insertCitation, parseCitationSources,
} from '../src/app/core/office/word-citations.ts';
import {
  addBookmark, insertCrossReference, insertToc, parseBookmarks, removeToc, syncTocPageNumbers, tocEntries,
} from '../src/app/core/office/word-toc.ts';
import { acceptedText, paragraphHasRevision, paragraphSegments, setAcceptedText } from '../src/app/core/office/word-markup.ts';
import {
  parseExcelAnalysis, saveAnalysis, upsertChart, upsertPivot,
} from '../src/app/core/office/xlsx-analysis.ts';
import { deleteEquation, insertEquation, parseEquations } from '../src/app/core/office/word-equation.ts';
import { addInkStroke, clearInk, parseInkStrokes } from '../src/app/core/office/word-ink.ts';
import { paginateBlocks, sliceCellParagraphs } from '../src/app/core/office/word-paginate.ts';
import type { CellContent } from '../src/app/core/office/word-table-flow.ts';
import { buildCellLines, flowRow, newCellState } from '../src/app/core/office/word-table-flow.ts';
import { wrapTextLines } from '../src/app/core/office/word-text-metrics.ts';
import {
  checkMergeErrors, emptyMailMergeState, finishMerge, insertMergeField, insertMergeRule, parseMergeRows,
  type MailMergeState,
} from '../src/app/core/office/word-mailmerge.ts';
import {
  clearGeneratedIndex, hasGeneratedIndex, insertIndex, markIndexEntry, parseIndexEntries,
} from '../src/app/core/office/word-index.ts';
import {
  ensureFloating, groupFloatingRuns, setFloatPosition, setFloatRotation, setFloatWrap, ungroupFloatingRun,
} from '../src/app/core/office/word-arrange.ts';

const enc = new TextEncoder();
const text = (value: string) => enc.encode(value);
const toBuffer = (bytes: Uint8Array) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}${detail ? '  ' + detail : ''}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? '  ' + detail : ''}`);
  }
}

async function expectError(name: string, code: string, action: () => Promise<unknown> | unknown): Promise<void> {
  try {
    await action();
    check(name, false, 'no error');
  } catch (error) {
    const actual = error instanceof OfficeBinaryError ? error.code : String(error);
    check(name, actual === code, `code=${actual}`);
  }
}

async function main(): Promise<void> {
  check('crc32 vector', crc32(text('123456789')) === 0xcbf43926, crc32(text('123456789')).toString(16));

  const archive = await writeZip([
    { name: 'hello.txt', data: text('xin chào '.repeat(80)) },
    { name: 'empty.txt', data: new Uint8Array() },
  ]);
  check('zip magic', detectFileKind(archive) === 'ZIP');
  const roundTrip = await readZip(archive);
  check('zip deflate round-trip', new TextDecoder().decode(roundTrip.entries.get('hello.txt')) === 'xin chào '.repeat(80));

  await expectError('xml doctype blocked', 'OFFICE_XML_UNSAFE', () => parseXml('<!DOCTYPE x [<!ENTITY y "z">]><x/>'));

  const docx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types/>') },
    {
      name: 'word/document.xml',
      data: text(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>Xin chào</w:t></w:r><w:r><w:t> thế giới</w:t></w:r></w:p>
<w:p><w:r><w:t>Đoạn tiếng Việt: ă â ê ô ơ ư đ</w:t></w:r></w:p>
<w:tbl><w:tr><w:tc><w:p><w:r><w:t>A1</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B1</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
<w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr>
</w:body></w:document>`),
    },
  ]);
  const word = await parseDocx(docx);
  check('docx paragraphs', word.blocks.length >= 3, `blocks=${word.blocks.length}`);
  check('docx heading', word.blocks[0].kind === 'paragraph' && word.blocks[0].paragraph.headingLevel === 1);
  check('docx bold', word.blocks[0].kind === 'paragraph' && word.blocks[0].paragraph.runs[0].bold === true);
  check('docx table', word.blocks.some((block) => block.kind === 'table'));
  check('docx page size', word.pageSize.width === 816 && word.pageSize.height === 1056, JSON.stringify(word.pageSize));
  check('docx word count', word.wordCount >= 8, `words=${word.wordCount}`);

  const xlsx = await writeZip([
    { name: 'xl/workbook.xml', data: text('<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>') },
    { name: 'xl/_rels/workbook.xml.rels', data: text('<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="worksheet"/></Relationships>') },
    { name: 'xl/sharedStrings.xml', data: text('<?xml version="1.0"?><sst><si><t>Doanh thu</t></si><si><t>Chi phí</t></si></sst>') },
    { name: 'xl/worksheets/sheet1.xml', data: text('<?xml version="1.0"?><worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1"><v>100</v></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="B2"><f>SUM(B1:B1)</f><v>100</v></c></row></sheetData><mergeCells><mergeCell ref="A3:B3"/></mergeCells></worksheet>') },
  ]);
  const excel = await parseXlsx(xlsx);
  check('xlsx sheet', excel.sheets.length === 1 && excel.sheets[0].name === 'Sheet1');
  check('xlsx shared string', excel.sheets[0].cells.get('A1')?.value === 'Doanh thu');
  check('xlsx number', excel.sheets[0].cells.get('B1')?.value === '100');
  check('xlsx formula', excel.sheets[0].cells.get('B2')?.formula === '=SUM(B1:B1)');
  check('xlsx merge', excel.sheets[0].merges[0] === 'A3:B3');

  /* ------------------- Excel styles / sort / filter / freeze -------------- */
  const formattedXlsx = await writeZip([
    { name: 'xl/workbook.xml', data: text('<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>') },
    { name: 'xl/_rels/workbook.xml.rels', data: text('<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml" Type="worksheet"/></Relationships>') },
    { name: 'xl/styles.xml', data: text('<?xml version="1.0"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.00%"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><color rgb="FFFF0000"/><name val="Arial"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border></borders><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="1" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf></cellXfs></styleSheet>') },
    { name: 'xl/worksheets/sheet1.xml', data: text('<?xml version="1.0"?><worksheet><sheetViews><sheetView workbookViewId="0"/></sheetViews><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Tên</t></is></c><c r="B1" t="inlineStr"><is><t>Điểm</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>An</t></is></c><c r="B2"><v>30</v></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>Bình</t></is></c><c r="B3" s="1"><v>0.5</v></c></row><row r="4"><c r="A4" t="inlineStr"><is><t>Chi</t></is></c><c r="B4"><v>20</v></c></row></sheetData></worksheet>') },
  ]);
  const styleDoc = await parseXlsx(formattedXlsx);
  const styleSheet = styleDoc.sheets[0];
  const styledCell = styleSheet.cells.get('B3');
  check('excel cell style parse', styledCell?.style?.bold === true && styledCell.style.italic !== true
    && styledCell.style.font === 'Arial' && styledCell.style.sizePt === 14
    && styledCell.style.color === '#FF0000' && styledCell.style.fill === '#FFFF00'
    && styledCell.style.border === true && styledCell.style.align === 'center'
    && styledCell.style.numberFormat === '0.00%',
    JSON.stringify(styledCell?.style));
  check('excel number format display', cellDisplayValue(styledCell!) === '50.00%', cellDisplayValue(styledCell!));
  const styleMap = parseCellStyleMap(styleDoc.packageEntries ?? new Map());
  check('excel style map', styleMap.get(1)?.bold === true && styleMap.get(0)?.font === 'Calibri');

  const appliedStyle = applyCellStyle(styleDoc, styleSheet, 'A2', {
    bold: true, italic: true, underline: false, doubleUnderline: true, strike: true,
    font: 'Times New Roman', sizePt: 12,
    color: '#0000FF', fill: '#00FF00', border: true, align: 'right', numberFormat: '#,##0.00',
  });
  check('excel cell style apply', appliedStyle?.bold === true && appliedStyle.fill === '#00FF00'
    && appliedStyle.align === 'right' && appliedStyle.numberFormat === '#,##0.00'
    && appliedStyle.strike === true && appliedStyle.doubleUnderline === true,
    JSON.stringify(appliedStyle));
  const styleSaved = await parseXlsx(await saveXlsx(styleDoc, toBuffer(formattedXlsx)));
  const savedStyleCell = styleSaved.sheets[0].cells.get('A2');
  check('excel cell style round-trip', savedStyleCell?.style?.bold === true && savedStyleCell.style.italic === true
    && savedStyleCell.style.doubleUnderline === true && savedStyleCell.style.strike === true
    && savedStyleCell.style.font === 'Times New Roman'
    && savedStyleCell.style.sizePt === 12 && savedStyleCell.style.fill === '#00FF00'
    && savedStyleCell.style.border === true && savedStyleCell.style.align === 'right'
    && savedStyleCell.style.numberFormat === '#,##0.00',
    JSON.stringify(savedStyleCell?.style));
  const styleCounts = stylesheetSummary(styleSaved.packageEntries ?? new Map());
  check('excel styles.xml written', styleCounts.fonts >= 3 && styleCounts.fills >= 4
    && styleCounts.borders >= 2 && styleCounts.xfs >= 3, JSON.stringify(styleCounts));

  const freezeDoc = await parseXlsx(formattedXlsx);
  setFreezePane(freezeDoc.sheets[0], 1, 1);
  const freezeSaved = await parseXlsx(await saveXlsx(freezeDoc, toBuffer(formattedXlsx)));
  check('excel freeze pane round-trip', freezeSaved.sheets[0].freeze?.row === 1
    && freezeSaved.sheets[0].freeze?.col === 1
    && descendants(freezeSaved.sheets[0].xmlRoot!, 'pane')[0]?.attrs['topLeftCell'] === 'B2',
    JSON.stringify(freezeSaved.sheets[0].freeze));
  clearFreezePane(freezeDoc.sheets[0]);
  check('excel unfreeze', freezeDoc.sheets[0].freeze === undefined
    && descendants(freezeDoc.sheets[0].xmlRoot!, 'pane').length === 0);

  const sortDoc = await parseXlsx(formattedXlsx);
  const sortSheetRef = sortDoc.sheets[0];
  const sortOk = sortSheet(sortSheetRef, 2, true);
  check('excel sort asc', sortOk && sortSheetRef.cells.get('A2')?.value === 'Bình'
    && sortSheetRef.cells.get('A3')?.value === 'Chi' && sortSheetRef.cells.get('A4')?.value === 'An',
    JSON.stringify([sortSheetRef.cells.get('A2')?.value, sortSheetRef.cells.get('A3')?.value, sortSheetRef.cells.get('A4')?.value]));
  const sortSaved = await parseXlsx(await saveXlsx(sortDoc, toBuffer(formattedXlsx)));
  check('excel sort round-trip', sortSaved.sheets[0].cells.get('A2')?.value === 'Bình'
    && sortSaved.sheets[0].cells.get('A3')?.value === 'Chi'
    && sortSaved.sheets[0].cells.get('A4')?.value === 'An',
    JSON.stringify([sortSaved.sheets[0].cells.get('A2')?.value, sortSaved.sheets[0].cells.get('A3')?.value, sortSaved.sheets[0].cells.get('A4')?.value]));

  const findDoc = await parseXlsx(formattedXlsx);
  const findHits = findInSheet(findDoc.sheets[0], 'bình');
  check('excel find cell', findHits.length === 1 && findHits[0].ref === 'A3', JSON.stringify(findHits));
  const visible = visibleRows(findDoc.sheets[0], { column: 2, value: '20' });
  check('excel filter rows', visible !== null && visible.has(1) && visible.has(4) && !visible.has(2) && !visible.has(3),
    JSON.stringify([...(visible ?? [])]));

  /* ------------------ Excel insert/delete/autoSum/merge/clear ------------ */
  const shiftDoc = await parseXlsx(formattedXlsx);
  const shiftSheet = shiftDoc.sheets[0];
  insertCells(shiftSheet, 'B2', 'right');
  check('excel insert cells right', shiftSheet.cells.get('C2')?.value === '30'
    && !shiftSheet.cells.has('B2') && shiftSheet.cells.get('B3')?.value === '0.5',
    JSON.stringify([shiftSheet.cells.get('C2')?.value, shiftSheet.cells.get('B3')?.value]));
  const shiftSaved = await parseXlsx(await saveXlsx(shiftDoc, toBuffer(formattedXlsx)));
  check('excel insert cells round-trip', shiftSaved.sheets[0].cells.get('C2')?.value === '30'
    && !shiftSaved.sheets[0].cells.has('B2'),
    JSON.stringify(shiftSaved.sheets[0].cells.get('C2')?.value));

  const rowDoc = await parseXlsx(formattedXlsx);
  const rowSheet = rowDoc.sheets[0];
  insertRow(rowSheet, 2);
  check('excel insert row', rowSheet.cells.get('A3')?.value === 'An' && !rowSheet.cells.has('A2'));
  insertColumn(rowSheet, 2);
  check('excel insert column', rowSheet.cells.get('A3')?.value === 'An' && rowSheet.cells.get('C3')?.value === '30');

  const deleteDoc = await parseXlsx(formattedXlsx);
  const deleteSheet = deleteDoc.sheets[0];
  deleteCells(deleteSheet, 'B2', 'up');
  check('excel delete cells up', deleteSheet.cells.get('B2')?.value === '0.5'
    && deleteSheet.cells.get('B3')?.value === '20' && !deleteSheet.cells.has('B4'),
    JSON.stringify([deleteSheet.cells.get('B2')?.value, deleteSheet.cells.get('B3')?.value]));
  deleteRow(deleteSheet, 2);
  check('excel delete row', deleteSheet.cells.get('B2')?.value === '20' || deleteSheet.cells.get('B3') === undefined);
  deleteColumn(deleteSheet, 1);
  check('excel delete column', deleteSheet.cells.get('A2')?.value === '20' && !deleteSheet.cells.has('B2'),
    JSON.stringify([deleteSheet.cells.get('A2')?.value, deleteSheet.cells.get('B2')?.value]));

  const sumDoc = await parseXlsx(formattedXlsx);
  const sumSheet = sumDoc.sheets[0];
  const formula = autoSum(sumSheet, 'B5');
  check('excel autosum', formula === '=SUM(B2:B4)' && sumSheet.cells.get('B5')?.value === '50.5',
    JSON.stringify({ formula, value: sumSheet.cells.get('B5')?.value }));
  const sumSaved = await parseXlsx(await saveXlsx(sumDoc, toBuffer(formattedXlsx)));
  check('excel autosum round-trip', sumSaved.sheets[0].cells.get('B5')?.formula === '=SUM(B2:B4)'
    && sumSaved.sheets[0].cells.get('B5')?.value === '50.5',
    JSON.stringify(sumSaved.sheets[0].cells.get('B5')));

  const clearXlsxDoc = await parseXlsx(formattedXlsx);
  const clearXlsxSheet = clearXlsxDoc.sheets[0];
  clearCell(clearXlsxSheet, 'B2', 'contents');
  clearCell(clearXlsxSheet, 'B3', 'formats');
  clearCell(clearXlsxSheet, 'A2', 'all');
  check('excel clear variants', clearXlsxSheet.cells.get('B2')?.value === ''
    && clearXlsxSheet.cells.get('B3')?.styleIndex === undefined
    && !clearXlsxSheet.cells.has('A2'),
    JSON.stringify([clearXlsxSheet.cells.get('B2')?.value, clearXlsxSheet.cells.get('B3')?.styleIndex]));

  const mergeDoc = await parseXlsx(formattedXlsx);
  const mergeSheet = mergeDoc.sheets[0];
  const merged = mergeAndCenter(mergeDoc, mergeSheet, 'A2:C2');
  check('excel merge center', merged && mergeSheet.merges.includes('A2:C2')
    && mergeSheet.cells.get('A2')?.style?.align === 'center'
    && descendants(mergeSheet.xmlRoot!, 'mergeCell').some((node) => node.attrs['ref'] === 'A2:C2'),
    JSON.stringify(mergeSheet.merges));
  check('excel unmerge', unmergeRange(mergeSheet, 'A2:C2') && !mergeSheet.merges.includes('A2:C2'));

  const wrapDoc = await parseXlsx(formattedXlsx);
  const wrapSheet = wrapDoc.sheets[0];
  applyCellStyle(wrapDoc, wrapSheet, 'A2', { wrapText: true, indent: 2, verticalAlign: 'middle', rotation: 45 });
  const wrapSaved = await parseXlsx(await saveXlsx(wrapDoc, toBuffer(formattedXlsx)));
  check('excel wrap/indent/valign round-trip', wrapSaved.sheets[0].cells.get('A2')?.style?.wrapText === true
    && wrapSaved.sheets[0].cells.get('A2')?.style?.indent === 2
    && wrapSaved.sheets[0].cells.get('A2')?.style?.verticalAlign === 'middle'
    && wrapSaved.sheets[0].cells.get('A2')?.style?.rotation === 45,
    JSON.stringify(wrapSaved.sheets[0].cells.get('A2')?.style));

  const multiSortDoc = await parseXlsx(formattedXlsx);
  const multiSheet = multiSortDoc.sheets[0];
  multiSheet.cells.get('B2')!.value = '20';
  multiSheet.cells.get('B3')!.value = '10';
  multiSheet.cells.get('B4')!.value = '20';
  const multiOk = sortSheetKeys(multiSheet, [{ column: 2, ascending: true }, { column: 1, ascending: true }]);
  check('excel custom sort 2 keys', multiOk
    && multiSheet.cells.get('A2')?.value === 'Bình'
    && multiSheet.cells.get('A3')?.value === 'An'
    && multiSheet.cells.get('A4')?.value === 'Chi',
    JSON.stringify([multiSheet.cells.get('A2')?.value, multiSheet.cells.get('A3')?.value, multiSheet.cells.get('A4')?.value]));

  /* --------------- Excel CF manage / names / protection / comments -------- */
  const cfManageDoc = await parseXlsx(formattedXlsx);
  const cfManageSheet = cfManageDoc.sheets[0];
  addConditionalRule(cfManageSheet, { range: 'B2:B4', type: 'cellIs', operator: 'greaterThan', value: '10' });
  addConditionalRule(cfManageSheet, { range: 'A2:A4', type: 'containsText', text: 'An' });
  check('excel cf create two rules', parseConditionalRules(cfManageSheet).length === 2);
  check('excel cf remove one', removeConditionalRule(cfManageSheet, 0) && parseConditionalRules(cfManageSheet).length === 1);
  check('excel cf clear all', clearConditionalRules(cfManageSheet) === 1
    && parseConditionalRules(cfManageSheet).length === 0
    && !descendants(cfManageSheet.xmlRoot!, 'conditionalFormatting').length);

  const nameDoc = await parseXlsx(formattedXlsx);
  check('excel defined name add', addDefinedName(nameDoc, 'Scores', 'Data!$B$2:$B$4', 0)
    && parseDefinedNames(nameDoc).some((name) => name.name === 'Scores' && name.formula === 'Data!$B$2:$B$4'));
  const nameSaved = await parseXlsx(await saveXlsx(nameDoc, toBuffer(formattedXlsx)));
  check('excel defined name round-trip', parseDefinedNames(nameSaved).some((name) => name.name === 'Scores'
    && name.formula === 'Data!$B$2:$B$4'), JSON.stringify(parseDefinedNames(nameSaved)));
  check('excel defined name remove', removeDefinedName(nameSaved, 'Scores') && parseDefinedNames(nameSaved).length === 0);

  const protectionDoc = await parseXlsx(formattedXlsx);
  setSheetProtection(protectionDoc.sheets[0], true);
  setWorkbookProtection(protectionDoc, true);
  check('excel protection set', protectionDoc.sheets[0].protected === true && workbookProtected(protectionDoc));
  const protectionSaved = await parseXlsx(await saveXlsx(protectionDoc, toBuffer(formattedXlsx)));
  check('excel protection round-trip', protectionSaved.sheets[0].protected === true && workbookProtected(protectionSaved)
    && descendants(protectionSaved.sheets[0].xmlRoot!, 'sheetProtection').length === 1,
    JSON.stringify({ sheet: protectionSaved.sheets[0].protected, workbook: workbookProtected(protectionSaved) }));

  const commentDoc = await parseXlsx(formattedXlsx);
  const commentSheet = commentDoc.sheets[0];
  commentSheet.comments = new Map([
    ['A2', { ref: 'A2', author: 'QA', text: 'Ghi chú An' }],
    ['B3', { ref: 'B3', author: 'QA', text: 'Ghi chú Bình' }],
  ]);
  writeSheetComments(commentDoc.packageEntries ?? new Map(), commentSheet);
  const commentRels = new TextDecoder().decode(commentDoc.packageEntries?.get('xl/worksheets/_rels/sheet1.xml.rels'));
  check('excel comments parts', (commentDoc.packageEntries?.get('xl/comments1.xml')?.length ?? 0) > 0
    && (commentDoc.packageEntries?.get('xl/drawings/vmlDrawing1.vml')?.length ?? 0) > 0
    && commentRels.includes('comments1.xml') && commentRels.includes('vmlDrawing1.vml')
    && descendants(commentSheet.xmlRoot!, 'legacyDrawing').length === 1);
  const commentSaved = await parseXlsx(await saveXlsx(commentDoc, toBuffer(formattedXlsx)));
  check('excel comments round-trip', commentSaved.sheets[0].comments?.get('A2')?.text === 'Ghi chú An'
    && commentSaved.sheets[0].comments?.get('B3')?.author === 'QA',
    JSON.stringify([...(commentSaved.sheets[0].comments?.values() ?? [])]));
  const commentParsed = parseSheetComments(commentSaved.packageEntries ?? new Map(), 'xl/worksheets/sheet1.xml');
  check('excel comments parse helper', commentParsed.size === 2 && commentParsed.get('A2')?.text === 'Ghi chú An');

  const currencyDoc = await parseXlsx(formattedXlsx);
  applyCellStyle(currencyDoc, currencyDoc.sheets[0], 'B2', { numberFormat: '#,##0 "₫"' });
  check('excel accounting format display', cellDisplayValue(currencyDoc.sheets[0].cells.get('B2')!) === '30 ₫',
    cellDisplayValue(currencyDoc.sheets[0].cells.get('B2')!));

  const pptx = await writeZip([
    { name: 'ppt/presentation.xml', data: text('<?xml version="1.0"?><p:presentation xmlns:p="p" xmlns:r="r"><p:sldSz cx="12192000" cy="6858000"/><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>') },
    { name: 'ppt/_rels/presentation.xml.rels', data: text('<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="slides/slide1.xml" Type="slide"/></Relationships>') },
    { name: 'ppt/slides/slide1.xml', data: text('<?xml version="1.0"?><p:sld xmlns:p="p" xmlns:a="a"><p:cSld><p:spTree><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="914400"/><a:ext cx="7315200" cy="1828800"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:rPr sz="4000" b="1"/><a:t>Báo cáo Sprint 12</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>') },
  ]);
  const ppt = await parsePptx(pptx);
  check('pptx slide size', ppt.width === 1280 && ppt.height === 720, `${ppt.width}x${ppt.height}`);
  check('pptx slide count', ppt.slides.length === 1);
  check('pptx shape text', ppt.slides[0].shapes[0]?.text === 'Báo cáo Sprint 12');
  check('pptx shape geometry', ppt.slides[0].shapes[0]?.x === 96 && ppt.slides[0].shapes[0]?.width === 768);

  const csv = parseCsv(text('Tên;Số tiền\nDoanh thu;100\n"Chi phí, khác";50'));
  check('csv delimiter', csv.sheets[0].cells.get('A1')?.value === 'Tên');
  check('csv quoted comma', csv.sheets[0].cells.get('A3')?.value === 'Chi phí, khác');

  const wordParagraph = word.blocks[0];
  if (wordParagraph.kind === 'paragraph' && wordParagraph.paragraph.xmlNode) {
    const textNode = descendants(wordParagraph.paragraph.xmlNode, 'w:t')[0];
    if (textNode) textNode.text = 'Đã sửa bằng trình soạn thảo';
    const saved = await saveDocx(word, toBuffer(docx));
    const reopened = await parseDocx(saved);
    const first = reopened.blocks[0];
    const savedText = first.kind === 'paragraph' ? first.paragraph.runs.map((run) => run.text).join('') : '';
    check('docx edit + save', savedText.includes('Đã sửa'), savedText);
    const savedTypes = new TextDecoder().decode((await readZip(saved)).entries.get('[Content_Types].xml'));
    check('docx save content types', savedTypes.includes('Extension="xml"')
      && savedTypes.includes('PartName="/word/document.xml"'), savedTypes.slice(0, 160));
  } else {
    check('docx edit + save', false, 'missing paragraph node');
  }

  const sheet = excel.sheets[0];
  const cell = sheet.cells.get('B1');
  if (cell?.xmlNode) {
    cell.value = '250';
    const valueNode = descendants(cell.xmlNode, 'v')[0];
    if (valueNode) valueNode.text = '250';
    const saved = await saveXlsx(excel, toBuffer(xlsx));
    const reopened = await parseXlsx(saved);
    check('xlsx edit + save', reopened.sheets[0].cells.get('B1')?.value === '250');
  } else {
    check('xlsx edit + save', false, 'missing cell node');
  }
  check('formula SUM', evaluateFormula(sheet, '=SUM(B1:B2)') === '350', evaluateFormula(sheet, '=SUM(B1:B2)'));
  check('formula arithmetic', evaluateFormula(sheet, '=B1*2+10') === '510', evaluateFormula(sheet, '=B1*2+10'));

  const shape = ppt.slides[0].shapes[0];
  if (shape?.textNode) {
    shape.text = 'Slide đã sửa';
    shape.textNode.text = 'Slide đã sửa';
    const saved = await savePptx(ppt, toBuffer(pptx));
    const reopened = await parsePptx(saved);
    check('pptx edit + save', reopened.slides[0].shapes[0]?.text === 'Slide đã sửa');
  } else {
    check('pptx edit + save', false, 'missing text node');
  }

  await expectError('encrypted docx blocked', 'OFFICE_ENCRYPTED_FILE_UNSUPPORTED', () => {
    assertExtensionMatches('docx', 'OLE2');
    return Promise.resolve();
  });

  /* ------------------------- formula catalogue ------------------------- */
  const book = makeSheet([
    ['A1', '10'], ['A2', '20'], ['A3', '30'], ['A4', '40'],
    ['B1', 'Việt Nam'], ['B2', 'Lào'], ['B3', 'Việt Nam'], ['B4', 'Campuchia'],
    ['C1', '2'], ['C2', '5'], ['C3', '8'], ['C4', '9'],
    ['D1', 'SEOUL'], ['D2', 'hanoi'], ['D3', 'Bangkok'],
  ]);
  check('formula catalogue >= 100', catalogueSize() >= 100, `size=${catalogueSize()}`);
  check('formula AVERAGE', evaluateFormula(book, '=AVERAGE(A1:A4)') === '25', evaluateFormula(book, '=AVERAGE(A1:A4)'));
  check('formula MEDIAN', evaluateFormula(book, '=MEDIAN(A1:A4)') === '25', evaluateFormula(book, '=MEDIAN(A1:A4)'));
  check('formula MIN/MAX', evaluateFormula(book, '=MIN(A1:A4)') === '10' && evaluateFormula(book, '=MAX(A1:A4)') === '40');
  check('formula COUNT', evaluateFormula(book, '=COUNT(A1:A4)') === '4');
  check('formula ROUND', evaluateFormula(book, '=ROUND(12.345,2)') === '12.35', evaluateFormula(book, '=ROUND(12.345,2)'));
  check('formula POWER/SQRT', evaluateFormula(book, '=POWER(2,10)') === '1024' && evaluateFormula(book, '=SQRT(144)') === '12');
  check('formula MOD', evaluateFormula(book, '=MOD(10,3)') === '1', evaluateFormula(book, '=MOD(10,3)'));
  check('formula IF/AND', evaluateFormula(book, '=IF(AND(A1>5,A2>5),"yes","no")') === 'yes', evaluateFormula(book, '=IF(AND(A1>5,A2>5),"yes","no")'));
  check('formula COUNTIF', evaluateFormula(book, '=COUNTIF(B1:B4,"Việt Nam")') === '2', evaluateFormula(book, '=COUNTIF(B1:B4,"Việt Nam")'));
  check('formula SUMIF', evaluateFormula(book, '=SUMIF(B1:B4,"Việt Nam",A1:A4)') === '40', evaluateFormula(book, '=SUMIF(B1:B4,"Việt Nam",A1:A4)'));
  check('formula SUMIFS', evaluateFormula(book, '=SUMIFS(A1:A4,B1:B4,"Việt Nam",C1:C4,">3")') === '30', evaluateFormula(book, '=SUMIFS(A1:A4,B1:B4,"Việt Nam",C1:C4,">3")'));
  check('formula VLOOKUP', evaluateFormula(book, '=VLOOKUP("Lào",B1:C4,2,FALSE)') === '5', evaluateFormula(book, '=VLOOKUP("Lào",B1:C4,2,FALSE)'));
  check('formula INDEX/MATCH', evaluateFormula(book, '=INDEX(A1:A4,MATCH("Lào",B1:B4,0))') === '20', evaluateFormula(book, '=INDEX(A1:A4,MATCH("Lào",B1:B4,0))'));
  check('formula XLOOKUP', evaluateFormula(book, '=XLOOKUP("Campuchia",B1:B4,A1:A4,"none")') === '40', evaluateFormula(book, '=XLOOKUP("Campuchia",B1:B4,A1:A4,"none")'));
  check('formula LEFT/RIGHT/MID', evaluateFormula(book, '=LEFT("OpenERP",4)') === 'Open' && evaluateFormula(book, '=RIGHT("OpenERP",3)') === 'ERP' && evaluateFormula(book, '=MID("OpenERP",5,2)') === 'ER');
  check('formula UPPER/PROPER', evaluateFormula(book, '=UPPER("việt nam")') === 'VIỆT NAM' && evaluateFormula(book, '=PROPER("open erp")') === 'Open Erp');
  check('formula TEXT', evaluateFormula(book, '=TEXT(1234.5,"0.00")') === '1234.50', evaluateFormula(book, '=TEXT(1234.5,"0.00")'));
  check('formula PMT', Math.abs(Number(evaluateFormula(book, '=PMT(0.1/12,12*30,-1000000)')) - 8775.71) < 1, evaluateFormula(book, '=PMT(0.1/12,12*30,-1000000)'));
  check('formula error propagate', evaluateFormula(book, '=SUM(ABS(1/0))') === '#DIV/0!', evaluateFormula(book, '=SUM(ABS(1/0))'));
  check('formula circular error', evaluateFormula(book, '=NOTHING(1)') === '#NAME?');

  /* ----------------------- dependency recalculation --------------------- */
  const chain = makeSheet([['A1', '1'], ['B1', '', 'A1*2'], ['C1', '', 'B1+5'], ['D1', '', 'SUM(B1:C1)']]);
  recalculateSheet(chain);
  check('recalc chain', chain.cells.get('B1')?.value === '2' && chain.cells.get('C1')?.value === '7' && chain.cells.get('D1')?.value === '9',
    `${chain.cells.get('B1')?.value}/${chain.cells.get('C1')?.value}/${chain.cells.get('D1')?.value}`);
  const value = chain.cells.get('A1')!;
  value.value = '3';
  recalculateSheet(chain);
  check('recalc propagates change', chain.cells.get('B1')?.value === '6' && chain.cells.get('C1')?.value === '11' && chain.cells.get('D1')?.value === '17',
    `${chain.cells.get('B1')?.value}/${chain.cells.get('C1')?.value}/${chain.cells.get('D1')?.value}`);
  const circular = makeSheet([['A1', '', 'B1'], ['B1', '', 'A1']]);
  recalculateSheet(circular);
  check('recalc circular detected',
    circular.cells.get('A1')?.value === '#CIRCULAR!' || circular.cells.get('B1')?.value === '#CIRCULAR!',
    `${circular.cells.get('A1')?.value}/${circular.cells.get('B1')?.value}`);

  /* ------------------------------- pivot -------------------------------- */
  const sales = makeSheet([
    ['A1', 'Khu vực'], ['B1', 'Quý'], ['C1', 'Doanh thu'],
    ['A2', 'Bắc'], ['B2', 'Q1'], ['C2', '100'],
    ['A3', 'Bắc'], ['B3', 'Q2'], ['C3', '150'],
    ['A4', 'Nam'], ['B4', 'Q1'], ['C4', '80'],
    ['A5', 'Nam'], ['B5', 'Q2'], ['C5', '120'],
  ]);
  const pivot = buildPivot(sales, {
    source: 'A1:C5',
    rowField: { column: 1 },
    columnField: { column: 2 },
    values: [{ column: 3, aggregate: 'SUM', header: 'Doanh thu' }],
  });
  check('pivot row keys', pivot.rowKeys.join(',') === 'Bắc,Nam' && pivot.columnKeys.join(',') === 'Q1,Q2', `${pivot.rowKeys}/${pivot.columnKeys}`);
  check('pivot cells', pivot.cells[0]?.[0]?.[0] === 100 && pivot.cells[0]?.[1]?.[0] === 150 && pivot.cells[1]?.[0]?.[0] === 80 && pivot.cells[1]?.[1]?.[0] === 120,
    JSON.stringify(pivot.cells));
  check('pivot totals', pivot.rowTotals[0]?.[0] === 250 && pivot.rowTotals[1]?.[0] === 200 && pivot.grandTotals[0] === 450,
    `${pivot.rowTotals?.[0]?.[0]}/${pivot.rowTotals?.[1]?.[0]}/${pivot.grandTotals[0]}`);
  const pivotAvg = buildPivot(sales, {
    source: 'A1:C5', rowField: { column: 1 }, values: [{ column: 3, aggregate: 'AVERAGE' }],
  });
  check('pivot average aggregate', pivotAvg.cells[0]?.[0]?.[0] === 125 && pivotAvg.grandTotals[0] === 112.5,
    `${pivotAvg.cells[0]?.[0]?.[0]}/${pivotAvg.grandTotals[0]}`);
  check('pivot invalid source', buildPivot(sales, { source: 'bad', rowField: { column: 1 }, values: [{ column: 3, aggregate: 'SUM' }] }).error === 'PIVOT_SOURCE_INVALID');

  /* ------------------------------- chart -------------------------------- */
  const chartData = makeSheet([['A1', 'Q1'], ['A2', 'Q2'], ['A3', 'Q3'], ['B1', '10'], ['B2', '25'], ['B3', '15']]);
  const chart = buildChartModel(chartData, {
    type: 'column', categories: 'A1:A3', series: [{ range: 'B1:B3', label: 'Doanh thu' }], title: 'Quý',
  });
  const layout = layoutChart(chart, 480, 280);
  check('chart model', chart.categories.length === 3 && chart.series[0].values.join(',') === '10,25,15', JSON.stringify(chart.series[0].values));
  check('chart bars + scale', layout.bars.length === 3 && layout.bars[1].y < layout.bars[0].y && layout.ticksY.length === 5);
  const pie = layoutChart(buildChartModel(chartData, { type: 'pie', categories: 'A1:A3', series: [{ range: 'B1:B3' }] }), 300, 200);
  check('chart pie slices', pie.slices.length === 3 && pie.slices.every((slice) => slice.path.startsWith('M')), `slices=${pie.slices.length}`);
  const line = layoutChart(buildChartModel(chartData, { type: 'line', categories: 'A1:A3', series: [{ range: 'B1:B3' }] }), 480, 280);
  check('chart line points', line.lines[0]?.length === 3 && line.bars.length === 0);

  /* ---------------------- conditional formatting ----------------------- */
  const cfSheet = makeSheet([['B2', '150'], ['B3', '50'], ['B4', '220']]);
  cfSheet.xmlRoot = {
    name: 'worksheet', attrs: {}, text: '',
    children: [{
      name: 'conditionalFormatting', attrs: { sqref: 'B2:B10' }, text: '',
      children: [
        { name: 'cfRule', attrs: { type: 'cellIs', operator: 'greaterThan' }, text: '', children: [
          { name: 'formula', attrs: {}, text: '100', children: [] },
        ] },
        { name: 'cfRule', attrs: { type: 'dataBar' }, text: '', children: [] },
      ],
    }],
  };
  const cfRules = parseConditionalRules(cfSheet);
  check('conditional parse', cfRules.length === 2 && cfRules[0].operator === 'greaterThan', `rules=${cfRules.length}`);
  const highStyle = styleFor(cfRules, 'B4', 220, cfSheet);
  const lowStyle = styleFor(cfRules, 'B3', 50, cfSheet);
  check('conditional cellIs style', highStyle.background === '#ffc7ce' && highStyle.color === '#9c0006', JSON.stringify(highStyle));
  check('conditional data bar', lowStyle.barColor !== undefined && typeof lowStyle.barRatio === 'number', JSON.stringify(lowStyle));

  /* -------------------------- data validation -------------------------- */
  const dvSheet = makeSheet([['A1', 'Country']]);
  dvSheet.xmlRoot = {
    name: 'worksheet', attrs: {}, text: '',
    children: [{
      name: 'dataValidations', attrs: {}, text: '',
      children: [
        { name: 'dataValidation', attrs: { type: 'list', sqref: 'A2:A5', allowBlank: '0', showErrorMessage: '1' }, text: '', children: [
          { name: 'formula1', attrs: {}, text: '"Việt Nam,Lào,Campuchia"', children: [] },
        ] },
        { name: 'dataValidation', attrs: { type: 'whole', operator: 'between', sqref: 'C2:C5', allowBlank: '1' }, text: '', children: [
          { name: 'formula1', attrs: {}, text: '1', children: [] },
          { name: 'formula2', attrs: {}, text: '10', children: [] },
        ] },
      ],
    }],
  };
  const dvRules = parseValidations(dvSheet);
  check('validation parse', dvRules.length === 2 && dvRules[0].formula1 === '"Việt Nam,Lào,Campuchia"', JSON.stringify(dvRules[0]));
  check('validation list ok', validate(dvRules[0], 'Lào').valid);
  const badList = validate(dvRules[0], 'Thái Lan');
  check('validation list reject', !badList.valid && badList.code === 'VALIDATION_LIST', JSON.stringify(badList));
  check('validation whole between', validate(dvRules[1], '7').valid && !validate(dvRules[1], '11').valid);
  check('validation decimal reject', !validate({ ...dvRules[1], type: 'decimal' }, 'x').valid);

  /* ------------------------- Word comments round-trip ------------------- */
  const commented = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types/>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships></Relationships>') },
    {
      name: 'word/document.xml',
      data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:commentRangeStart w:id="0"/><w:r><w:t>Đoạn có bình luận</w:t></w:r><w:commentRangeEnd w:id="0"/><w:r><w:commentReference w:id="0"/></w:r></w:p><w:p><w:r><w:t>Đoạn thường</w:t></w:r></w:p></w:body></w:document>'),
    },
    {
      name: 'word/comments.xml',
      data: text('<?xml version="1.0"?><w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:comment w:id="0" w:author="Alice" w:initials="AL" w:date="2026-11-16T00:00:00Z"><w:p><w:r><w:t>Bình luận gốc</w:t></w:r></w:p></w:comment></w:comments>'),
    },
  ]);
  const commentedDoc = await parseDocx(commented);
  const parsedComments = commentedDoc.comments ?? [];
  check('comment parse existing', parsedComments.length === 1 && parsedComments[0].text === 'Bình luận gốc'
    && parsedComments[0].author === 'Alice' && parsedComments[0].paragraphIndex === 0,
    JSON.stringify(parsedComments));
  const createdComment = createComment(parsedComments, {
    author: 'Bob', initials: 'BB', text: 'Bình luận mới', paragraphIndex: 1,
  }, new Date('2026-11-16T03:00:00Z'));
  applyCommentAnchor(commentedDoc, createdComment);
  check('comment create + anchor', createdComment.id === 1
    && descendants(commentedDoc.blocks[1].kind === 'paragraph' ? commentedDoc.blocks[1].paragraph.xmlNode! : commentedDoc.xmlRoot!, 'w:commentRangeStart').some((node) => node.attrs['w:id'] === '1'));
  const reply = replyToComment(parsedComments, createdComment, { author: 'Alice', initials: 'AL', text: 'Đồng ý' });
  setResolved(parsedComments, createdComment.id, true);
  const extendedXml = buildCommentsExtendedXml(parsedComments);
  check('comment reply + resolve', reply.parentId === createdComment.id && reply.resolved
    && extendedXml.includes('w15:done="1"') && extendedXml.includes('w15:paraIdParent'), extendedXml.slice(0, 220));
  check('comment thread model', threadOf(parsedComments).length === 2
    && threadOf(parsedComments)[1].replies.length === 1);

  const commentedSaved = await saveDocx(commentedDoc, toBuffer(commented));
  const commentedReopened = await parseDocx(commentedSaved);
  check('comment save round-trip', (commentedReopened.comments ?? []).length === 3
    && (commentedReopened.comments ?? []).some((comment) => comment.id === createdComment.id && comment.author === 'Bob'),
    JSON.stringify((commentedReopened.comments ?? []).map((item) => `${item.id}:${item.author}`)));

  const removedIds = deleteThread(commentedReopened.comments!, createdComment.id);
  removeCommentAnchors(commentedReopened, removedIds);
  const afterDelete = await parseDocx(await saveDocx(commentedReopened, toBuffer(commentedSaved)));
  check('comment delete thread', (afterDelete.comments ?? []).length === 1
    && (afterDelete.comments ?? [])[0].id === 0
    && !descendants(afterDelete.blocks[1].kind === 'paragraph' ? afterDelete.blocks[1].paragraph.xmlNode! : afterDelete.xmlRoot!, 'w:commentRangeStart').some((node) => node.attrs['w:id'] === '1'),
    JSON.stringify((afterDelete.comments ?? []).map((item) => item.id)));

  /* ----------------------- Track changes accept/reject ------------------ */
  const revisionDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types/>') },
    {
      name: 'word/document.xml',
      data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:ins w:id="1" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:r><w:t>mới</w:t></w:r></w:ins><w:del w:id="2" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:r><w:delText>cũ</w:delText></w:r></w:del></w:p></w:body></w:document>'),
    },
  ]);
  const revisionDoc = await parseDocx(revisionDocx);
  const revisions = listRevisions(revisionDoc);
  check('track parse revisions', revisions.length === 2
    && revisions.find((item) => item.type === 'insert')?.text === 'mới'
    && revisions.find((item) => item.type === 'delete')?.text === 'cũ', JSON.stringify(revisions));
  acceptRevision(revisionDoc, 1);
  rejectRevision(revisionDoc, 2);
  const resolvedText = descendants(revisionDoc.xmlRoot!, 'w:t').map((node) => node.text).join('');
  check('track accept insert + reject delete', resolvedText.includes('mới') && resolvedText.includes('cũ'), resolvedText);

  const acceptDoc = await parseDocx(await writeZip([
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:ins w:id="1" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:r><w:t>mới</w:t></w:r></w:ins><w:del w:id="2" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:r><w:delText>cũ</w:delText></w:r></w:del></w:p></w:body></w:document>') },
  ]));
  acceptAll(acceptDoc);
  const acceptText = descendants(acceptDoc.xmlRoot!, 'w:t').map((node) => node.text).join('');
  check('track accept all', acceptText === 'mới' && listRevisions(acceptDoc).length === 0, acceptText);

  const rejectDoc = await parseDocx(await writeZip([
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:ins w:id="1" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:r><w:t>mới</w:t></w:r></w:ins><w:del w:id="2" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:r><w:delText>cũ</w:delText></w:r></w:del></w:p></w:body></w:document>') },
  ]));
  rejectAll(rejectDoc);
  const rejectText = descendants(rejectDoc.xmlRoot!, 'w:t').map((node) => node.text).join('');
  check('track reject all', rejectText === 'cũ' && listRevisions(rejectDoc).length === 0, rejectText);

  const trackedDoc = await parseDocx(await writeZip([
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Nội dung cũ</w:t></w:r></w:p></w:body></w:document>') },
  ]));
  const trackedParagraph = trackedDoc.blocks[0].kind === 'paragraph' ? trackedDoc.blocks[0].paragraph.xmlNode! : trackedDoc.xmlRoot!;
  trackEdit(trackedParagraph, 'Nội dung mới', 'Bob', '2026-11-16T04:00:00Z', 90);
  const trackedRevisions = listRevisions(trackedDoc);
  check('track edit records ins + del', trackedRevisions.length === 2
    && trackedRevisions.some((item) => item.type === 'insert' && item.text === 'Nội dung mới')
    && trackedRevisions.some((item) => item.type === 'delete' && item.text === 'Nội dung cũ'),
    JSON.stringify(trackedRevisions));
  acceptAll(trackedDoc);
  const trackedAccepted = descendants(trackedParagraph, 'w:t').map((node) => node.text).join('');
  check('track edit accept keeps new text', trackedAccepted === 'Nội dung mới', trackedAccepted);

  const pPrRevDocx = await writeZip([
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:p><w:pPr><w:jc w:val="left"/><w:pPrChange w:id="901" w:author="Alice" w:date="2026-11-16T05:00:00Z">'
      + '<w:pPr><w:jc w:val="center"/><w:ind w:left="720"/></w:pPr></w:pPrChange></w:pPr>'
      + '<w:r><w:t>Định dạng đoạn</w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const pPrRevDoc = await parseDocx(pPrRevDocx);
  const pPrRevBlock = pPrRevDoc.blocks[0];
  const pPrRevisions = listRevisions(pPrRevDoc);
  check('pPrChange parsed as format revision', pPrRevBlock.kind === 'paragraph'
    && pPrRevBlock.paragraph.align === 'left'
    && paragraphHasRevision(pPrRevBlock.paragraph)
    && pPrRevisions.length === 1 && pPrRevisions[0].type === 'format'
    && pPrRevisions[0].text === 'Định dạng đoạn',
    JSON.stringify({ align: pPrRevBlock.kind === 'paragraph' ? pPrRevBlock.paragraph.align : null, pPrRevisions }));
  check('pPrChange reject restores paragraph format', rejectRevision(pPrRevDoc, 901)
    && pPrRevBlock.kind === 'paragraph' && pPrRevBlock.paragraph.align === 'center'
    && pPrRevBlock.paragraph.indent === 720
    && listRevisions(pPrRevDoc).length === 0
    && descendants(pPrRevDoc.xmlRoot!, 'w:pPrChange').length === 0,
    JSON.stringify({ align: pPrRevBlock.kind === 'paragraph' ? pPrRevBlock.paragraph.align : null, indent: pPrRevBlock.kind === 'paragraph' ? pPrRevBlock.paragraph.indent : null }));
  const pPrRevSaved = await parseDocx(await saveDocx(pPrRevDoc, toBuffer(pPrRevDocx)));
  const pPrRevSavedBlock = pPrRevSaved.blocks[0];
  check('pPrChange reject round-trip', pPrRevSavedBlock.kind === 'paragraph'
    && pPrRevSavedBlock.paragraph.align === 'center' && pPrRevSavedBlock.paragraph.indent === 720
    && descendants(pPrRevSaved.xmlRoot!, 'w:pPrChange').length === 0,
    JSON.stringify({ align: pPrRevSavedBlock.kind === 'paragraph' ? pPrRevSavedBlock.paragraph.align : null }));

  const acceptPPrRevDoc = await parseDocx(pPrRevDocx);
  check('pPrChange accept keeps current format', acceptRevision(acceptPPrRevDoc, 901)
    && acceptPPrRevDoc.blocks[0].kind === 'paragraph'
    && acceptPPrRevDoc.blocks[0].paragraph.align === 'left'
    && listRevisions(acceptPPrRevDoc).length === 0
    && descendants(acceptPPrRevDoc.xmlRoot!, 'w:pPrChange').length === 0,
    JSON.stringify({ align: acceptPPrRevDoc.blocks[0].kind === 'paragraph' ? acceptPPrRevDoc.blocks[0].paragraph.align : null }));

  const styledMetricsDocx = await writeZip([
    { name: 'word/styles.xml', data: text('<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman"/><w:sz w:val="24"/></w:rPr></w:rPrDefault>'
      + '<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="259" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
      + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:pPr><w:jc w:val="both"/></w:pPr><w:rPr><w:sz w:val="28"/></w:rPr></w:style>'
      + '<w:style w:type="paragraph" w:styleId="Heading1"><w:basedOn w:val="Normal"/><w:pPr><w:numPr><w:numId w:val="7"/></w:numPr><w:spacing w:before="240" w:after="120" w:line="305" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="32"/></w:rPr></w:style>'
      + '<w:style w:type="table" w:styleId="TableGrid"><w:rPr><w:sz w:val="20"/></w:rPr><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr></w:style>'
      + '</w:styles>') },
    { name: 'word/numbering.xml', data: text('<?xml version="1.0"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
      + '<w:abstractNum w:abstractNumId="3"><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="upperLetter"/><w:lvlText w:val="%1"/></w:lvl></w:abstractNum>'
      + '<w:num w:numId="7"><w:abstractNumId w:val="3"/></w:num></w:numbering>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:p><w:r><w:t>Thân văn bản</w:t></w:r></w:p>'
      + '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Tiêu đề</w:t></w:r></w:p>'
      + '<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/></w:tblPr><w:tblGrid><w:gridCol w:w="2400"/><w:gridCol w:w="2400"/></w:tblGrid>'
      + '<w:tr><w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="D9D9D9"/><w:vAlign w:val="center"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="auto"/><w:left w:val="nil"/></w:tcBorders></w:tcPr><w:p><w:r><w:t>Ô một</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Ô hai</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
      + '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:bottom="993" w:left="1440" w:right="900"/></w:sectPr>'
      + '</w:body></w:document>') },
  ]);
  const styledMetricsDoc = await parseDocx(styledMetricsDocx);
  const bodyParagraph = styledMetricsDoc.blocks[0].kind === 'paragraph' ? styledMetricsDoc.blocks[0].paragraph : null;
  const headingParagraph = styledMetricsDoc.blocks[1].kind === 'paragraph' ? styledMetricsDoc.blocks[1].paragraph : null;
  const styledTable = styledMetricsDoc.blocks.find((block) => block.kind === 'table');
  const cellParagraph = styledTable?.kind === 'table' ? styledTable.rows[0][0][0] : null;
  check('word styles resolve body metrics', bodyParagraph?.fontSizePt === 14
    && bodyParagraph.fontFamily === 'Times New Roman'
    && bodyParagraph.align === 'justify'
    && Math.abs((bodyParagraph.spaceAfterPx ?? 0) - 10.67) < 0.1
    && Math.abs((bodyParagraph.lineSpacing ?? 0) - 1.07917) < 0.001,
    JSON.stringify(bodyParagraph));
  check('word styles resolve heading', headingParagraph?.fontSizePt === 16
    && Math.abs((headingParagraph.spaceBeforePx ?? 0) - 16) < 0.1
    && Math.abs((headingParagraph.spaceAfterPx ?? 0) - 8) < 0.1,
    JSON.stringify(headingParagraph));
  check('word heading numbering comes from the style', headingParagraph?.numbering?.id === '7'
    && headingParagraph.numbering.level === 0
    && bodyParagraph?.numbering === undefined
    && styledMetricsDoc.numberingFormats?.get('7')?.levels.get(0)?.format === 'upperLetter'
    && styledMetricsDoc.numberingFormats?.get('7')?.levels.get(0)?.text === '%1',
    JSON.stringify({
      heading: headingParagraph?.numbering ?? null,
      body: bodyParagraph?.numbering ?? null,
      format: styledMetricsDoc.numberingFormats?.get('7')?.levels.get(0) ?? null,
    }));
  check('word table style applies compact metrics but keeps cell font', cellParagraph?.fontSizePt === 14
    && cellParagraph.spaceAfterPx === 0
    && Math.abs((cellParagraph.lineSpacing ?? 0) - 1) < 0.001
    && styledTable?.kind === 'table' && styledTable.grid?.length === 2,
    JSON.stringify({ cellParagraph, grid: styledTable?.kind === 'table' ? styledTable.grid : null }));
  check('word cell style from tcPr', styledTable?.kind === 'table'
    && styledTable.cellStyles?.[0]?.[0]?.fill === '#D9D9D9'
    && styledTable.cellStyles?.[0]?.[0]?.valign === 'center'
    && styledTable.cellStyles?.[0]?.[0]?.borderTop === true
    && styledTable.cellStyles?.[0]?.[0]?.borderLeft === false
    && styledTable.cellStyles?.[0]?.[0]?.borderWidthPx === 1
    // Word's default cell margins (108 twips each side) apply to every cell.
    && styledTable.cellStyles?.[0]?.[0]?.padLeftPx === 7.2
    && styledTable.cellStyles?.[0]?.[1]?.padLeftPx === 7.2
    && styledTable.cellStyles?.[0]?.[1]?.padTopPx === 0,
    JSON.stringify(styledTable?.kind === 'table' ? styledTable.cellStyles : null));
  check('word table keeps authored grid width', styledTable?.kind === 'table'
    && styledTable.tableWidthPx === 320 && styledTable.colWidthsPx?.join(',') === '160,160',
    JSON.stringify(styledTable?.kind === 'table' ? { width: styledTable.tableWidthPx, cols: styledTable.colWidthsPx } : null));
  check('word page margins parsed', styledMetricsDoc.pageMargins?.top === 96
    && Math.abs((styledMetricsDoc.pageMargins?.bottom ?? 0) - 66.2) < 0.1
    && styledMetricsDoc.pageMargins?.left === 96 && styledMetricsDoc.pageMargins?.right === 60,
    JSON.stringify(styledMetricsDoc.pageMargins));

  /* --------------------------- PPT effects parsers ---------------------- */
  const slideRoot = parseXml('<?xml version="1.0"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld/><p:clrMapOvr/></p:sld>');
  const slideNode = slideRoot.children.find((node) => node.name === 'p:sld')!;
  applyTransition(slideNode, { type: 'push', durationMs: 700 });
  const parsedPush = parseTransition(slideNode);
  check('ppt transition push round-trip', parsedPush?.type === 'push' && parsedPush.durationMs === 700, JSON.stringify(parsedPush));
  applyTransition(slideNode, { type: 'morph', durationMs: 900 });
  check('ppt transition morph round-trip', parseTransition(slideNode)?.type === 'morph'
    && slideNode.children.some((node) => node.name === 'p:transition' && node.children.some((child) => child.name === 'p14:morph')));
  applyTransition(slideNode, { type: 'none' });
  check('ppt transition none removes node', parseTransition(slideNode) === undefined);

  const animationRoot = parseXml('<?xml version="1.0"?><p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld/><p:clrMapOvr/></p:sld>');
  const animationSlide = animationRoot.children.find((node) => node.name === 'p:sld')!;
  applyAnimations(animationSlide, [
    { targetId: '2', effect: 'fade', durationMs: 500, delayMs: 0, trigger: 'click' },
    { targetId: '3', effect: 'fly-in', durationMs: 600, delayMs: 300, trigger: 'after' },
  ]);
  const animations = parseAnimations(animationSlide);
  check('ppt animations round-trip', animations.length === 2
    && animations[0].targetId === '2' && animations[0].effect === 'fade'
    && animations[1].targetId === '3' && animations[1].effect === 'fly-in' && animations[1].trigger === 'after',
    JSON.stringify(animations));
  applyAnimations(animationSlide, []);
  check('ppt animations clear', parseAnimations(animationSlide).length === 0);

  /* --------------------------- PPT SmartArt/media ----------------------- */
  const effectsPptx = await writeZip([
    { name: 'ppt/presentation.xml', data: text('<?xml version="1.0"?><p:presentation xmlns:p="p" xmlns:r="r"><p:sldSz cx="12192000" cy="6858000"/><p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst></p:presentation>') },
    { name: 'ppt/_rels/presentation.xml.rels', data: text('<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="slides/slide1.xml" Type="slide"/></Relationships>') },
    { name: 'ppt/slides/_rels/slide1.xml.rels', data: text('<?xml version="1.0"?><Relationships><Relationship Id="rId2" Target="../diagrams/data1.xml" Type="diagramData"/><Relationship Id="rId3" Target="../media/video1.mp4" Type="video"/><Relationship Id="rId4" Target="../charts/chart1.xml" Type="chart"/><Relationship Id="rId5" Target="../media/audio1.wav" Type="audio"/></Relationships>') },
    { name: 'ppt/media/video1.mp4', data: text('fake-mp4-bytes') },
    { name: 'ppt/media/audio1.wav', data: text('RIFF....WAVEfmt fake-audio-bytes') },
    { name: 'ppt/diagrams/data1.xml', data: text('<?xml version="1.0"?><dgm:dataModel xmlns:dgm="dgm" xmlns:a="a"><dgm:ptLst><dgm:pt><dgm:t><a:p><a:r><a:t>Ý tưởng</a:t></a:r></a:p></dgm:t></dgm:pt><dgm:pt><dgm:t><a:p><a:r><a:t>Triển khai</a:t></a:r></a:p></dgm:t></dgm:pt></dgm:ptLst></dgm:dataModel>') },
    { name: 'ppt/charts/chart1.xml', data: text('<?xml version="1.0"?><c:chartSpace xmlns:c="c" xmlns:a="a"><c:chart><c:title><c:tx><c:rich><a:p><a:r><a:t>Doanh thu</a:t></a:r></a:p></c:rich></c:tx></c:title></c:chart></c:chartSpace>') },
    { name: 'ppt/slides/slide1.xml', data: text('<?xml version="1.0"?><p:sld xmlns:p="p" xmlns:a="a" xmlns:dgm="dgm" xmlns:c="c" xmlns:r="r"><p:cSld><p:spTree><p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="10" name="SmartArt"/></p:nvGraphicFramePr><p:xfrm><a:off x="914400" y="914400"/><a:ext cx="3657600" cy="1828800"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/diagram"><dgm:relIds r:dm="rId2" r:lo="rId2" r:qs="rId2" r:cs="rId2"/></a:graphicData></a:graphic></p:graphicFrame><p:pic><p:nvPicPr><p:cNvPr id="11" name="Video"/><p:nvPr><a:videoFile r:link="rId3"/></p:nvPr></p:nvPicPr><p:spPr><a:xfrm><a:off x="4572000" y="914400"/><a:ext cx="3657600" cy="2057400"/></a:xfrm></p:spPr></p:pic><p:pic><p:nvPicPr><p:cNvPr id="13" name="Audio"/><p:nvPr><a:audioFile r:link="rId5"/></p:nvPr></p:nvPicPr><p:spPr><a:xfrm><a:off x="4572000" y="3200400"/><a:ext cx="3657600" cy="457200"/></a:xfrm></p:spPr></p:pic><p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="12" name="Chart"/></p:nvGraphicFramePr><p:xfrm><a:off x="914400" y="3657600"/><a:ext cx="3657600" cy="1828800"/></p:xfrm><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart"><c:chart r:id="rId4"/></a:graphicData></a:graphic></p:graphicFrame><p:sp><p:nvSpPr><p:cNvPr id="2" name="Title"/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="914400"/><a:ext cx="7315200" cy="914400"/></a:xfrm></p:spPr><p:txBody><a:p><a:r><a:t>Slide</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld><p:transition spd="med"><p:fade/></p:transition><p:clrMapOvr/></p:sld>') },
  ]);
  const effectsPpt = await parsePptx(effectsPptx);
  const kinds = effectsPpt.slides[0].shapes.map((shape) => `${shape.kind}:${shape.text}`).join(' | ');
  check('pptx smartart shape', effectsPpt.slides[0].shapes.some((shape) => shape.kind === 'smartart' && shape.text.includes('Ý tưởng')), kinds);
  check('pptx video shape', effectsPpt.slides[0].shapes.some((shape) => shape.kind === 'video' && shape.mediaPath === 'ppt/media/video1.mp4'), kinds);
  check('pptx chart shape', effectsPpt.slides[0].shapes.some((shape) => shape.kind === 'chart' && shape.text.includes('Doanh thu')), kinds);
  check('pptx audio shape', effectsPpt.slides[0].shapes.some((shape) => shape.kind === 'audio' && shape.mediaPath === 'ppt/media/audio1.wav'), kinds);
  check('pptx transition parse', effectsPpt.slides[0].transition?.type === 'fade', JSON.stringify(effectsPpt.slides[0].transition));

  /* -------------------- PPT SmartArt edit + media bytes ----------------- */
  const smartShape = effectsPpt.slides[0].shapes.find((shape) => shape.kind === 'smartart');
  check('pptx smartart nodes parsed', smartShape?.smartArtNodes?.length === 2
    && smartShape.diagramPath === 'ppt/diagrams/data1.xml'
    && smartShape.smartArtNodes[0].text === 'Ý tưởng', JSON.stringify(smartShape?.smartArtNodes?.map((item) => item.text)));
  if (smartShape?.smartArtNodes?.length) {
    smartShape.smartArtNodes[0].node.text = 'Ý tưởng mới';
    smartShape.smartArtNodes[1].node.text = 'Triển khai nhanh';
    smartShape.text = smartShape.smartArtNodes.map((item) => item.node.text).join(' · ');
    const smartSaved = await parsePptx(await savePptx(effectsPpt, toBuffer(effectsPptx)));
    const savedSmart = smartSaved.slides[0].shapes.find((shape) => shape.kind === 'smartart');
    check('pptx smartart edit round-trip', savedSmart?.text === 'Ý tưởng mới · Triển khai nhanh',
      savedSmart?.text ?? 'missing');
  } else {
    check('pptx smartart edit round-trip', false, 'missing smartart');
  }
  const videoBytes = effectsPpt.packageEntries?.get('ppt/media/video1.mp4');
  const audioBytes = effectsPpt.packageEntries?.get('ppt/media/audio1.wav');
  check('pptx media bytes available', !!videoBytes && !!audioBytes
    && new TextDecoder().decode(videoBytes) === 'fake-mp4-bytes'
    && new TextDecoder().decode(audioBytes).startsWith('RIFF'),
    `${videoBytes?.length}/${audioBytes?.length}`);
  check('pptx media mime', mediaMimeType('ppt/media/video1.mp4') === 'video/mp4'
    && mediaMimeType('ppt/media/audio1.wav') === 'audio/wav'
    && mediaMimeType('ppt/media/unknown.bin') === 'application/octet-stream');
  const mediaSaved = await parsePptx(await savePptx(effectsPpt, toBuffer(effectsPptx)));
  check('pptx media preserved after save', mediaSaved.packageEntries?.has('ppt/media/video1.mp4') === true
    && mediaSaved.packageEntries?.has('ppt/media/audio1.wav') === true);

  /* ------------------- PPT slide ops / notes / comments ------------------ */
  const deck = await parsePptx(pptx);
  const addedSlide = addSlide(deck);
  check('pptx add slide', deck.slides.length === 2 && !!addedSlide.path
    && descendants(deck.presentationRoot!, 'p:sldId').length === 2,
    JSON.stringify(deck.slides.map((slide) => slide.path)));
  const duplicatedSlide = addSlide(deck, 0);
  check('pptx duplicate slide', deck.slides.length === 3
    && duplicatedSlide.shapes.some((shape) => shape.text === 'Báo cáo Sprint 12'),
    JSON.stringify(duplicatedSlide.shapes.map((shape) => shape.text)));
  const moved = moveSlide(deck, 2, 0);
  const hidden = toggleSlideHidden(deck, 1);
  setSlideSize(deck, 960, 720);
  setSlideBackground(deck, 1, '#112233');
  const notesOk = setSlideNotes(deck, 1, 'Ghi chú slide 1');
  const commentOk = addSlideComment(deck, 1, 'Bình luận QA', 'QA', '2026-11-16T00:00:00Z');
  check('pptx slide ops apply', moved && hidden && notesOk && commentOk && deck.width === 960
    && deck.slides[1].hidden === true && deck.slides[1].background === '#112233'
    && deck.slides[1].notes === 'Ghi chú slide 1' && deck.slides[1].comments?.length === 1,
    JSON.stringify({ width: deck.width, hidden: deck.slides[1].hidden, bg: deck.slides[1].background }));
  const deckSaved = await parsePptx(await savePptx(deck, toBuffer(pptx)));
  check('pptx slide ops round-trip', deckSaved.slides.length === 3
    && deckSaved.slides[2].shapes.length === 0
    && deckSaved.slides[1].hidden === true
    && deckSaved.slides[1].background === '#112233'
    && deckSaved.slides[1].notes === 'Ghi chú slide 1'
    && deckSaved.slides[1].comments?.[0]?.text === 'Bình luận QA',
    JSON.stringify({ slides: deckSaved.slides.length, notes: deckSaved.slides[1].notes, comments: deckSaved.slides[1].comments }));
  const deleted = deleteSlide(deckSaved, 0);
  check('pptx delete slide', deleted && deckSaved.slides.length === 2
    && deckSaved.slides[0].shapes.some((shape) => shape.text === 'Báo cáo Sprint 12'));
  const deletedSaved = await parsePptx(await savePptx(deckSaved, toBuffer(pptx)));
  check('pptx delete slide round-trip', deletedSaved.slides.length === 2
    && deletedSaved.slides[0].shapes.some((shape) => shape.text === 'Báo cáo Sprint 12'),
    JSON.stringify(deletedSaved.slides.map((slide) => slide.shapes.length)));
  const commentDeleted = deleteSlideComment(deletedSaved, 0, deletedSaved.slides[0].comments?.[0]?.id ?? 1);
  check('pptx delete comment', commentDeleted && (deletedSaved.slides[0].comments?.length ?? 0) === 0);

  /* ------------------------- PDF annotation layer ----------------------- */
  const pdfBytes = text('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');
  const highlight = createAnnotation({
    page: 1, type: 'highlight', color: '#ffd54f', x: 0.1, y: 0.2, width: 0.3, height: 0.05, author: 'ERP User',
  }, new Date('2026-11-16T00:00:00Z'));
  const note = createAnnotation({
    page: 2, type: 'note', color: '#f59e0b', x: 0.5, y: 0.4, text: 'Xem lại bảng Q4', author: 'ERP User',
  }, new Date('2026-11-16T00:01:00Z'));
  let annotations = addAnnotation([], highlight);
  annotations = addAnnotation(annotations, note);
  check('pdf annotation create', highlight.id.startsWith('ann-') && highlight.page === 1 && highlight.type === 'highlight');
  check('pdf annotation page filter', annotationsForPage(annotations, 1).length === 1 && annotationsForPage(annotations, 2).length === 1);
  const embeddedPdf = embedAnnotations(pdfBytes, annotations);
  const parsedEmbedded = parseEmbeddedAnnotations(embeddedPdf);
  check('pdf annotation embed round-trip', parsedEmbedded.length === 2
    && parsedEmbedded[0].id === highlight.id && parsedEmbedded[1].text === 'Xem lại bảng Q4',
    JSON.stringify(parsedEmbedded.map((item) => item.type)));
  check('pdf annotation keeps bytes', new TextDecoder('latin1').decode(embeddedPdf).includes('%PDF-1.4')
    && new TextDecoder('latin1').decode(embeddedPdf).includes('%%EOF'));
  const stripped = stripEmbeddedAnnotations(embeddedPdf);
  check('pdf annotation strip', parseEmbeddedAnnotations(stripped).length === 0
    && new TextDecoder('latin1').decode(stripped).startsWith('%PDF-1.4'));
  const afterRemove = removeAnnotation(annotations, note.id);
  check('pdf annotation remove', afterRemove.length === 1 && afterRemove[0].id === highlight.id);
  check('pdf annotation json round-trip', parseAnnotations(serializeAnnotations(annotations)).length === 2
    && parseAnnotations('not json').length === 0);

  /* ---------------------- PDF text layer + search ----------------------- */
  const textPdf = text('%PDF-1.4\n'
    + '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n'
    + '2 0 obj << /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >> endobj\n'
    + '3 0 obj << /Type /Page /Parent 2 0 R /Contents 5 0 R >> endobj\n'
    + '4 0 obj << /Type /Page /Parent 2 0 R /Contents 6 0 R >> endobj\n'
    + '5 0 obj << /Length 44 >> stream\nBT (Open-ERP Page One) Tj ET\nendstream endobj\n'
    + '6 0 obj << /Length 44 >> stream\nBT (Second Page content) Tj ET\nendstream endobj\n'
    + 'trailer <<>>\n%%EOF\n');
  const textPages = await extractPdfTextPages(textPdf);
  check('pdf text extract pages', textPages.length === 2
    && textPages[0].text.includes('Open-ERP Page One')
    && textPages[1].text.includes('Second Page content'),
    JSON.stringify(textPages));
  const searchHits = searchPdfPages(textPages, 'page');
  check('pdf text search hits', searchHits.length === 2
    && searchHits[0].page === 1 && searchHits[1].page === 2
    && searchHits[0].match.toLowerCase() === 'page',
    JSON.stringify(searchHits));
  check('pdf text search no result', searchPdfPages(textPages, 'zzz').length === 0);
  const searchNav = pdfSearchSummary(searchHits, 1);
  check('pdf search summary', searchNav.position === 2 && searchNav.total === 2, JSON.stringify(searchNav));
  const annotatedTextPdf = embedAnnotations(textPdf, annotations);
  const annotatedPages = await extractPdfTextPages(annotatedTextPdf);
  check('pdf text survives annotation embed', annotatedPages.length === 2
    && searchPdfPages(annotatedPages, 'page').length === 2,
    JSON.stringify(annotatedPages.map((page) => page.text)));

  const compressedContent = zlib.deflateSync(Buffer.from('BT (Compressed PDF body) Tj ET', 'latin1'));
  const head = text('%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n'
    + '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n'
    + '3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj\n'
    + `4 0 obj << /Length ${compressedContent.length} /Filter /FlateDecode >>\nstream\n`);
  const tail = text('\nendstream\nendobj\ntrailer <<>>\n%%EOF\n');
  const compressedPdf = new Uint8Array(head.length + compressedContent.length + tail.length);
  compressedPdf.set(head, 0);
  compressedPdf.set(compressedContent, head.length);
  compressedPdf.set(tail, head.length + compressedContent.length);
  const compressedPages = await extractPdfTextPages(compressedPdf);
  check('pdf text flate decode', compressedPages.length === 1
    && compressedPages[0].text.includes('Compressed PDF body'),
    JSON.stringify(compressedPages));

  /* ---------------------- Word header/footer + page numbers -------------- */
  const headerDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Nội dung</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>') },
  ]);
  const headerDoc = await parseDocx(headerDocx);
  check('word section parse', (headerDoc.sections ?? []).length === 1
    && headerDoc.sections?.[0].headers.length === 0
    && headerDoc.sections?.[0].pageNumberFormat === 'decimal', JSON.stringify(headerDoc.sections?.[0]?.pageNumberFormat));
  const section = sectionAt(headerDoc);
  if (section) {
    const headerRef = ensureHeaderFooter(headerDoc, section, 'header', 'default', headerDoc.packageEntries);
    const footerRef = ensureHeaderFooter(headerDoc, section, 'footer', 'default', headerDoc.packageEntries);
    setHeaderFooterText(headerRef, 'Công ty ABC');
    setHeaderFooterText(footerRef, 'Tài liệu nội bộ');
    insertPageNumberField(footerRef);
    setPageNumbering(section, 'upperRoman', 3);
    setTitlePage(section, true);
    check('word header/footer create', headerRef.path === 'word/header1.xml' && footerRef.path === 'word/footer1.xml'
      && headerRef.text === 'Công ty ABC' && footerRef.hasPageNumber, `${headerRef.path}/${footerRef.path}`);
    check('word page numbering settings', section.pageNumberFormat === 'upperRoman' && section.pageNumberStart === 3 && section.titlePg);
    const saved = await saveDocx(headerDoc, toBuffer(headerDocx));
    const reopened = await parseDocx(saved);
    const reopenedSection = reopened.sections?.[0];
    check('word header/footer round-trip', reopenedSection?.headers[0]?.text === 'Công ty ABC'
      && reopenedSection?.footers[0]?.text === 'Tài liệu nội bộ'
      && reopenedSection?.footers[0]?.hasPageNumber === true,
      JSON.stringify(reopenedSection?.headers.map((item) => item.text)));
    check('word page numbering round-trip', reopenedSection?.pageNumberFormat === 'upperRoman'
      && reopenedSection?.pageNumberStart === 3 && reopenedSection?.titlePg === true,
      JSON.stringify({ fmt: reopenedSection?.pageNumberFormat, start: reopenedSection?.pageNumberStart, title: reopenedSection?.titlePg }));
    const reopenedFooter = reopenedSection?.footers[0];
    if (reopenedFooter) {
      setHeaderFooterText(reopenedFooter, 'Đã sửa chân trang');
      const secondSave = await parseDocx(await saveDocx(reopened, toBuffer(saved)));
      check('word header/footer edit persists', secondSave.sections?.[0].footers[0]?.text === 'Đã sửa chân trang',
        secondSave.sections?.[0].footers[0]?.text ?? 'missing');
    } else {
      check('word header/footer edit persists', false, 'missing reopened footer');
    }
  } else {
    check('word header/footer create', false, 'missing section');
  }

  const existingHeaderDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/></Relationships>') },
    { name: 'word/header1.xml', data: text('<?xml version="1.0"?><w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:t>Header có sẵn</w:t></w:r></w:p></w:hdr>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:p><w:r><w:t>Body</w:t></w:r></w:p><w:sectPr><w:headerReference w:type="default" r:id="rId7"/><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>') },
  ]);
  const existingHeader = await parseDocx(existingHeaderDocx);
  check('word existing header preserved', existingHeader.sections?.[0].headers[0]?.text === 'Header có sẵn',
    existingHeader.sections?.[0].headers[0]?.text ?? 'missing');
  const existingSaved = await parseDocx(await saveDocx(existingHeader, toBuffer(existingHeaderDocx)));
  check('word existing header round-trip', existingSaved.sections?.[0].headers[0]?.text === 'Header có sẵn'
    && existingSaved.sections?.[0].headers.length === 1,
    JSON.stringify(existingSaved.sections?.[0].headers.map((item) => item.text)));

  const multiSectionDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Section one</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>') },
  ]);
  const multiSection = await parseDocx(multiSectionDocx);
  insertSectionBreak(multiSection);
  const multiEntries = multiSection.packageEntries ?? new Map();
  const firstSection = sectionAt(multiSection, 0);
  const secondSection = sectionAt(multiSection, 1);
  const firstHeader = firstSection ? ensureHeaderFooter(multiSection, firstSection, 'header', 'default', multiEntries) : null;
  const secondHeader = secondSection ? ensureHeaderFooter(multiSection, secondSection, 'header', 'default', multiEntries) : null;
  if (firstHeader) setHeaderFooterText(firstHeader, 'Header one');
  if (secondHeader) setHeaderFooterText(secondHeader, 'Header two');
  check('word header parts unique per section', firstHeader?.path !== secondHeader?.path
    && secondHeader?.path === 'word/header2.xml',
    JSON.stringify([firstHeader?.path, secondHeader?.path]));
  const multiSaved = await parseDocx(await saveDocx(multiSection, toBuffer(multiSectionDocx)));
  check('word per-section headers round-trip', multiSaved.sections?.length === 2
    && multiSaved.sections?.[0].headers.find((item) => item.type === 'default')?.text === 'Header one'
    && multiSaved.sections?.[1].headers.find((item) => item.type === 'default')?.text === 'Header two',
    JSON.stringify(multiSaved.sections?.map((section) => section.headers.map((item) => item.text))));

  const pageFieldFooterDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>') },
    { name: 'word/footer1.xml', data: text('<?xml version="1.0"?><w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE   \\* MERGEFORMAT </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>20</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:p><w:r><w:t>Body</w:t></w:r></w:p><w:sectPr><w:footerReference w:type="default" r:id="rId9"/><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>') },
  ]);
  const pageFieldFooter = (await parseDocx(pageFieldFooterDocx)).sections?.[0].footers[0];
  check('word complex PAGE field detected', pageFieldFooter?.hasPageNumber === true && pageFieldFooter?.text === '',
    JSON.stringify({ hasPageNumber: pageFieldFooter?.hasPageNumber, text: pageFieldFooter?.text }));

  /* --------------------------- Word pagination --------------------------- */
  const paragraphBlock = (value: string, pageBreak = false): WordBlock => ({
    kind: 'paragraph',
    paragraph: { runs: [{ text: value, pageBreak }] },
  });
  const manyParagraphs: WordBlock[] = Array.from({ length: 30 }, (_, index) => paragraphBlock(`Đoạn ${index + 1}`));
  const paragraphHeights = new Map(manyParagraphs.map((_, index) => [index, 100]));
  const paragraphPages = paginateBlocks(manyParagraphs, { paragraphs: paragraphHeights });
  check('word paginate paragraphs', paragraphPages.length === 4
    && paragraphPages.reduce((sum, page) => sum + page.items.length, 0) === 30
    && paragraphPages.every((page) => page.items.length === 8 || page.items.length === 6),
    JSON.stringify(paragraphPages.map((page) => page.items.length)));

  const pagedTableBlock: WordBlock = {
    kind: 'table',
    rows: Array.from({ length: 200 }, () => [[{ runs: [{ text: 'Ô dữ liệu' }] }]]),
  };
  const tablePages = paginateBlocks([pagedTableBlock], { tableRows: new Map([[0, Array.from({ length: 200 }, () => 50)]]) });
  const ranges = tablePages.flatMap((page) => page.items.map((item) => ({ start: item.rowStart, end: item.rowEnd })));
  const coveredRows = ranges.reduce((sum, range) => sum + ((range.end ?? 0) - (range.start ?? 0)), 0);
  check('word paginate table rows', tablePages.length === 12 && coveredRows === 200
    && ranges.every((range, index) => range.start === (index === 0 ? 0 : ranges[index - 1].end)),
    JSON.stringify({ pages: tablePages.length, ranges: ranges.length }));

  const repeatedHeaderBlock: WordBlock = {
    kind: 'table',
    headerRows: 1,
    rows: Array.from({ length: 201 }, (_, row) => [[{ runs: [{ text: row === 0 ? 'Tiêu đề lặp' : `Ô ${row}` }] }]]),
  };
  const repeatedPages = paginateBlocks(
    [repeatedHeaderBlock],
    { tableRows: new Map([[0, Array.from({ length: 201 }, () => 50)]]) },
  );
  const continuationItems = repeatedPages.slice(1).flatMap((page) => page.items);
  const bodyRows = continuationItems.reduce((sum, item) => sum
    + (item.block.kind === 'table' ? item.block.rows.length - 1 : 0), 0);
  check('word repeat table header rows', repeatedPages.length === 13
    && continuationItems.every((item) => item.block.kind === 'table'
      && item.block.rows[0]?.[0]?.[0]?.runs[0]?.text === 'Tiêu đề lặp')
    && bodyRows === 184,
    JSON.stringify({ pages: repeatedPages.length, continuationItems: continuationItems.length, bodyRows }));

  const flowRowContent: CellContent[] = [{
    lines: [{ start: 0, end: 1, height: 50 }],
    paddingTop: 0,
    paddingBottom: 0,
  }];
  const flowRows = Array.from({ length: 60 }, () => flowRowContent);
  const flowBlock: WordBlock = {
    kind: 'table',
    headerRows: 1,
    rows: Array.from({ length: 60 }, (_, row) => [[{ runs: [{ text: row === 0 ? 'Tiêu đề lặp' : `Ô ${row}` }] }]]),
  };
  const flowPages = paginateBlocks([flowBlock], { rowFlow: new Map([[0, flowRows]]) });
  const flowBodyRows = flowPages.reduce((sum, page) => sum + page.items.reduce((pageSum, item) =>
    pageSum + (item.block.kind === 'table' ? item.block.rows.length - 1 : 0), 0), 0);
  check('word table rows share one table per page', flowPages.length === 4
    && flowPages.every((page) => page.items.length === 1)
    && flowPages.slice(1).every((page) => {
      const block = page.items[0]?.block;
      return block?.kind === 'table' && block.rows[0]?.[0]?.[0]?.runs[0]?.text === 'Tiêu đề lặp';
    })
    && flowBodyRows === 59,
    JSON.stringify({
      pages: flowPages.length,
      items: flowPages.map((page) => page.items.length),
      rows: flowPages.map((page) => page.items[0]?.block.kind === 'table' ? page.items[0].block.rows.length : 0),
      flowBodyRows,
    }));

  const hintCell: CellContent = {
    lines: Array.from({ length: 8 }, (_, index) => ({ start: index, end: index + 1, height: 25 })),
    paddingTop: 0,
    paddingBottom: 0,
    breakLines: [4],
  };
  const hintState = [newCellState()];
  const hintFirst = flowRow([hintCell], hintState, 100);
  const hintSecond = flowRow([hintCell], hintState, 100);
  check('word table break hints derive page fragment', hintFirst.slices[0]?.end === 4 && !hintFirst.done
    && hintSecond.slices[0]?.start === 4 && hintSecond.done,
    JSON.stringify({ first: hintFirst.slices[0], second: hintSecond.slices[0], cursor: hintState[0].cursor }));

  /* ------------------- Word text flow: line offsets ----------------------- */
  const fakeAdvance = (value: string): number => value.length * 10;
  const wrapped = wrapTextLines('aaaa bbbb cccc dddd', 100, fakeAdvance);
  check('word text lines wrap at word boundaries', wrapped.length === 2
    && wrapped[0].start === 0 && wrapped[0].end === 10 && wrapped[1].start === 10 && wrapped[1].end === 19,
    JSON.stringify(wrapped));
  check('word text lines keep long words whole', wrapTextLines('aaaaaaaaaaaa bb', 50, fakeAdvance).length === 2,
    JSON.stringify(wrapTextLines('aaaaaaaaaaaa bb', 50, fakeAdvance)));
  // Word breaks after a hyphen, so "in-memory" may end a line at "in-".
  const hyphenLines = wrapTextLines('dung in-memory', 110, fakeAdvance);
  check('word text lines break after hyphens', hyphenLines.length === 2
    && hyphenLines[0].end === 8 && hyphenLines[1].start === 8,
    JSON.stringify(hyphenLines));
  // Word's w:br is a hard line break: it must not be re-flowed as a space.
  const hardLines = wrapTextLines('aaaa bbbb\ncccc', 100, fakeAdvance);
  check('word text lines keep hard breaks', hardLines.length === 2
    && hardLines[0].end === 9 && hardLines[1].start === 10,
    JSON.stringify(hardLines));

  const splitParagraphBlock: WordBlock = { kind: 'paragraph', paragraph: { runs: [{ text: 'A'.repeat(100) }] } };
  const splitParagraphPages = paginateBlocks([splitParagraphBlock], {
    paragraphs: new Map([[0, 100]]),
    paragraphLines: new Map([[0, { offsets: [0, 25, 50, 75], lineHeight: 25, marginTop: 0, marginBottom: 0 }]]),
    contentHeight: 60,
  });
  const fragments = splitParagraphPages.map((page) => page.items[0]);
  check('word paragraph flows across pages at line boundaries', splitParagraphPages.length === 2
    && fragments[0]?.charStart === 0 && fragments[0]?.charEnd === 50
    && fragments[1]?.charStart === 50 && fragments[1]?.charEnd === 100,
    JSON.stringify({ pages: splitParagraphPages.length, fragments: fragments.map((item) => [item?.charStart, item?.charEnd]) }));

  const shortCellText = 'y'.repeat(20);
  const longCellText = 'x'.repeat(600);
  const splitFlowBlock: WordBlock = {
    kind: 'table',
    headerRows: 1,
    rows: [
      [[{ runs: [{ text: 'Đầu 1' }] }], [{ runs: [{ text: 'Đầu 2' }] }]],
      [[{ runs: [{ text: shortCellText }] }], [{ runs: [{ text: longCellText }] }]],
    ],
  };
  const splitFlowRows: CellContent[][] = [
    [
      { lines: [{ start: 0, end: 1, height: 50 }], paddingTop: 0, paddingBottom: 0 },
      { lines: [{ start: 0, end: 1, height: 50 }], paddingTop: 0, paddingBottom: 0 },
    ],
    [
      { lines: Array.from({ length: 2 }, (_, line) => ({ start: line, end: line + 1, height: 50 })),
        paddingTop: 0, paddingBottom: 0 },
      { lines: Array.from({ length: 60 }, (_, line) => ({ start: line, end: line + 1, height: 50 })),
        paddingTop: 0, paddingBottom: 0 },
    ],
  ];
  const splitCellLines = new Map([
    ['0:1:0:0', { lineHeight: 50, offsets: [0, 10, 20] }],
    ['0:1:1:0', { lineHeight: 50, offsets: Array.from({ length: 61 }, (_, line) => line * 10) }],
  ]);
  const splitPages = paginateBlocks(
    [splitFlowBlock],
    { rowFlow: new Map([[0, splitFlowRows]]), cellLines: splitCellLines },
  );
  const splitText = splitPages.flatMap((page) => page.items).flatMap((item) =>
    item.block.kind === 'table' ? item.block.rows.slice(1) : [])
    .map((row) => row.flatMap((cell) => cell.map((paragraph) =>
      paragraph.runs.map((run) => run.text).join(''))).join('')).join('');
  check('word split row keeps cell tail', splitText.length === 620
    && splitText.startsWith(shortCellText) && splitText.endsWith(longCellText),
    JSON.stringify({ pages: splitPages.length, chars: splitText.length }));

  const multiCellParagraphs: WordParagraph[] = [
    { runs: [{ text: 'Một' }] },
    { runs: [{ text: 'Hai' }] },
    { runs: [{ text: 'Ba' }] },
  ];
  const multiCellInfo = { offsets: [0, 3, 4, 7, 8, 10], paragraphStarts: [0, 4, 8] };
  const firstSlice = sliceCellParagraphs(multiCellParagraphs, multiCellInfo, 0, 4)
    .map((paragraph) => paragraph.runs.map((run) => run.text).join('')).join('|');
  const middleSlice = sliceCellParagraphs(multiCellParagraphs, multiCellInfo, 3, 7)
    .map((paragraph) => paragraph.runs.map((run) => run.text).join('')).join('|');
  const tailSlice = sliceCellParagraphs(multiCellParagraphs, multiCellInfo, 7, 10)
    .map((paragraph) => paragraph.runs.map((run) => run.text).join('')).join('|');
  check('word multi-paragraph cell slices across paragraphs',
    firstSlice === 'Một' && middleSlice === 'Hai' && tailSlice === 'Ba',
    JSON.stringify({ firstSlice, middleSlice, tailSlice }));

  // A cell that starts with an empty paragraph and uses paragraph spacing must
  // keep one offset per line, or slicing a page fragment returns empty text.
  const coverCell = buildCellLines(
    [
      { runs: [], spaceBeforePx: 0, spaceAfterPx: 12 },
      { runs: [{ text: 'Gói thầu số 072/ĐTRR' }], spaceBeforePx: 0, spaceAfterPx: 9 },
      { runs: [{ text: 'Hà Nội, 06/2026' }], spaceBeforePx: 0, spaceAfterPx: 0 },
    ],
    (value) => [{ start: 0, end: value.length }],
    () => 20,
  );
  const coverSliced = sliceCellParagraphs(
    [
      { runs: [], spaceAfterPx: 12 },
      { runs: [{ text: 'Gói thầu số 072/ĐTRR' }], spaceAfterPx: 9 },
      { runs: [{ text: 'Hà Nội, 06/2026' }] },
    ] as WordParagraph[],
    { offsets: coverCell.offsets, paragraphStarts: coverCell.paragraphStarts },
    coverCell.offsets[0],
    coverCell.offsets[coverCell.lines.length],
  ).map((paragraph) => paragraph.runs.map((run) => run.text ?? '').join('')).join('|');
  check('word cell lines keep an offset per spacing line', coverCell.offsets.length === coverCell.lines.length + 1
    && coverSliced.includes('Gói thầu số 072/ĐTRR') && coverSliced.includes('Hà Nội, 06/2026'),
    JSON.stringify({ offsets: coverCell.offsets, lines: coverCell.lines.length, coverSliced }));

  const breakPages = paginateBlocks(
    [paragraphBlock('Trước'), paragraphBlock('', true), paragraphBlock('Sau')],
    { paragraphs: new Map([[0, 100], [2, 100]]) },
  );
  check('word paginate explicit page break', breakPages.length === 2
    && breakPages[0].items.length === 1 && breakPages[1].items.length === 1,
    JSON.stringify(breakPages.map((page) => page.items.length)));

  /* ----------------------------- Word mail merge ------------------------- */
  const mergeData = parseMergeRows([
    ['Name', 'Company', 'City'],
    ['An', 'SOpen', 'Hà Nội'],
    ['Bình', 'VN9', 'Đà Nẵng'],
  ]);
  check('word mail merge parse rows', mergeData.fields.length === 3 && mergeData.recipients.length === 2
    && mergeData.recipients[1].Company === 'VN9',
    JSON.stringify(mergeData));

  const mailDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:p><w:r><w:t>Kính gửi </w:t></w:r><w:fldSimple w:instr=" MERGEFIELD Name "><w:r><w:t>«Name»</w:t></w:r></w:fldSimple></w:p>'
      + '<w:p><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> MERGEFIELD Company </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>Cũ</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p>'
      + '<w:tbl><w:tr><w:tc><w:p><w:fldSimple w:instr=" MERGEFIELD City "><w:r><w:t>«City»</w:t></w:r></w:fldSimple></w:p></w:tc></w:tr></w:tbl>'
      + '<w:sectPr/></w:body></w:document>') },
  ]);
  const mailDoc = await parseDocx(mailDocx);
  const mergeRuns = mailDoc.blocks.flatMap((block) => block.kind === 'paragraph'
    ? block.paragraph.runs : block.rows.flatMap((row) => row.flatMap((cell) => cell.flatMap((paragraph) => paragraph.runs))));
  check('word MERGEFIELD parsed', mergeRuns.filter((run) => run.mergeField).length === 3
    && mergeRuns.find((run) => run.mergeField === 'Name')?.text === '«Name»'
    && mergeRuns.find((run) => run.mergeField === 'Company')?.text === 'Cũ'
    && mergeRuns.find((run) => run.mergeField === 'City')?.text === '«City»',
    JSON.stringify(mergeRuns.filter((run) => run.mergeField)));

  const mergeState: MailMergeState = {
    ...emptyMailMergeState(),
    fields: mergeData.fields,
    recipients: mergeData.recipients,
    selected: [0, 1],
  };
  check('word mail merge check errors', checkMergeErrors(mailDoc, mergeState).length === 0,
    JSON.stringify(checkMergeErrors(mailDoc, mergeState)));
  const nextMergeDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:p><w:r><w:t>A </w:t></w:r></w:p><w:p></w:p><w:p><w:r><w:t>B </w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const nextMergeDoc = await parseDocx(nextMergeDocx);
  insertMergeField(nextMergeDoc, 0, 'Name');
  insertMergeRule(nextMergeDoc, 1, { kind: 'next' });
  insertMergeField(nextMergeDoc, 2, 'Name');
  const nextMergeData = parseMergeRows([['Name'], ['An'], ['Bình'], ['Cường']]);
  const nextState: MailMergeState = {
    ...emptyMailMergeState(),
    fields: nextMergeData.fields,
    recipients: nextMergeData.recipients,
    selected: [0, 1, 2],
  };
  finishMerge(nextMergeDoc, nextState);
  const nextTexts = nextMergeDoc.blocks.filter((block) => block.kind === 'paragraph')
    .map((block) => block.kind === 'paragraph' ? block.paragraph.runs.map((run) => run.text).join('') : '');
  const nextPageBreaks = nextMergeDoc.blocks.filter((block) => block.kind === 'paragraph'
    && block.paragraph.runs.some((run) => run.pageBreak)).length;
  check('word mail merge NEXT mid-record', nextTexts.includes('A An')
    && nextTexts.includes('B Bình') && nextTexts.includes('A Cường')
    && nextPageBreaks === 1 && !nextTexts.some((text) => text.includes('NEXT')),
    JSON.stringify({ nextTexts, nextPageBreaks }));

  const runLevelDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:p><w:r><w:t>A </w:t></w:r>'
      + '<w:fldSimple w:instr=" MERGEFIELD Name "><w:r><w:t>«Name»</w:t></w:r></w:fldSimple>'
      + '<w:fldSimple w:instr=" NEXT "><w:r><w:t>1</w:t></w:r></w:fldSimple>'
      + '<w:r><w:t> B </w:t></w:r>'
      + '<w:fldSimple w:instr=" MERGEFIELD Name "><w:r><w:t>«Name»</w:t></w:r></w:fldSimple>'
      + '</w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const runLevelDoc = await parseDocx(runLevelDocx);
  const runLevelParsed = runLevelDoc.blocks[0].kind === 'paragraph'
    ? runLevelDoc.blocks[0].paragraph.runs : [];
  check('word NEXT field parsed', runLevelParsed.some((run) => run.mergeRule?.kind === 'next'),
    JSON.stringify(runLevelParsed.map((run) => ({ text: run.text, field: run.mergeField, rule: run.mergeRule }))));
  finishMerge(runLevelDoc, {
    ...emptyMailMergeState(),
    fields: ['Name'],
    recipients: [{ Name: 'An' }, { Name: 'Bình' }],
    selected: [0, 1],
  });
  const runLevelBlock = runLevelDoc.blocks[0];
  const runLevelText = runLevelBlock?.kind === 'paragraph'
    ? runLevelBlock.paragraph.runs.map((run) => run.text).join('') : '';
  check('word mail merge NEXT inside paragraph', runLevelDoc.blocks.length === 1
    && runLevelText === 'A An B Bình'
    && !runLevelDoc.blocks.some((block) => block.kind === 'paragraph'
      && block.paragraph.runs.some((run) => run.pageBreak)),
    JSON.stringify({ runLevelText, blocks: runLevelDoc.blocks.length }));
  const runLevelSaved = await parseDocx(await saveDocx(runLevelDoc, toBuffer(runLevelDocx)));
  const runLevelSavedText = descendants(runLevelSaved.xmlRoot!, 'w:t').map((node) => node.text).join('|');
  check('word NEXT inside paragraph save round-trip', runLevelSavedText.includes('A |An|')
    && runLevelSavedText.includes('| B |Bình'), runLevelSavedText);
  const mergedCount = finishMerge(mailDoc, mergeState);
  const mergedTexts = mailDoc.blocks.map((block) => block.kind === 'paragraph'
    ? block.paragraph.runs.map((run) => run.text).join('')
    : block.rows.flatMap((row) => row.flatMap((cell) => cell.map((paragraph) =>
      paragraph.runs.map((run) => run.text).join('')))).join('')).join('\n');
  check('word mail merge finish', mergedCount === 2
    && mergedTexts.includes('Kính gửi An') && mergedTexts.includes('Bình')
    && mergedTexts.includes('VN9') && mergedTexts.includes('Đà Nẵng')
    && mailDoc.blocks.some((block) => block.kind === 'paragraph'
      && block.paragraph.runs.some((run) => run.pageBreak)),
    mergedTexts.slice(0, 160));
  const mergedSaved = await parseDocx(await saveDocx(mailDoc, toBuffer(mailDocx)));
  const mergedSavedText = mergedSaved.blocks.map((block) => block.kind === 'paragraph'
    ? block.paragraph.runs.map((run) => run.text).join('')
    : block.rows.flatMap((row) => row.flatMap((cell) => cell.map((paragraph) =>
      paragraph.runs.map((run) => run.text).join('')))).join('')).join('\n');
  check('word mail merge save round-trip', mergedSavedText === mergedTexts
    && !mergedSavedText.includes('«Name»') && mergedSavedText.includes('SOpen'),
    JSON.stringify({ blocks: mergedSaved.blocks.length }));

  const insertFieldDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Xin chào </w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const insertFieldDoc = await parseDocx(insertFieldDocx);
  check('word insert merge field', insertMergeField(insertFieldDoc, 0, 'Name')
    && insertFieldDoc.blocks[0].kind === 'paragraph'
    && insertFieldDoc.blocks[0].paragraph.runs.some((run) => run.mergeField === 'Name'),
    JSON.stringify(insertFieldDoc.blocks[0]));

  const borderDoc = await parseDocx(insertFieldDocx);
  check('word paragraph borders', toggleParagraphBorders(borderDoc, 0)
    && borderDoc.blocks[0].kind === 'paragraph'
    && borderDoc.blocks[0].paragraph.borders === true
    && descendants(borderDoc.xmlRoot!, 'w:pBdr').length === 1,
    JSON.stringify(borderDoc.blocks[0].kind === 'paragraph' ? borderDoc.blocks[0].paragraph.borders : null));
  const borderSaved = await parseDocx(await saveDocx(borderDoc, toBuffer(insertFieldDocx)));
  check('word paragraph borders round-trip', borderSaved.blocks[0].kind === 'paragraph'
    && borderSaved.blocks[0].paragraph.borders === true
    && descendants(borderSaved.xmlRoot!, 'w:pBdr').length === 1,
    JSON.stringify(borderSaved.blocks[0].kind === 'paragraph' ? borderSaved.blocks[0].paragraph.borders : null));

  /* ------------------------------- Word index ---------------------------- */
  const indexDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:p><w:r><w:t>Alpha beta</w:t></w:r></w:p>'
      + '<w:p><w:r><w:t>Beta gamma</w:t></w:r></w:p>'
      + '<w:sectPr/></w:body></w:document>') },
  ]);
  const indexDoc = await parseDocx(indexDocx);
  const indexMarked = markIndexEntry(indexDoc, 0, 'Alpha') && markIndexEntry(indexDoc, 1, 'Beta');
  check('word index mark entry', indexMarked && parseIndexEntries(indexDoc).length === 2,
    JSON.stringify(parseIndexEntries(indexDoc)));
  const indexCount = insertIndex(indexDoc, [{ term: 'Alpha', page: 2 }, { term: 'Beta', page: 5 }]);
  const indexBlocks = indexDoc.blocks.filter((block) => block.kind === 'paragraph'
    && (block.paragraph.style === 'IndexHeading' || block.paragraph.style === 'Index1'));
  check('word index insert', indexCount === 2 && hasGeneratedIndex(indexDoc) && indexBlocks.length === 3
    && indexBlocks[1].kind === 'paragraph'
    && indexBlocks[1].paragraph.runs.map((run) => run.text).join('').includes('Alpha\t2'),
    JSON.stringify(indexBlocks.map((block) => block.kind === 'paragraph' ? block.paragraph.style : null)));
  const indexSaved = await parseDocx(await saveDocx(indexDoc, toBuffer(indexDocx)));
  check('word index save round-trip', hasGeneratedIndex(indexSaved)
    && indexSaved.blocks.filter((block) => block.kind === 'paragraph' && block.paragraph.style === 'Index1').length === 2,
    JSON.stringify(indexSaved.blocks.filter((block) => block.kind === 'paragraph').map((block) => block.kind === 'paragraph' ? block.paragraph.style : null)));
  const clearedIndex = clearGeneratedIndex(indexSaved);
  check('word index clear', clearedIndex === 3 && !hasGeneratedIndex(indexSaved),
    String(clearedIndex));

  /* ----------------------------- Word arrange ---------------------------- */
  const floatDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><w:body>'
      + '<w:p><w:r><w:drawing><wp:inline><wp:extent cx="914400" cy="457200"/><wp:docPr id="7" name="Shape"/><a:graphic><a:graphicData><wps:wsp><wps:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="914400" cy="457200"/></a:xfrm><a:prstGeom prst="rect"/></wps:spPr><wps:txbx><w:txbxContent><w:p><w:r><w:t>Hộp nổi</w:t></w:r></w:p></w:txbxContent></wps:txbx></wps:wsp></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
      + '<w:p><w:r><w:drawing><wp:anchor relativeHeight="10" behindDoc="0"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>952500</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>476250</wp:posOffset></wp:positionV><wp:extent cx="914400" cy="457200"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapSquare wrapText="bothSides"/><wp:docPr id="8" name="AnchorShape"/><a:graphic><a:graphicData><wps:wsp><wps:spPr><a:xfrm rot="1800000"><a:off x="0" y="0"/><a:ext cx="914400" cy="457200"/></a:xfrm><a:prstGeom prst="rect"/></wps:spPr><wps:txbx><w:txbxContent><w:p><w:r><w:t>Neo</w:t></w:r></w:p></w:txbxContent></wps:txbx></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>'
      + '<w:sectPr/></w:body></w:document>') },
  ]);
  const floatDoc = await parseDocx(floatDocx);
  const allFloatRuns = (document: typeof floatDoc) => document.blocks.flatMap((block) => block.kind === 'paragraph'
    ? block.paragraph.runs
    : block.rows.flatMap((row) => row.flatMap((cell) => cell.flatMap((paragraph) => paragraph.runs))));
  const inlineRun = allFloatRuns(floatDoc).find((run) => run.textBox?.text === 'Hộp nổi');
  const anchorRun = allFloatRuns(floatDoc).find((run) => run.textBox?.text === 'Neo');
  check('word floating anchor parse', anchorRun?.float?.x === 100 && anchorRun.float.y === 50
    && anchorRun.float.wrap === 'square' && anchorRun.float.rotate === 30 && anchorRun.float.z === 10,
    JSON.stringify(anchorRun?.float));
  const inlineOk = Boolean(inlineRun && ensureFloating(inlineRun)
    && setFloatPosition(inlineRun, 120, 80)
    && setFloatWrap(inlineRun, 'tight')
    && setFloatRotation(inlineRun, 90));
  check('word inline to floating', inlineOk && inlineRun?.float?.x === 120 && inlineRun.float.y === 80
    && inlineRun.float.wrap === 'tight' && inlineRun.float.rotate === 90,
    JSON.stringify(inlineRun?.float));

  const groupRun = inlineRun && anchorRun ? groupFloatingRuns(floatDoc, [inlineRun, anchorRun]) : null;
  check('word wpg grouping', Boolean(groupRun) && groupRun?.group?.children.length === 2
    && descendants(floatDoc.xmlRoot!, 'wpg:wgp').length === 1,
    JSON.stringify({ children: groupRun?.group?.children.length, wpg: descendants(floatDoc.xmlRoot!, 'wpg:wgp').length }));
  const floatSaved = await parseDocx(await saveDocx(floatDoc, toBuffer(floatDocx)));
  const savedGroup = allFloatRuns(floatSaved).find((run) => run.group);
  check('word wpg group round-trip', savedGroup?.group?.children.length === 2
    && descendants(floatSaved.xmlRoot!, 'wpg:wgp').length === 1
    && savedGroup?.group?.children.some((child) => child.textBox?.text === 'Hộp nổi')
    && savedGroup?.group?.children.some((child) => child.textBox?.text === 'Neo'),
    JSON.stringify({ children: savedGroup?.group?.children.map((child) => child.textBox?.text) }));
  const ungrouped = savedGroup ? ungroupFloatingRun(floatSaved, savedGroup) : [];
  check('word wpg ungroup', ungrouped.length === 2
    && ungrouped.some((run) => run.textBox?.text === 'Hộp nổi' && run.float?.x === 120 && run.float.y === 80)
    && ungrouped.some((run) => run.textBox?.text === 'Neo' && run.float?.x === 100 && run.float.y === 50)
    && descendants(floatSaved.xmlRoot!, 'wpg:wgp').length === 0,
    JSON.stringify(ungrouped.map((run) => ({ text: run.textBox?.text, float: run.float }))));

  /* ------------------- Word columns / section / a11y --------------------- */
  const layoutDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:a="a" xmlns:pic="pic" xmlns:wp="wp"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Chương 1</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>Mục nhỏ</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr></w:p><w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="Anh"/><a:graphic><a:graphicData><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="Anh"/></pic:nvPicPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Header</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>Value</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body></w:document>') },
  ]);
  const layoutDoc = await parseDocx(layoutDocx);
  const layoutSection = sectionAt(layoutDoc);
  check('word columns parse default', layoutSection?.columns === 1 && layoutSection.columnSpace === 720
    && layoutSection.pageWidth === 11906 && layoutSection.orientation === 'portrait',
    JSON.stringify(layoutSection && { columns: layoutSection.columns, width: layoutSection.pageWidth }));
  if (layoutSection) {
    setColumns(layoutSection, 2, 720);
    setPageSetup(layoutSection, {
      pageWidth: 16838, pageHeight: 11906, orientation: 'landscape',
      margins: { top: 720, right: 720, bottom: 720, left: 720 },
    });
    check('word columns/page applied', layoutSection.columns === 2 && layoutSection.orientation === 'landscape'
      && layoutSection.margins.top === 720);
    const sectionTotal = insertSectionBreak(layoutDoc);
    check('word section break inserted', sectionTotal === 2 && layoutDoc.sections?.length === 2, String(sectionTotal));
    const layoutSaved = await parseDocx(await saveDocx(layoutDoc, toBuffer(layoutDocx)));
    check('word columns/page round-trip', layoutSaved.sections?.[0].columns === 2
      && layoutSaved.sections?.[0].orientation === 'landscape'
      && layoutSaved.sections?.[0].pageHeight === 11906
      && layoutSaved.sections?.[0].margins.left === 720
      && layoutSaved.sections?.length === 2,
      JSON.stringify(layoutSaved.sections?.map((section) => ({ c: section.columns, o: section.orientation, w: section.pageWidth }))));

    const customSection = layoutSaved.sections?.[1];
    if (customSection) {
      setPageSetup(customSection, {
        pageWidth: 11906, pageHeight: 16838, orientation: 'portrait',
        margins: { top: 850, right: 1134, bottom: 1417, left: 1701 },
      });
      const customSaved = await parseDocx(await saveDocx(layoutSaved, toBuffer(layoutDocx)));
      const custom = customSaved.sections?.[1]?.margins;
      check('word custom margins round-trip', custom?.top === 850 && custom?.right === 1134
        && custom?.bottom === 1417 && custom?.left === 1701,
        JSON.stringify(custom));
    }

    const issues = scanAccessibility(layoutSaved);
    const altIssue = issues.find((issue) => issue.code === 'IMAGE_ALT_MISSING');
    const tableIssue = issues.find((issue) => issue.code === 'TABLE_NO_HEADER');
    check('word accessibility scan', issues.some((issue) => issue.code === 'HEADING_SKIP')
      && issues.some((issue) => issue.code === 'EMPTY_HEADING')
      && !!altIssue && !!tableIssue,
      JSON.stringify(issues.map((issue) => issue.code)));
    if (altIssue?.node) setImageAlt(altIssue.node, 'Ảnh minh họa');
    if (tableIssue?.node) markTableHeader(tableIssue.node);
    const afterFix = scanAccessibility(layoutSaved);
    check('word accessibility fixes applied', !afterFix.some((issue) => issue.code === 'IMAGE_ALT_MISSING')
      && !afterFix.some((issue) => issue.code === 'TABLE_NO_HEADER')
      && afterFix.some((issue) => issue.code === 'HEADING_SKIP'),
      JSON.stringify(afterFix.map((issue) => issue.code)));
    const accessSaved = await parseDocx(await saveDocx(layoutSaved, toBuffer(layoutDocx)));
    const altNode = descendants(accessSaved.xmlRoot!, 'pic:cNvPr')[0];
    const headerRow = descendants(accessSaved.xmlRoot!, 'w:tblHeader')[0];
    check('word accessibility round-trip', altNode?.attrs['descr'] === 'Ảnh minh họa' && !!headerRow
      && !scanAccessibility(accessSaved).some((issue) => issue.code === 'IMAGE_ALT_MISSING'),
      JSON.stringify({ alt: altNode?.attrs['descr'], header: !!headerRow }));
  } else {
    check('word columns/page applied', false, 'missing section');
    check('word section break inserted', false, 'missing section');
    check('word columns/page round-trip', false, 'missing section');
    check('word accessibility scan', false, 'missing section');
    check('word accessibility fixes applied', false, 'missing section');
    check('word accessibility round-trip', false, 'missing section');
  }

  /* -------------------- Word page border/color/line numbers ------------- */
  const pageDoc = await parseDocx(layoutDocx);
  const pageSection = sectionAt(pageDoc);
  if (pageSection) {
    setPageBorder(pageSection, { style: 'double', size: 1.5, color: '#FF0000' });
    setLineNumbering(pageSection, 'newPage', 2);
    setPageColor(pageDoc, '#FFF2CC');
    check('word page border/color apply', pageSection.pageBorder?.style === 'double'
      && pageSection.pageBorder.size === 1.5 && pageSection.lineNumbering?.restart === 'newPage'
      && pageSection.lineNumbering.countBy === 2 && pageDoc.pageColor === '#FFF2CC');
    const pageSaved = await parseDocx(await saveDocx(pageDoc, toBuffer(layoutDocx)));
    check('word page border/color round-trip', pageSaved.sections?.[0].pageBorder?.style === 'double'
      && pageSaved.sections?.[0].pageBorder?.size === 1.5
      && pageSaved.sections?.[0].pageBorder?.color.toUpperCase() === 'FF0000'
      && pageSaved.sections?.[0].lineNumbering?.restart === 'newPage'
      && pageSaved.sections?.[0].lineNumbering?.countBy === 2
      && pageSaved.pageColor?.toUpperCase() === '#FFF2CC'
      && descendants(pageSaved.xmlRoot!, 'w:pgBorders').length === 1
      && descendants(pageSaved.xmlRoot!, 'w:lnNumType').length === 1
      && descendants(pageSaved.xmlRoot!, 'w:background').length === 1,
      JSON.stringify({ border: pageSaved.sections?.[0].pageBorder, line: pageSaved.sections?.[0].lineNumbering, color: pageSaved.pageColor }));
    setPageBorder(pageSaved.sections![0], null);
    setLineNumbering(pageSaved.sections![0], 'off');
    setPageColor(pageSaved, null);
    check('word page border/color clear', !pageSaved.sections?.[0].pageBorder
      && !pageSaved.sections?.[0].lineNumbering && !pageSaved.pageColor
      && descendants(pageSaved.xmlRoot!, 'w:pgBorders').length === 0
      && descendants(pageSaved.xmlRoot!, 'w:lnNumType').length === 0
      && descendants(pageSaved.xmlRoot!, 'w:background').length === 0);
  } else {
    check('word page border/color apply', false, 'missing section');
    check('word page border/color round-trip', false, 'missing section');
    check('word page border/color clear', false, 'missing section');
  }

  /* ----------------- Word find/replace + insert + undo ------------------ */
  const editDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Tài liệu tài liệu</w:t></w:r></w:p><w:p><w:r><w:t>Tài liệu hướng dẫn</w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const editDoc = await parseDocx(editDocx);
  const allMatches = findWordMatches(editDoc.blocks, 'tài liệu');
  check('word find matches', allMatches.length === 3
    && allMatches[0].blockIndex === 0 && allMatches[1].blockIndex === 0 && allMatches[2].blockIndex === 1,
    JSON.stringify(allMatches));
  check('word find match case', findWordMatches(editDoc.blocks, 'Tài liệu', { matchCase: true }).length === 2);
  check('word find whole word', findWordMatches(editDoc.blocks, 'liệ', { wholeWord: true }).length === 0
    && findWordMatches(editDoc.blocks, 'tài liệu', { wholeWord: true }).length === 3,
    JSON.stringify(findWordMatches(editDoc.blocks, 'liệ', { wholeWord: true })));
  check('word replace text', replaceWordText('Tài liệu tài liệu', 'tài liệu', 'báo cáo') === 'báo cáo báo cáo',
    replaceWordText('Tài liệu tài liệu', 'tài liệu', 'báo cáo'));
  for (const block of editDoc.blocks) {
    if (block.kind !== 'paragraph') continue;
    setAcceptedText(block.paragraph, replaceWordText(acceptedText(block.paragraph), 'tài liệu', 'báo cáo'));
  }
  const replacedSaved = await parseDocx(await saveDocx(editDoc, toBuffer(editDocx)));
  check('word replace round-trip', replacedSaved.blocks[0].kind === 'paragraph'
    && replacedSaved.blocks[0].paragraph.runs.map((run) => run.text).join('') === 'báo cáo báo cáo'
    && replacedSaved.blocks[1].kind === 'paragraph'
    && replacedSaved.blocks[1].paragraph.runs.map((run) => run.text).join('') === 'báo cáo hướng dẫn',
    JSON.stringify(replacedSaved.blocks.map((block) => block.kind === 'paragraph' ? block.paragraph.runs.map((run) => run.text).join('') : '')));

  const historyDoc = await parseDocx(editDocx);
  const historySnapshot = snapshotWord(historyDoc);
  if (historySnapshot && historyDoc.blocks[0].kind === 'paragraph') {
    setAcceptedText(historyDoc.blocks[0].paragraph, 'Đã sửa');
    restoreWord(historyDoc, historySnapshot);
    check('word undo snapshot restore', historyDoc.blocks[0].kind === 'paragraph'
      && acceptedText(historyDoc.blocks[0].paragraph) === 'Tài liệu tài liệu'
      && historyDoc.blocks.length === 2,
      JSON.stringify(historyDoc.blocks[0]));
  } else {
    check('word undo snapshot restore', false, 'missing snapshot');
  }

  const tableDoc = await parseDocx(editDocx);
  const tableBlock = insertWordTable(tableDoc, 2, 3);
  check('word insert table block', tableBlock?.kind === 'table'
    && tableBlock.rows.length === 2 && tableBlock.rows[0].length === 3
    && tableBlock.rows[1][2][0].runs.length === 0,
    JSON.stringify(tableBlock));
  const tableSaved = await parseDocx(await saveDocx(tableDoc, toBuffer(editDocx)));
  const parsedTable = tableSaved.blocks[tableSaved.blocks.length - 1];
  check('word insert table round-trip', parsedTable.kind === 'table'
    && parsedTable.rows.length === 2 && parsedTable.rows[0].length === 3
    && descendants(tableSaved.xmlRoot!, 'w:gridCol').length === 3
    && descendants(tableSaved.xmlRoot!, 'w:tblBorders').length === 1,
    JSON.stringify(parsedTable.kind === 'table' ? parsedTable.rows.length : parsedTable));

  const imageDoc = await parseDocx(editDocx);
  const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  const imageBlock = insertWordImage(imageDoc, {
    bytes: pngBytes, extension: 'png', widthPx: 120, heightPx: 60, fileName: 'logo.png',
  });
  const relsText = new TextDecoder().decode(imageDoc.packageEntries?.get('word/_rels/document.xml.rels'));
  const typesText = new TextDecoder().decode(imageDoc.packageEntries?.get('[Content_Types].xml'));
  check('word insert image parts', imageBlock?.kind === 'paragraph'
    && imageDoc.packageEntries?.get('word/media/image1.png')?.length === pngBytes.length
    && relsText.includes('media/image1.png')
    && typesText.includes('Extension="png"'),
    JSON.stringify({ kind: imageBlock?.kind, bytes: imageDoc.packageEntries?.get('word/media/image1.png')?.length, rels: relsText.includes('image1.png'), types: typesText.includes('png') }));
  const imageSaved = await parseDocx(await saveDocx(imageDoc, toBuffer(editDocx)));
  const savedImageBlock = imageSaved.blocks[imageSaved.blocks.length - 1];
  const savedImageRun = savedImageBlock.kind === 'paragraph'
    ? savedImageBlock.paragraph.runs.find((run) => run.imagePath)
    : undefined;
  check('word insert image round-trip', savedImageRun?.imagePath === 'word/media/image1.png'
    && savedImageRun.imageWidth === 120 && savedImageRun.imageHeight === 60
    && savedImageRun.alt === 'logo.png'
    && imageSaved.packageEntries?.get('word/media/image1.png')?.length === pngBytes.length,
    JSON.stringify(savedImageRun));

  /* ---------------- Word paragraph/list formatting + page break --------- */
  const numberingDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'word/numbering.xml', data: text('<?xml version="1.0"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/></w:lvl></w:abstractNum><w:abstractNum w:abstractNumId="2"><w:lvl w:ilvl="0"><w:numFmt w:val="decimal"/></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="1"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="2"/></w:num></w:numbering>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:ind w:left="720"/><w:spacing w:line="360" w:lineRule="auto"/><w:jc w:val="center"/></w:pPr><w:r><w:t>Bullet</w:t></w:r></w:p><w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="2"/></w:numPr></w:pPr><w:r><w:t>Number</w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const numberingDoc = await parseDocx(numberingDocx);
  const numberingMap = parseNumbering(numberingDoc.packageEntries ?? new Map());
  check('word numbering parse', numberingMap.get('1') === 'bullet' && numberingMap.get('2') === 'number'
    && numberingDoc.blocks[0].kind === 'paragraph' && numberingDoc.blocks[0].paragraph.listType === 'bullet'
    && numberingDoc.blocks[1].kind === 'paragraph' && numberingDoc.blocks[1].paragraph.listType === 'number',
    JSON.stringify([...numberingMap.entries()]));
  check('word paragraph props parse', numberingDoc.blocks[0].kind === 'paragraph'
    && numberingDoc.blocks[0].paragraph.align === 'center'
    && numberingDoc.blocks[0].paragraph.indent === 720
    && numberingDoc.blocks[0].paragraph.lineSpacing === 1.5,
    JSON.stringify(numberingDoc.blocks[0]));

  const formatDoc = await parseDocx(editDocx);
  const formatted = applyParagraphFormat(formatDoc, 0, {
    align: 'center', indentDelta: 720, lineSpacing: 1.5, style: 'Heading2', listType: 'bullet',
  });
  check('word paragraph format applied', formatted
    && formatDoc.blocks[0].kind === 'paragraph'
    && formatDoc.blocks[0].paragraph.align === 'center'
    && formatDoc.blocks[0].paragraph.indent === 720
    && formatDoc.blocks[0].paragraph.lineSpacing === 1.5
    && formatDoc.blocks[0].paragraph.headingLevel === 2
    && formatDoc.blocks[0].paragraph.listType === 'bullet',
    JSON.stringify(formatDoc.blocks[0]));
  const formattedSaved = await parseDocx(await saveDocx(formatDoc, toBuffer(editDocx)));
  const formattedParagraph = formattedSaved.blocks[0];
  const formattedXml = formattedParagraph.kind === 'paragraph' ? formattedParagraph.paragraph.xmlNode : undefined;
  check('word paragraph format round-trip', formattedParagraph.kind === 'paragraph'
    && formattedParagraph.paragraph.align === 'center'
    && formattedParagraph.paragraph.indent === 720
    && formattedParagraph.paragraph.lineSpacing === 1.5
    && formattedParagraph.paragraph.style === 'Heading2'
    && formattedParagraph.paragraph.headingLevel === 2
    && formattedParagraph.paragraph.listType === 'bullet'
    && descendants(formattedXml!, 'w:jc').length === 1
    && descendants(formattedXml!, 'w:ind').length === 1
    && descendants(formattedXml!, 'w:spacing').length === 1
    && descendants(formattedXml!, 'w:numPr').length === 1,
    JSON.stringify(formattedParagraph));
  check('word numbering part written', (formattedSaved.packageEntries?.get('word/numbering.xml')?.length ?? 0) > 0
    && new TextDecoder().decode(formattedSaved.packageEntries?.get('word/_rels/document.xml.rels')).includes('numbering.xml')
    && new TextDecoder().decode(formattedSaved.packageEntries?.get('[Content_Types].xml')).includes('/word/numbering.xml'));

  applyParagraphFormat(formatDoc, 0, { listType: null });
  applyParagraphFormat(formatDoc, 0, { style: 'Normal' });
  const resetParagraph = formatDoc.blocks[0];
  const resetXml = resetParagraph.kind === 'paragraph' ? resetParagraph.paragraph.xmlNode : undefined;
  check('word paragraph normal reset', resetParagraph.kind === 'paragraph'
    && !resetParagraph.paragraph.style && !resetParagraph.paragraph.headingLevel
    && resetParagraph.paragraph.align === 'left' && !resetParagraph.paragraph.listType
    && descendants(resetXml!, 'w:pStyle').length === 0
    && descendants(resetXml!, 'w:numPr').length === 0
    && descendants(resetXml!, 'w:jc').length === 0,
    JSON.stringify(resetParagraph));

  const breakDoc = await parseDocx(editDocx);
  const breakIndex = insertPageBreak(breakDoc);
  const breakBlock = breakDoc.blocks[breakIndex];
  check('word page break block', breakIndex === breakDoc.blocks.length - 1
    && breakBlock.kind === 'paragraph' && breakBlock.paragraph.runs[0]?.pageBreak === true
    && descendants(breakDoc.xmlRoot!, 'w:br').some((node) => node.attrs['w:type'] === 'page'),
    JSON.stringify(breakBlock));
  const breakSaved = await parseDocx(await saveDocx(breakDoc, toBuffer(editDocx)));
  const breakParsed = breakSaved.blocks[breakSaved.blocks.length - 1];
  check('word page break round-trip', breakParsed.kind === 'paragraph'
    && breakParsed.paragraph.runs.some((run) => run.pageBreak)
    && descendants(breakSaved.xmlRoot!, 'w:br').some((node) => node.attrs['w:type'] === 'page'),
    JSON.stringify(breakParsed));

  /* ---------------------- Word run formatting + painter ------------------ */
  const runDoc = await parseDocx(editDocx);
  const partialBold = applyRunFormat(runDoc, 0, 9, 17, { bold: true });
  const runParagraph = runDoc.blocks[0];
  check('word run format partial', partialBold && runParagraph.kind === 'paragraph'
    && paragraphPlainText(runParagraph.paragraph) === 'Tài liệu tài liệu'
    && runParagraph.paragraph.runs.length === 2
    && runParagraph.paragraph.runs[0].text === 'Tài liệu '
    && !runParagraph.paragraph.runs[0].bold
    && runParagraph.paragraph.runs[1].text === 'tài liệu'
    && runParagraph.paragraph.runs[1].bold === true,
    JSON.stringify(runParagraph));
  const runSaved = await parseDocx(await saveDocx(runDoc, toBuffer(editDocx)));
  const runSavedParagraph = runSaved.blocks[0];
  check('word run format partial round-trip', runSavedParagraph.kind === 'paragraph'
    && runSavedParagraph.paragraph.runs.length === 2
    && runSavedParagraph.paragraph.runs[1].bold === true
    && descendants(runSaved.xmlRoot!, 'w:b').length === 1,
    JSON.stringify(runSavedParagraph));

  const fullRunDoc = await parseDocx(editDocx);
  applyRunFormat(fullRunDoc, 0, 0, 17, {
    bold: true, italic: true, underline: true, strike: true,
    font: 'Arial', sizePt: 14, color: '#FF0000', highlight: 'yellow',
  });
  const fullRunSaved = await parseDocx(await saveDocx(fullRunDoc, toBuffer(editDocx)));
  const fullRun = fullRunSaved.blocks[0];
  const fullRunProps = fullRun.kind === 'paragraph' ? fullRun.paragraph.runs[0] : undefined;
  check('word run font round-trip', fullRunProps?.bold === true && fullRunProps.italic === true
    && fullRunProps.underline === true && fullRunProps.strike === true
    && fullRunProps.font === 'Arial' && fullRunProps.sizePt === 14
    && fullRunProps.color === '#FF0000' && fullRunProps.highlight === 'yellow'
    && descendants(fullRun.kind === 'paragraph' ? fullRun.paragraph.xmlNode! : fullRunSaved.xmlRoot!, 'w:rFonts').length === 1
    && descendants(fullRun.kind === 'paragraph' ? fullRun.paragraph.xmlNode! : fullRunSaved.xmlRoot!, 'w:sz')[0]?.attrs['w:val'] === '28'
    && descendants(fullRun.kind === 'paragraph' ? fullRun.paragraph.xmlNode! : fullRunSaved.xmlRoot!, 'w:color')[0]?.attrs['w:val'] === 'FF0000',
    JSON.stringify(fullRunProps));

  const clearDoc = await parseDocx(editDocx);
  applyRunFormat(clearDoc, 0, 0, 17, { bold: true, color: '#00FF00' });
  clearRunFormat(clearDoc, 0, 0, 17);
  const clearParagraph = clearDoc.blocks[0];
  check('word run clear format', clearParagraph.kind === 'paragraph'
    && clearParagraph.paragraph.runs.every((run) => !run.bold && !run.color && !run.italic),
    JSON.stringify(clearParagraph));

  const replaceRunDoc = await parseDocx(editDocx);
  const replacedRun = replaceParagraphRange(replaceRunDoc, 0, 0, 8, 'Báo cáo');
  const replacedRunParagraph = replaceRunDoc.blocks[0];
  check('word range replace', replacedRun && replacedRunParagraph.kind === 'paragraph'
    && paragraphPlainText(replacedRunParagraph.paragraph) === 'Báo cáo tài liệu',
    JSON.stringify(replacedRunParagraph));
  const replacedRunSaved = await parseDocx(await saveDocx(replaceRunDoc, toBuffer(editDocx)));
  check('word range replace round-trip', replacedRunSaved.blocks[0].kind === 'paragraph'
    && paragraphPlainText(replacedRunSaved.blocks[0].paragraph) === 'Báo cáo tài liệu',
    JSON.stringify(replacedRunSaved.blocks[0]));

  const insertRunDoc = await parseDocx(editDocx);
  const insertedRun = replaceParagraphRange(insertRunDoc, 0, 17, 17, ' mới');
  const insertedParagraph = insertRunDoc.blocks[0];
  check('word range insert (paste)', insertedRun && insertedParagraph.kind === 'paragraph'
    && paragraphPlainText(insertedParagraph.paragraph) === 'Tài liệu tài liệu mới',
    JSON.stringify(insertedParagraph));

  const noSpacingDoc = await parseDocx(editDocx);
  applyParagraphFormat(noSpacingDoc, 0, { indent: 720, lineSpacing: 1.5 });
  applyParagraphFormat(noSpacingDoc, 0, { style: 'NoSpacing' });
  const noSpacingParagraph = noSpacingDoc.blocks[0];
  check('word no spacing style', noSpacingParagraph.kind === 'paragraph'
    && noSpacingParagraph.paragraph.style === 'NoSpacing'
    && noSpacingParagraph.paragraph.indent === undefined
    && noSpacingParagraph.paragraph.lineSpacing === undefined,
    JSON.stringify(noSpacingParagraph));
  const noSpacingSaved = await parseDocx(await saveDocx(noSpacingDoc, toBuffer(editDocx)));
  check('word no spacing round-trip', noSpacingSaved.blocks[0].kind === 'paragraph'
    && noSpacingSaved.blocks[0].paragraph.style === 'NoSpacing',
    JSON.stringify(noSpacingSaved.blocks[0]));

  /* -------------------- Word ribbon parity structure -------------------- */
  const ribbonTabs = WORD_RIBBON.map((tab) => tab.id);
  check('word ribbon 11 base + 3 contextual tabs', ribbonTabs.length === 14
    && ['home', 'insert', 'table', 'tableLayout', 'picture', 'shape', 'draw', 'design', 'layout', 'references', 'mailings', 'review', 'view', 'help']
      .every((id) => ribbonTabs.includes(id as never)),
    JSON.stringify(ribbonTabs));
  const ribbonGroups = WORD_RIBBON.flatMap((tab) => tab.groups);
  const groupIds = ribbonGroups.map((group) => group.id);
  check('word ribbon groups unique', new Set(groupIds).size === groupIds.length && groupIds.length >= 25,
    JSON.stringify(groupIds));
  const ribbonItems = ribbonGroups.flatMap((group) => group.items);
  const itemIds = ribbonItems.map((item) => item.id);
  check('word ribbon commands unique per tab', WORD_RIBBON.every((tab) => {
    const ids = tab.groups.flatMap((group) => group.items.map((item) => item.id));
    return new Set(ids).size === ids.length;
  }) && itemIds.length >= 60, JSON.stringify({ commands: itemIds.length }));
  const requiredGroups = [
    'clipboard', 'font', 'paragraph', 'styles', 'editing',
    'pages', 'tables', 'illustrations', 'media', 'links', 'comments', 'headerFooter', 'text',
    'pens', 'documentFormatting', 'pageBackground', 'pageSetup', 'breaks', 'paragraphLayout', 'arrange',
    'toc', 'notes', 'citations', 'captions', 'index',
    'mailCreate', 'mailStart', 'mailFields', 'mailPreview', 'mailFinish',
    'proofing', 'protect', 'reviewComments', 'tracking', 'inkReview', 'views', 'show', 'zoomGroup', 'window', 'helpGroup',
  ];
  check('word ribbon covers Office groups', requiredGroups.every((id) => groupIds.includes(id)),
    JSON.stringify(requiredGroups.filter((id) => !groupIds.includes(id))));
  const customControls = ribbonItems.filter((item) => item.control).map((item) => item.control);
  check('word ribbon dropdowns', ['fontName', 'fontSize', 'fontColor', 'highlight', 'style', 'spacing', 'shading',
    'margins', 'orientation', 'pageSize', 'columns', 'lineNumbers', 'zoom', 'hyphenation']
    .every((control) => customControls.includes(control as never)),
    JSON.stringify(customControls));
  const commands = ribbonItems.map((item) => item.id);
  check('word ribbon Office commands present', ['paste', 'painter', 'bold', 'italic',
    'bullets', 'numbering', 'selectAll', 'table', 'picture', 'video', 'link', 'header', 'footer',
    'pageNumber', 'equation', 'symbol', 'insertFootnote', 'bibliography', 'spelling', 'wordCount',
    'accessibility', 'trackChanges', 'acceptAll', 'rejectAll', 'readMode', 'printLayout', 'webLayout', 'immersive', 'ruler',
    'navigation', 'fullscreen', 'help', 'shapes', 'icons', 'chart', 'themes', 'styleSets', 'sortParagraphs',
    'shading', 'tableOfFigures', 'thesaurus', 'restrictEditing', 'macros', 'insertMergeField',
    'markEntry', 'insertIndex', 'updateIndex', 'startMailMerge', 'selectRecipients', 'finishMerge',
    'position', 'wrapText', 'bringForward', 'sendBackward', 'selectionPane', 'alignObjects',
    'groupObjects', 'rotateObjects'].every((id) => commands.includes(id)),
    JSON.stringify(commands));
  const disabledItems = ribbonItems.filter((item) => item.disabled);
  check('word ribbon disabled states documented', disabledItems.length === 1
    && disabledItems.every((item) => item.hintKey)
    && disabledItems[0].id === 'macros',
    JSON.stringify({ disabled: disabledItems.length }));

  /* ------------------- Word hyperlink / video / spellcheck ------------- */
  const linkDoc = await parseDocx(editDocx);
  const linkOk = insertHyperlink(linkDoc, 0, 'OpenAI', 'https://openai.com');
  const linkRun = linkDoc.blocks[0].kind === 'paragraph'
    ? linkDoc.blocks[0].paragraph.runs.find((run) => run.link)
    : undefined;
  check('word hyperlink insert', linkOk && linkRun?.text === 'OpenAI'
    && linkRun.link === 'https://openai.com'
    && new TextDecoder().decode(linkDoc.packageEntries?.get('word/_rels/document.xml.rels')).includes('openai.com'));
  const linkBlock = linkDoc.blocks[0];
  if (linkBlock.kind === 'paragraph') {
    const length = paragraphPlainText(linkBlock.paragraph).length;
    replaceParagraphRange(linkDoc, 0, length, length, '©');
  }
  const linkSaved = await parseDocx(await saveDocx(linkDoc, toBuffer(editDocx)));
  const savedLink = linkSaved.blocks[0].kind === 'paragraph'
    ? linkSaved.blocks[0].paragraph.runs.find((run) => run.link)
    : undefined;
  check('word hyperlink round-trip', savedLink?.link === 'https://openai.com' && savedLink.text.startsWith('OpenAI'),
    JSON.stringify(savedLink));

  const videoDoc = await parseDocx(editDocx);
  const videoOk = insertWordVideo(videoDoc, 'https://youtu.be/inserted');
  const videoSaved = await parseDocx(await saveDocx(videoDoc, toBuffer(editDocx)));
  const savedVideoRun = videoSaved.blocks
    .flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : [])
    .find((run) => run.videoUrl);
  check('word insert video round-trip', !!videoOk && savedVideoRun?.videoUrl === 'https://youtu.be/inserted'
    && descendants(videoSaved.xmlRoot!, 'wp15:webVideoPr').length === 1,
    JSON.stringify(savedVideoRun));

  const spellDoc = await parseDocx(editDocx);
  if (spellDoc.blocks[0].kind === 'paragraph') {
    setAcceptedText(spellDoc.blocks[0].paragraph, 'the the recieve adress');
    const issues = checkWordSpelling(spellDoc.blocks);
    check('word spellcheck detect', issues.length === 3
      && issues.some((issue) => issue.kind === 'repeated' && issue.suggestion === 'the')
      && issues.some((issue) => issue.suggestion === 'receive')
      && issues.some((issue) => issue.suggestion === 'address'),
      JSON.stringify(issues));
    const fixed = issues.find((issue) => issue.suggestion === 'receive');
    check('word spellcheck fix', !!fixed && fixWordSpelling(spellDoc, fixed)
      && acceptedText(spellDoc.blocks[0].paragraph).includes('receive'),
      acceptedText(spellDoc.blocks[0].paragraph));
    const grammar = checkWordSpelling([{
      kind: 'paragraph',
      paragraph: { runs: [{ text: 'Hello  world .Next sentence!! end.Start' }] },
    }]);
    check('word grammar checks', grammar.length === 6
      && grammar.every((issue) => issue.kind === 'grammar'),
      JSON.stringify(grammar));
    const expanded = checkWordSpelling([{
      kind: 'paragraph',
      paragraph: { runs: [{ text: 'teh goverment enviroment wierd succesful' }] },
    }]);
    check('word spell dictionary expanded', expanded.filter((issue) => issue.kind === 'spelling').length === 5
      && expanded.some((issue) => issue.suggestion === 'the')
      && expanded.some((issue) => issue.suggestion === 'government'),
      JSON.stringify(expanded.map((issue) => issue.suggestion)));
    const vietnamese = checkWordSpelling([{
      kind: 'paragraph',
      paragraph: { runs: [{ text: 'khong duoc viec' }] },
    }]);
    check('word spell Vietnamese dictionary', vietnamese.filter((issue) => issue.kind === 'spelling').length === 3
      && vietnamese.filter((issue) => issue.kind === 'spelling')
        .every((issue) => issue.kind === 'spelling')
      && vietnamese.some((issue) => issue.suggestion === 'không' && issue.alternatives?.includes('khổng'))
      && vietnamese.some((issue) => issue.suggestion === 'được')
      && vietnamese.some((issue) => issue.suggestion === 'việc'),
      JSON.stringify(vietnamese));
    const punctuation = checkWordSpelling([{
      kind: 'paragraph',
      paragraph: { runs: [{ text: 'A , B;C ( D ) and,next' }] },
    }]);
    check('word grammar punctuation spacing', punctuation.length === 5
      && punctuation.every((issue) => issue.kind === 'grammar'),
      JSON.stringify(punctuation.map((issue) => ({ word: issue.word, suggestion: issue.suggestion }))));

    const editorEnglish = 'The report are ready. He go to work every day. This is a apple. We depend of the supplier.';
    const editorVietnamese = 'Những cái người này làm việc tốt.';
    const editorDocx = await writeZip([
      { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
        + `<w:p><w:r><w:t>${editorEnglish}</w:t></w:r></w:p>`
        + `<w:p><w:r><w:t>${editorVietnamese}</w:t></w:r></w:p>`
        + '<w:sectPr/></w:body></w:document>') },
    ]);
    const editorDoc = await parseDocx(editorDocx);
    const editorEnglishBlock = editorDoc.blocks[0];
    const editorVietnameseBlock = editorDoc.blocks[1];
    const editorIssues = checkWordSpelling(editorDoc.blocks).filter((issue) => issue.kind === 'grammar');
    const editorSuggestions = editorIssues.map((issue) => issue.suggestion);
    check('word grammar Editor rules', editorIssues.length === 5
      && editorSuggestions.includes('report is')
      && editorSuggestions.includes('He goes')
      && editorSuggestions.includes('an apple')
      && editorSuggestions.includes('depend on')
      && editorSuggestions.includes('Những người'),
      JSON.stringify(editorSuggestions));
    for (const issue of [...editorIssues].sort((left, right) => right.start - left.start || right.paragraphIndex - left.paragraphIndex)) {
      applySpellSuggestion(editorDoc, issue, issue.suggestion);
    }
    const editorEnglishApplied = editorEnglishBlock?.kind === 'paragraph' ? acceptedText(editorEnglishBlock.paragraph) : '';
    const editorVietnameseApplied = editorVietnameseBlock?.kind === 'paragraph' ? acceptedText(editorVietnameseBlock.paragraph) : '';
    check('word grammar Editor apply', editorEnglishApplied === 'The report is ready. He goes to work every day. This is an apple. We depend on the supplier.'
      && editorVietnameseApplied === 'Những người này làm việc tốt.',
      JSON.stringify({ editorEnglishApplied, editorVietnameseApplied }));
    const editorResidual = checkWordSpelling(editorDoc.blocks);
    check('word grammar Editor no residual', editorResidual.length === 0,
      JSON.stringify(editorResidual));
    const editorSaved = await parseDocx(await saveDocx(editorDoc, toBuffer(editorDocx)));
    const editorSavedEnglish = editorSaved.blocks[0];
    const editorSavedVietnamese = editorSaved.blocks[1];
    check('word grammar Editor round-trip', editorSavedEnglish?.kind === 'paragraph'
      && acceptedText(editorSavedEnglish.paragraph) === editorEnglishApplied
      && editorSavedVietnamese?.kind === 'paragraph'
      && acceptedText(editorSavedVietnamese.paragraph) === editorVietnameseApplied,
      JSON.stringify({
        english: editorSavedEnglish?.kind === 'paragraph' ? acceptedText(editorSavedEnglish.paragraph) : null,
        vietnamese: editorSavedVietnamese?.kind === 'paragraph' ? acceptedText(editorSavedVietnamese.paragraph) : null,
      }));
    const editorExtra = checkWordSpelling([{
      kind: 'paragraph',
      paragraph: { runs: [{ text: 'This is more better. He gave advices. The information are useful.' }] },
    }]);
    check('word grammar Editor uncountable/comparative', editorExtra.some((issue) => issue.suggestion === 'better')
      && editorExtra.some((issue) => issue.suggestion === 'advice')
      && editorExtra.some((issue) => issue.suggestion === 'information is'),
      JSON.stringify(editorExtra.map((issue) => issue.suggestion)));
  } else {
    check('word spellcheck detect', false, 'missing paragraph');
    check('word spellcheck fix', false, 'missing paragraph');
    check('word grammar checks', false, 'missing paragraph');
    check('word spell dictionary expanded', false, 'missing paragraph');
    check('word spell Vietnamese dictionary', false, 'missing paragraph');
    check('word grammar punctuation spacing', false, 'missing paragraph');
    check('word grammar Editor rules', false, 'missing paragraph');
    check('word grammar Editor apply', false, 'missing paragraph');
    check('word grammar Editor round-trip', false, 'missing paragraph');
  }

  /* ------------- Word cover / text box / caption / watermark ------------ */
  const coverDoc = await parseDocx(editDocx);
  const coverBlocks = insertCoverPage(coverDoc, 'Báo cáo thử', 'Phòng QA', '16/11/2026');
  const coverFirst = coverDoc.blocks[0];
  check('word cover page insert', coverBlocks?.length === 4 && coverFirst.kind === 'paragraph'
    && acceptedText(coverFirst.paragraph) === 'Báo cáo thử'
    && coverFirst.paragraph.style === 'Title'
    && coverDoc.blocks[3].kind === 'paragraph' && coverDoc.blocks[3].paragraph.runs[0]?.pageBreak === true,
    JSON.stringify(coverDoc.blocks.slice(0, 4)));
  const coverSaved = await parseDocx(await saveDocx(coverDoc, toBuffer(editDocx)));
  const coverSavedFirst = coverSaved.blocks[0];
  check('word cover page round-trip', coverSavedFirst.kind === 'paragraph'
    && acceptedText(coverSavedFirst.paragraph) === 'Báo cáo thử'
    && coverSavedFirst.paragraph.style === 'Title'
    && coverSaved.blocks.some((block) => block.kind === 'paragraph' && block.paragraph.runs.some((run) => run.pageBreak))
    && descendants(coverSaved.xmlRoot!, 'w:pStyle').some((node) => node.attrs['w:val'] === 'Title'),
    JSON.stringify(coverSaved.blocks.slice(0, 4).map((block) => block.kind === 'paragraph' ? acceptedText(block.paragraph) : 'table')));

  const boxDoc = await parseDocx(editDocx);
  insertTextBox(boxDoc, 'Hộp ghi chú', 240, 90);
  const boxSaved = await parseDocx(await saveDocx(boxDoc, toBuffer(editDocx)));
  const boxRun = boxSaved.blocks
    .flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : [])
    .find((run) => run.textBox);
  check('word text box round-trip', boxRun?.textBox?.text === 'Hộp ghi chú'
    && boxRun.textBox.width === 240 && boxRun.textBox.height === 90
    && descendants(boxSaved.xmlRoot!, 'wps:txbx').length === 1
    && descendants(boxSaved.xmlRoot!, 'w:txbxContent').length === 1,
    JSON.stringify(boxRun));

  const captionDoc = await parseDocx(editDocx);
  insertCaption(captionDoc, 'Hình', 'Sơ đồ hệ thống');
  insertCaption(captionDoc, 'Hình', 'Luồng xử lý');
  const captionSaved = await parseDocx(await saveDocx(captionDoc, toBuffer(editDocx)));
  const captionTexts = captionSaved.blocks
    .filter((block) => block.kind === 'paragraph')
    .map((block) => block.kind === 'paragraph' ? acceptedText(block.paragraph) : '');
  check('word caption insert round-trip', captionTexts.includes('Hình 1: Sơ đồ hệ thống')
    && captionTexts.includes('Hình 2: Luồng xử lý')
    && descendants(captionSaved.xmlRoot!, 'w:fldSimple').length === 2,
    JSON.stringify(captionTexts));

  const markDoc = await parseDocx(layoutDocx);
  setWatermark(markDoc, 'CONFIDENTIAL');
  const markSaved = await parseDocx(await saveDocx(markDoc, toBuffer(layoutDocx)));
  const markHeader = markSaved.packageEntries?.get(markSaved.sections?.[0]?.headers[0]?.path ?? '');
  check('word watermark round-trip', markSaved.watermark === 'CONFIDENTIAL'
    && (markHeader?.length ?? 0) > 0
    && new TextDecoder().decode(markHeader).includes('CONFIDENTIAL')
    && new TextDecoder().decode(markHeader).includes('v:textpath'),
    JSON.stringify({ watermark: markSaved.watermark, path: markSaved.sections?.[0]?.headers[0]?.path }));
  setWatermark(markSaved, null);
  check('word watermark remove', !markSaved.watermark
    && !descendants(markSaved.sections?.[0]?.headers[0]?.xmlRoot, 'v:textpath').length);

  const ribbonCommands = WORD_RIBBON.flatMap((tab) => tab.groups).flatMap((group) => group.items.map((item) => item.id));
  check('word missing Office commands present', ['coverPage', 'textBox', 'watermark', 'insertCaption', 'newWindow']
    .every((id) => ribbonCommands.includes(id)), JSON.stringify(ribbonCommands.slice(-8)));
  check('word ribbon icons for large buttons', ['coverPage', 'textBox', 'watermark', 'insertCaption', 'newWindow', 'table', 'picture']
    .every((id) => wordIconPaths(id).length > 0));
  check('word draw highlighter/ruler + ink review', ['drawHighlighter', 'drawRuler', 'inkStart', 'inkHide', 'inkDeleteAll',
    'eraserSmall', 'eraserMedium', 'lassoSelect', 'drawInkMode', 'fingerPainting', 'penFavorite', 'addPenFavorite']
    .every((id) => commands.includes(id) && wordIconPaths(id).length > 0) && groupIds.includes('inkReview'),
    JSON.stringify(commands.filter((id) => ['drawHighlighter', 'drawRuler', 'inkStart', 'inkHide', 'inkDeleteAll',
      'eraserSmall', 'eraserMedium', 'lassoSelect', 'drawInkMode', 'fingerPainting', 'penFavorite', 'addPenFavorite'].includes(id))));

  /* ------------- Word shapes / figures / sort / theme / protect ---------- */
  const shapeDoc = await parseDocx(editDocx);
  insertWordShape(shapeDoc, { shape: 'ellipse', fill: '#FFCC00', widthPx: 200, heightPx: 80 });
  insertWordShape(shapeDoc, { shape: 'roundRect', fill: '#EAF1FB', widthPx: 180, heightPx: 90 });
  const shapeSaved = await parseDocx(await saveDocx(shapeDoc, toBuffer(editDocx)));
  const shapeRuns = shapeSaved.blocks
    .flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : [])
    .filter((run) => run.textBox?.shape);
  check('word shapes round-trip', shapeRuns.length === 2
    && shapeRuns[0].textBox?.shape === 'ellipse' && shapeRuns[0].textBox.fill === '#FFCC00'
    && shapeRuns[1].textBox?.shape === 'roundRect'
    && descendants(shapeSaved.xmlRoot!, 'a:prstGeom').some((node) => node.attrs['prst'] === 'ellipse'),
    JSON.stringify(shapeRuns.map((run) => run.textBox)));

  const objectRun = shapeRuns[0];
  setShapeColor(objectRun, 'fill', '#FF0000');
  setShapeColor(objectRun, 'outline', '#0000FF');
  resizeRunObject(objectRun, 320, 160);
  setRunAlt(objectRun, 'Mô tả hình');
  const objectSaved = await parseDocx(await saveDocx(shapeSaved, toBuffer(editDocx)));
  const savedObject = objectSaved.blocks
    .flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : [])
    .find((run) => run.textBox?.shape === 'ellipse');
  const shapeFill = descendants(savedObject?.xmlNode ?? objectSaved.xmlRoot!, 'a:solidFill')[0];
  check('word shape fill/outline/size/alt round-trip', savedObject?.textBox?.fill === '#FF0000'
    && savedObject.textBox?.outline === '#0000FF'
    && savedObject.textBox?.width === 320 && savedObject.textBox?.height === 160
    && savedObject.alt === 'Mô tả hình'
    && shapeFill?.children.some((node) => node.name === 'a:srgbClr' && node.attrs['val'] === 'FF0000')
    && descendants(savedObject?.xmlNode ?? objectSaved.xmlRoot!, 'wp:docPr').some((node) => node.attrs['descr'] === 'Mô tả hình'),
    JSON.stringify({ fill: savedObject?.textBox?.fill, outline: savedObject?.textBox?.outline, width: savedObject?.textBox?.width, alt: savedObject?.alt }));

  const figureDoc = await parseDocx(editDocx);
  insertCaption(figureDoc, 'Hình', 'Kiến trúc');
  insertCaption(figureDoc, 'Hình', 'Luồng dữ liệu');
  insertTableOfFigures(figureDoc, 'Hình');
  const figureSaved = await parseDocx(await saveDocx(figureDoc, toBuffer(editDocx)));
  const figureTexts = figureSaved.blocks
    .filter((block) => block.kind === 'paragraph')
    .map((block) => block.kind === 'paragraph' ? acceptedText(block.paragraph) : '');
  check('word table of figures', figureTexts.includes('Danh mục hình')
    && figureTexts.some((text) => text.includes('Kiến trúc') && text.includes('.....'))
    && figureTexts.some((text) => text.includes('Luồng dữ liệu')),
    JSON.stringify(figureTexts));

  const sortedDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Zebra</w:t></w:r></w:p><w:p><w:r><w:t>Alpha</w:t></w:r></w:p><w:p><w:r><w:t>Mango</w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const sortedDoc = await parseDocx(sortedDocx);
  const sorted = sortBodyParagraphs(sortedDoc, 0);
  const sortedSaved = await parseDocx(await saveDocx(sortedDoc, toBuffer(sortedDocx)));
  const sortedTexts = sortedSaved.blocks.map((block) => block.kind === 'paragraph' ? acceptedText(block.paragraph) : '');
  check('word sort paragraphs', sorted && sortedTexts.join(',') === 'Alpha,Mango,Zebra',
    JSON.stringify(sortedTexts));

  const shadedDoc = await parseDocx(editDocx);
  applyParagraphFormat(shadedDoc, 0, { shading: '#FFF2CC' });
  const shadedSaved = await parseDocx(await saveDocx(shadedDoc, toBuffer(editDocx)));
  const shadedParagraph = shadedSaved.blocks[0];
  check('word paragraph shading round-trip', shadedParagraph.kind === 'paragraph'
    && shadedParagraph.paragraph.shading?.toUpperCase() === '#FFF2CC'
    && descendants(shadedSaved.xmlRoot!, 'w:shd').some((node) => node.attrs['w:fill'] === 'FFF2CC'),
    JSON.stringify(shadedParagraph));

  applyParagraphFormat(shadedSaved, 0, { shading: '' });
  const clearedShadeDoc = await parseDocx(await saveDocx(shadedSaved, toBuffer(editDocx)));
  const clearedPara = clearedShadeDoc.blocks[0];
  check('word paragraph shading clear round-trip', clearedPara.kind === 'paragraph'
    && !clearedPara.paragraph.shading
    && descendants(clearedShadeDoc.xmlRoot!, 'w:shd').length === 0);

  setParagraphBorders(clearedShadeDoc, 0, 'bottom');
  const bottomBorderDoc = await parseDocx(await saveDocx(clearedShadeDoc, toBuffer(editDocx)));
  const bPara = bottomBorderDoc.blocks[0];
  check('word paragraph bottom border round-trip', bPara.kind === 'paragraph'
    && Boolean(bPara.paragraph.borderSides?.bottom)
    && !bPara.paragraph.borderSides?.top && !bPara.paragraph.borderSides?.left && !bPara.paragraph.borderSides?.right);
  setParagraphBorders(bottomBorderDoc, 0, 'none');
  const noBorderDoc = await parseDocx(await saveDocx(bottomBorderDoc, toBuffer(editDocx)));
  const nbPara = noBorderDoc.blocks[0];
  check('word paragraph border clear round-trip', nbPara.kind === 'paragraph'
    && !nbPara.paragraph.borders && !nbPara.paragraph.borderSides
    && descendants(noBorderDoc.xmlRoot!, 'w:pBdr').length === 0);

  const twoParaDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>First</w:t></w:r></w:p><w:p><w:r><w:t>Second</w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const pbDoc = await parseDocx(twoParaDocx);
  const pbIdx = insertPageBreak(pbDoc, 0);
  check('word cursor pageBreak mid-doc', pbIdx === 1 && pbDoc.blocks.length === 3
    && pbDoc.blocks[1].kind === 'paragraph' && pbDoc.blocks[1].paragraph.runs.some((r) => r.pageBreak));

  const blankDoc = await parseDocx(twoParaDocx);
  const blankIdx = insertBlankPage(blankDoc, 0);
  check('word insertBlankPage mid-doc', blankIdx === 2 && blankDoc.blocks.length === 5
    && blankDoc.blocks[1].kind === 'paragraph' && blankDoc.blocks[1].paragraph.runs.some((r) => r.pageBreak)
    && blankDoc.blocks[2].kind === 'paragraph' && !blankDoc.blocks[2].paragraph.runs.some((r) => r.pageBreak)
    && blankDoc.blocks[3].kind === 'paragraph' && blankDoc.blocks[3].paragraph.runs.some((r) => r.pageBreak));

  const slIds = Object.values(WORD_SINGLE_LINE_RIBBON).flat()
    .flatMap((g) => g.items.filter((it) => !it.control && !it.disabled).map((it) => it.id));
  check('word single-line icons present', slIds.every((id) => wordIconPaths(id).length > 0),
    JSON.stringify(slIds.filter((id) => wordIconPaths(id).length === 0)));
  check('word layered accent & distinct grow/shrink icons',
    wordLayeredIconSvg('text_color', 'text_color_accent').includes('op-icon-accent')
    && wordIconSvg('growFont') !== wordIconSvg('shrinkFont')
    && wordIconSvg('alignLeft') !== wordIconSvg('alignRight')
    && wordIconSvg('marginsMenu') !== wordIconSvg('columnsMenu'));

  const themeDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>') },
    { name: 'word/theme/theme1.xml', data: text('<?xml version="1.0"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:themeElements><a:clrScheme name="Office"><a:accent1><a:srgbClr val="1F4E79"/></a:accent1></a:clrScheme><a:fontScheme name="Office"><a:majorFont><a:latin typeface="Calibri"/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/></a:minorFont></a:fontScheme></a:themeElements></a:theme>') },
    { name: 'word/styles.xml', data: text('<?xml version="1.0"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Heading1"><w:rPr><w:b/><w:sz w:val="64"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:rPr><w:b/><w:sz w:val="52"/></w:rPr></w:style></w:styles>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Theme</w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const themeDoc = await parseDocx(themeDocx);
  applyWordTheme(themeDoc, WORD_THEMES[1]);
  applyStyleSet(themeDoc, 'modern');
  setDocumentProtection(themeDoc, true);
  const themeSaved = await parseDocx(await saveDocx(themeDoc, toBuffer(themeDocx)));
  const themeXml = new TextDecoder().decode(themeSaved.packageEntries?.get('word/theme/theme1.xml'));
  const stylesXml = new TextDecoder().decode(themeSaved.packageEntries?.get('word/styles.xml'));
  const settingsXml = new TextDecoder().decode(themeSaved.packageEntries?.get('word/settings.xml'));
  check('word theme round-trip', themeSaved.theme?.accent.toUpperCase() === '#C00000'
    && themeSaved.theme?.font === 'Arial' && themeXml.includes('C00000') && themeXml.includes('Arial'),
    JSON.stringify(themeSaved.theme));
  check('word style set round-trip', themeSaved.styleSet === 'modern'
    && stylesXml.includes('w:val="72"') && settingsXml.includes('OpenErpStyleSet'),
    JSON.stringify({ styleSet: themeSaved.styleSet, styles: stylesXml.includes('w:val="72"') }));
  check('word restrict editing round-trip', themeSaved.protected === true
    && settingsXml.includes('w:documentProtection')
    && new TextDecoder().decode(themeSaved.packageEntries?.get('word/_rels/document.xml.rels')).includes('settings.xml'),
    JSON.stringify({ protected: themeSaved.protected }));
  setDocumentProtection(themeSaved, false);
  const unprotected = await parseDocx(await saveDocx(themeSaved, toBuffer(themeDocx)));
  check('word restrict editing off', !unprotected.protected
    && !new TextDecoder().decode(unprotected.packageEntries?.get('word/settings.xml')).includes('documentProtection'));

  setAutoHyphenation(themeSaved, true);
  const hyphenSaved = await parseDocx(await saveDocx(themeSaved, toBuffer(themeDocx)));
  const hyphenXml = new TextDecoder().decode(hyphenSaved.packageEntries?.get('word/settings.xml'));
  const hyphenRels = new TextDecoder().decode(hyphenSaved.packageEntries?.get('word/_rels/document.xml.rels'));
  check('word auto hyphenation round-trip', hyphenSaved.autoHyphenation === true
    && hyphenXml.includes('w:autoHyphenation') && hyphenRels.includes('settings.xml'),
    JSON.stringify({ auto: hyphenSaved.autoHyphenation, part: hyphenXml.includes('autoHyphenation') }));
  setAutoHyphenation(hyphenSaved, false);
  const hyphenOff = await parseDocx(await saveDocx(hyphenSaved, toBuffer(themeDocx)));
  check('word auto hyphenation off', !hyphenOff.autoHyphenation
    && !new TextDecoder().decode(hyphenOff.packageEntries?.get('word/settings.xml')).includes('autoHyphenation'));

  const orderDocx = await writeZip([
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Order</w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
    { name: 'word/settings.xml', data: text('<?xml version="1.0"?><w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:defaultTabStop w:val="708"/><w:characterSpacingControl w:val="doNotCompress"/></w:settings>') },
  ]);
  const orderDoc = await parseDocx(orderDocx);
  setAutoHyphenation(orderDoc, true);
  const orderXml = new TextDecoder().decode((await readZip(await saveDocx(orderDoc, toBuffer(orderDocx)))).entries.get('word/settings.xml'));
  check('word auto hyphenation schema order', orderXml.indexOf('<w:defaultTabStop') < orderXml.indexOf('<w:autoHyphenation')
    && orderXml.indexOf('<w:autoHyphenation') < orderXml.indexOf('<w:characterSpacingControl'));

  check('word thesaurus', synonymsFor('báo cáo').includes('tường trình')
    && synonymsFor('important').includes('critical')
    && synonymsFor('không có từ này').length === 0,
    JSON.stringify(synonymsFor('báo cáo')));

  const structuredDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:sdt><w:sdtContent><w:p><w:r><w:t>Inside SDT</w:t></w:r></w:p></w:sdtContent></w:sdt>'
      + '<w:p><w:hyperlink w:anchor="target"><w:r><w:t>Jump</w:t></w:r></w:hyperlink></w:p>'
      + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Outer</w:t></w:r></w:p>'
      + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Inner</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
      + '</w:tc></w:tr></w:tbl><w:sectPr/></w:body></w:document>') },
  ]);
  const structuredDoc = await parseDocx(structuredDocx);
  const anchorParagraph = structuredDoc.blocks.find((block) => block.kind === 'paragraph'
    && block.paragraph.runs.some((run) => run.link));
  const structuredTable = structuredDoc.blocks.find((block) => block.kind === 'table');
  const cellText = structuredTable?.kind === 'table'
    ? structuredTable.rows[0][0].map((paragraph) => paragraph.runs.map((run) => run.text).join('')).join('|')
    : '';
  const nestedTable = structuredTable?.kind === 'table' ? structuredTable.nested?.[0] : undefined;
  const nestedText = nestedTable?.rows[0][0]
    .map((paragraph) => paragraph.runs.map((run) => run.text).join('')).join('') ?? '';
  check('word sdt + anchor link + nested table', structuredDoc.blocks[0].kind === 'paragraph'
    && acceptedText(structuredDoc.blocks[0].paragraph) === 'Inside SDT'
    && anchorParagraph?.kind === 'paragraph'
    && anchorParagraph.paragraph.runs.find((run) => run.link)?.link === '#target'
    && cellText.includes('Outer') && nestedText.includes('Inner')
    && structuredTable?.kind === 'table' && structuredTable.nested?.length === 1
    && descendants(structuredDoc.xmlRoot!, 'w:sdt').length === 1
    && descendants(structuredDoc.xmlRoot!, 'w:tbl').length === 2,
    JSON.stringify({ blocks: structuredDoc.blocks.length, cellText, nestedText }));
  const structuredSaved = await parseDocx(await saveDocx(structuredDoc, toBuffer(structuredDocx)));
  const savedStructuredTable = structuredSaved.blocks.find((block) => block.kind === 'table');
  check('word sdt round-trip', structuredSaved.blocks[0].kind === 'paragraph'
    && acceptedText(structuredSaved.blocks[0].paragraph) === 'Inside SDT'
    && savedStructuredTable?.kind === 'table' && savedStructuredTable.nested?.length === 1
    && descendants(structuredSaved.xmlRoot!, 'w:sdt').length === 1
    && descendants(structuredSaved.xmlRoot!, 'w:tbl').length === 2,
    JSON.stringify({ blocks: structuredSaved.blocks.length, tables: descendants(structuredSaved.xmlRoot!, 'w:tbl').length }));

  const deepDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Level1</w:t></w:r></w:p>'
      + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Level2</w:t></w:r></w:p>'
      + '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Level3</w:t></w:r></w:p></w:tc></w:tr></w:tbl>'
      + '</w:tc></w:tr></w:tbl></w:tc></w:tr></w:tbl><w:sectPr/></w:body></w:document>') },
  ]);
  const deepDoc = await parseDocx(deepDocx);
  const deepTop = deepDoc.blocks.find((block) => block.kind === 'table');
  const deepLevel2 = deepTop?.kind === 'table' ? deepTop.nested?.[0] : undefined;
  const deepLevel3 = deepLevel2?.nested?.[0];
  const deepText = deepLevel3?.rows[0][0]
    .map((paragraph) => paragraph.runs.map((run) => run.text).join('')).join('') ?? '';
  check('word nested table depth 3', Boolean(deepLevel2) && Boolean(deepLevel3) && deepText === 'Level3',
    JSON.stringify({ deepText }));

  /* --------------------------- Word notes ------------------------------- */
  const noteDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Đoạn một</w:t></w:r></w:p><w:p><w:r><w:t>Đoạn hai</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>') },
  ]);
  const noteDoc = await parseDocx(noteDocx);
  check('word notes parse empty', (noteDoc.notes?.footnotes.length ?? -1) === 0 && (noteDoc.notes?.endnotes.length ?? -1) === 0);
  if (noteDoc.notes) {
    const footnote = ensureNote(noteDoc, noteDoc.notes, 'footnote', 'Ghi chú chân trang 1', 0);
    const endnote = ensureNote(noteDoc, noteDoc.notes, 'endnote', 'Ghi chú cuối 1', 1);
    check('word note create', footnote?.id === 1 && endnote?.id === 1
      && footnote.refParagraph === 0 && endnote.refParagraph === 1, `${footnote?.id}/${endnote?.id}`);
    setNoteNumbering(sectionAt(noteDoc), noteDoc.notes, 'footnote', 'lowerRoman', 'eachSect');
    const noteSaved = await parseDocx(await saveDocx(noteDoc, toBuffer(noteDocx)));
    const savedFootnotes = noteSaved.notes?.footnotes ?? [];
    const savedEndnotes = noteSaved.notes?.endnotes ?? [];
    check('word footnote round-trip', savedFootnotes.length === 1 && savedFootnotes[0].text === 'Ghi chú chân trang 1'
      && savedFootnotes[0].refParagraph === 0, JSON.stringify(savedFootnotes));
    check('word endnote round-trip', savedEndnotes.length === 1 && savedEndnotes[0].text === 'Ghi chú cuối 1'
      && savedEndnotes[0].refParagraph === 1, JSON.stringify(savedEndnotes));
    check('word note numbering round-trip', noteSaved.notes?.footnoteFormat === 'lowerRoman'
      && noteSaved.notes?.footnoteRestart === 'eachSect',
      `${noteSaved.notes?.footnoteFormat}/${noteSaved.notes?.footnoteRestart}`);
    const removed = deleteNote(noteSaved, noteSaved.notes!, 'footnote', savedFootnotes[0].id);
    const afterDelete = await parseDocx(await saveDocx(noteSaved, toBuffer(await saveDocx(noteDoc, toBuffer(noteDocx)))));
    check('word footnote delete', removed && (afterDelete.notes?.footnotes.length ?? -1) === 0
      && (afterDelete.notes?.endnotes.length ?? -1) === 1,
      JSON.stringify({ f: afterDelete.notes?.footnotes.length, e: afterDelete.notes?.endnotes.length }));
  } else {
    check('word note create', false, 'missing notes model');
  }

  const existingNotesDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footnotes" Target="footnotes.xml"/></Relationships>') },
    { name: 'word/footnotes.xml', data: text('<?xml version="1.0"?><w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:footnote w:type="separator" w:id="-1"><w:p><w:r><w:separator/></w:r></w:p></w:footnote><w:footnote w:id="3"><w:p><w:r><w:t>Chú thích có sẵn</w:t></w:r></w:p></w:footnote></w:footnotes>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Có chú thích</w:t></w:r><w:r><w:footnoteReference w:id="3"/></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>') },
  ]);
  const existingNotes = await parseDocx(existingNotesDocx);
  check('word existing note preserved', existingNotes.notes?.footnotes.length === 1
    && existingNotes.notes?.footnotes[0].text === 'Chú thích có sẵn'
    && existingNotes.notes?.footnotes[0].refParagraph === 0,
    JSON.stringify(existingNotes.notes?.footnotes));
  const existingNotesSaved = await parseDocx(await saveDocx(existingNotes, toBuffer(existingNotesDocx)));
  check('word existing note round-trip', existingNotesSaved.notes?.footnotes[0]?.text === 'Chú thích có sẵn',
    existingNotesSaved.notes?.footnotes[0]?.text ?? 'missing');

  /* ---------------------- Word citations + TOC/bookmark ------------------ */
  const refDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Báo cáo Sprint 12</w:t></w:r></w:p><w:p><w:r><w:t>Đoạn thứ hai</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>') },
  ]);
  const refDoc = await parseDocx(refDocx);
  const sources = refDoc.sources ?? [];
  const source = addCitationSource(refDoc, sources, {
    type: 'book', author: 'Nguyen, An', title: 'Phân tích dữ liệu ERP', year: '2024', publisher: 'NXB Khoa học',
  });
  check('word citation add source', source.tag.startsWith('Nguyen') && sources.length === 1 && apaBibliography(source).includes('NXB'), source.tag);
  const cited = insertCitation(refDoc, sources, [source.tag], 0);
  const bookmark = addBookmark(refDoc, 'BaoCao', 0);
  const referenced = bookmark ? insertCrossReference(refDoc, bookmark, 1) : false;
  const tocCount = insertToc(refDoc);
  check('word citation insert + bookmark + toc', cited && referenced && tocCount === 1 && !!bookmark,
    JSON.stringify({ cited, referenced, tocCount }));
  check('word toc entries', tocEntries(refDoc).length === 1 && tocEntries(refDoc)[0].text.startsWith('Báo cáo Sprint 12'),
    JSON.stringify(tocEntries(refDoc)));
  const tocRemoved = removeToc(refDoc);
  const tocPageMap = new Map<number, number>([[tocEntries(refDoc)[0]?.paragraphIndex ?? 0, 5]]);
  const tocInserted = insertToc(refDoc, 'Mục lục', tocPageMap);
  const tocBlock = refDoc.blocks.find((block) => block.kind === 'paragraph' && block.paragraph.style === 'TOC1');
  check('word toc page map', tocRemoved === 2 && tocInserted === 1 && Boolean(tocBlock)
    && tocBlock?.kind === 'paragraph' && tocBlock.paragraph.runs[0].text.endsWith('\t5'),
    JSON.stringify({ removed: tocRemoved, inserted: tocInserted }));
  const tocCleared = removeToc(refDoc);
  check('word toc remove', tocCleared === 2
    && !refDoc.blocks.some((block) => block.kind === 'paragraph' && /^TOC/.test(block.paragraph.style ?? '')),
    String(tocCleared));
  const tocSyncZip = await writeZip([
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Chương A</w:t></w:r></w:p>'
      + '<w:p><w:pPr><w:pStyle w:val="TOC1"/></w:pPr><w:r><w:t xml:space="preserve">Chương A\t9</w:t></w:r></w:p>'
      + '<w:sectPr/></w:body></w:document>') },
  ]);
  const tocSyncDoc = await parseDocx(tocSyncZip);
  const tocSyncFirst = syncTocPageNumbers(tocSyncDoc, new Map([[0, 5]]));
  const tocSyncBlock = tocSyncDoc.blocks.find((block) => block.kind === 'paragraph'
    && block.paragraph.style === 'TOC1');
  const tocSyncText = tocSyncBlock?.kind === 'paragraph'
    ? tocSyncBlock.paragraph.runs.map((run) => run.text).join('') : '';
  const tocSyncSecond = syncTocPageNumbers(tocSyncDoc, new Map([[0, 5]]));
  check('word toc auto page sync', tocSyncFirst === 1 && tocSyncText.endsWith('\t5') && tocSyncSecond === 0,
    JSON.stringify({ tocSyncText, tocSyncFirst, tocSyncSecond }));
  const tocSyncSaved = await parseDocx(await saveDocx(tocSyncDoc, toBuffer(tocSyncZip)));
  const tocSyncSavedBlock = tocSyncSaved.blocks.find((block) => block.kind === 'paragraph'
    && block.paragraph.style === 'TOC1');
  check('word toc auto page sync round-trip', tocSyncSavedBlock?.kind === 'paragraph'
    && tocSyncSavedBlock.paragraph.runs.map((run) => run.text).join('').endsWith('\t5')
    && descendants(tocSyncSaved.xmlRoot!, 'w:t').some((node) => node.text.endsWith('\t5')),
    JSON.stringify(tocSyncSavedBlock?.kind === 'paragraph' ? tocSyncSavedBlock.paragraph.runs.map((run) => run.text) : null));

  // Duplicate heading titles ("Kết luận" per chapter) must map to the heading in
  // document order, not to the first heading with that title.
  const tocDupZip = await writeZip([
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:p><w:pPr><w:pStyle w:val="TOC3"/></w:pPr><w:r><w:t xml:space="preserve">1.6 Kết luận\t10</w:t></w:r></w:p>'
      + '<w:p><w:pPr><w:pStyle w:val="TOC3"/></w:pPr><w:r><w:t xml:space="preserve">2.6 Kết luận\t11</w:t></w:r></w:p>'
      + '<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>Kết luận</w:t></w:r></w:p>'
      + '<w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>Kết luận</w:t></w:r></w:p>'
      + '<w:sectPr/></w:body></w:document>') },
  ]);
  const tocDupDoc = await parseDocx(tocDupZip);
  syncTocPageNumbers(tocDupDoc, new Map([[2, 37], [3, 61]]));
  const tocDupTexts = tocDupDoc.blocks
    .filter((block) => block.kind === 'paragraph' && block.paragraph.style === 'TOC3')
    .map((block) => block.kind === 'paragraph' ? block.paragraph.runs.map((run) => run.text).join('') : '');
  check('word toc duplicate headings keep document order', tocDupTexts[0]?.endsWith('\t37')
    && tocDupTexts[1]?.endsWith('\t61'),
    JSON.stringify(tocDupTexts));
  insertToc(refDoc, 'Mục lục', new Map([[0, 1]]));
  const refSaved = await parseDocx(await saveDocx(refDoc, toBuffer(refDocx)));
  check('word citation round-trip', refSaved.sources?.length === 1 && refSaved.sources?.[0].title === 'Phân tích dữ liệu ERP'
    && refSaved.sources?.[0].year === '2024', JSON.stringify(refSaved.sources));
  const citationXml = descendants(refSaved.xmlRoot!, 'w:instrText').map((node) => node.text).join('|');
  const citationText = refSaved.blocks[0].kind === 'paragraph' ? refSaved.blocks[0].paragraph.runs.map((run) => run.text).join('') : '';
  check('word citation field round-trip', /CITATION/.test(citationXml) && citationText.includes('(Nguyen, 2024)'),
    `${citationXml.slice(0, 60)} / ${citationText}`);
  check('word bookmark round-trip', parseBookmarks(refSaved).length === 1 && parseBookmarks(refSaved)[0].name === 'BaoCao',
    JSON.stringify(parseBookmarks(refSaved)));
  check('word cross-reference round-trip', /REF BaoCao/.test(citationXml), citationXml.slice(0, 120));
  const refBodyText = refSaved.blocks.map((block) => block.kind === 'paragraph' ? block.paragraph.runs.map((run) => run.text).join('') : '').join('\n');
  check('word toc round-trip', refBodyText.includes('Mục lục') && refBodyText.includes('Báo cáo Sprint 12') && refBodyText.includes('\t1'),
    refBodyText.slice(0, 160));

  const existingSourcesDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdBib" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../customXml/item1.xml"/></Relationships>') },
    { name: 'customXml/item1.xml', data: text('<?xml version="1.0"?><b:Sources xmlns:b="http://schemas.openxmlformats.org/officeDocument/2006/bibliography" SelectedStyle="APA"><b:Source><b:Tag>CoSan2020</b:Tag><b:SourceType>Book</b:SourceType><b:Author><b:Author><b:Last>Tran, Binh</b:Last></b:Author></b:Author><b:Title>Nguồn có sẵn</b:Title><b:Year>2020</b:Year></b:Source></b:Sources>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Body</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>') },
  ]);
  const existingSources = await parseDocx(existingSourcesDocx);
  check('word existing sources preserved', existingSources.sources?.length === 1
    && existingSources.sources[0].tag === 'CoSan2020' && existingSources.sources[0].year === '2020',
    JSON.stringify(existingSources.sources));
  const existingSourcesSaved = await parseDocx(await saveDocx(existingSources, toBuffer(existingSourcesDocx)));
  check('word existing sources round-trip', existingSourcesSaved.sources?.[0]?.title === 'Nguồn có sẵn',
    existingSourcesSaved.sources?.[0]?.title ?? 'missing');

  /* ------------------------- Word equation + ink ------------------------ */
  const mathDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Công thức</w:t></w:r></w:p><w:p><w:r><w:t>Nét mực</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>') },
  ]);
  const mathDoc = await parseDocx(mathDocx);
  insertEquation(mathDoc, { kind: 'fraction', numerator: '1', denominator: '2' }, 0);
  insertEquation(mathDoc, { kind: 'sqrt', text: '16' }, 0);
  insertEquation(mathDoc, { kind: 'superscript', base: 'x', exponent: '3' }, 0);
  insertEquation(mathDoc, { kind: 'subscript', base: 'a', subscript: 'n' }, 0);
  insertEquation(mathDoc, { kind: 'linear', text: 'E = mc^2' }, 1);
  const equations = parseEquations(mathDoc);
  check('word equation insert all kinds', equations.length === 5
    && equations[0].label === '1/2' && equations[1].label === '√(16)'
    && equations[2].label === 'x^3' && equations[3].label === 'a_n' && equations[4].label === 'E = mc^2',
    JSON.stringify(equations.map((equation) => equation.label)));
  const mathSaved = await parseDocx(await saveDocx(mathDoc, toBuffer(mathDocx)));
  check('word equation round-trip', (mathSaved.equations ?? []).length === 5
    && (mathSaved.equations ?? [])[3].label === 'a_n', JSON.stringify((mathSaved.equations ?? []).map((equation) => equation.label)));
  const removeTarget = mathSaved.equations?.[0];
  if (removeTarget) {
    deleteEquation(mathSaved, removeTarget.node);
    const afterDelete = await parseDocx(await saveDocx(mathSaved, toBuffer(mathDocx)));
    check('word equation delete', (afterDelete.equations ?? []).length === 4, String(afterDelete.equations?.length));
  } else {
    check('word equation delete', false, 'missing equation');
  }

  const inkStrokes = mathDoc.inkStrokes ?? [];
  addInkStroke(mathDoc, inkStrokes, {
    color: '#dc2626', width: 3, style: 'highlighter', lineStyle: 'dashed',
    points: [{ x: 0.1, y: 0.2, pressure: 0.35 }, { x: 0.3, y: 0.4, pressure: 0.8 }, { x: 0.5, y: 0.3, pressure: 0.5 }],
    paragraphIndex: 1,
  });
  check('word ink add stroke', inkStrokes.length === 1 && inkStrokes[0].points.length === 3,
    JSON.stringify(inkStrokes[0]?.points));
  const inkSaved = await parseDocx(await saveDocx(mathDoc, toBuffer(mathDocx)));
  const savedInkPoints = (inkSaved.inkStrokes ?? [])[0]?.points ?? [];
  check('word ink round-trip', (inkSaved.inkStrokes ?? []).length === 1
    && savedInkPoints.length === 3
    && Math.abs(savedInkPoints[1].x - 0.3) < 0.001
    && Math.abs((savedInkPoints[0].pressure ?? 0) - 0.35) < 0.01
    && Math.abs((savedInkPoints[1].pressure ?? 0) - 0.8) < 0.01
    && inkSaved.inkStrokes?.[0].style === 'highlighter'
    && inkSaved.inkStrokes?.[0].lineStyle === 'dashed',
    JSON.stringify(inkSaved.inkStrokes));
  const inkPartBytes = (await readZip(await saveDocx(mathDoc, toBuffer(mathDocx)))).entries.get('word/ink/ink1.xml');
  const inkPartXml = inkPartBytes ? new TextDecoder().decode(inkPartBytes) : '';
  const inkZip = await readZip(await saveDocx(mathDoc, toBuffer(mathDocx)));
  const inkRels = new TextDecoder().decode(inkZip.entries.get('word/_rels/document.xml.rels'));
  const inkTypes = new TextDecoder().decode(inkZip.entries.get('[Content_Types].xml'));
  const inkDocXml = new TextDecoder().decode(inkZip.entries.get('word/document.xml'));
  check('word ink InkML part', inkPartXml.includes('xmlns:inkml="http://www.w3.org/2003/InkML"')
    && inkPartXml.includes('<inkml:inkSource xml:id="inkSrc0">')
    && inkPartXml.includes('name="X" type="integer" max="32767" units="in"')
    && inkPartXml.includes('name="F" type="integer" max="1000" units="dev"')
    && inkPartXml.includes('name="color" value="#dc2626"')
    && inkPartXml.includes('name="transparency" value="0.65"')
    && inkPartXml.includes('name="lineStyle" value="dashed"')
    && inkPartXml.includes('<inkml:traceGroup xml:id="page-0">')
    && inkPartXml.includes('brushRef="#br0"')
    && /\d+ \d+ 350,\d+ \d+ 800,\d+ \d+ 500/.test(inkPartXml),
    JSON.stringify({ part: inkPartXml.length }));
  check('word ink OOXML package wiring', inkRels.includes('relationships/customXml')
    && inkRels.includes('word/ink/ink1.xml')
    && inkRels.includes('TargetMode="Internal"')
    && inkTypes.includes('application/inkml+xml')
    && inkDocXml.includes('mc:AlternateContent')
    && inkDocXml.includes('mc:Choice Requires="w14"')
    && inkDocXml.includes('uri="http://schemas.microsoft.com/office/word/2010/wordprocessingInk"')
    && inkDocXml.includes('<w14:contentPart r:id="rIdInk">')
    && inkDocXml.includes('<wp:anchor')
    && !inkDocXml.includes('<w:contentPart '),
    JSON.stringify({ rel: inkRels.includes('ink/ink1.xml'), contentType: inkTypes.includes('application/inkml+xml') }));
  check('word ink anchor bookmark', parseBookmarks(inkSaved).some((bookmark) => bookmark.name === '_InkStrokes') === false
    && descendants(inkSaved.xmlRoot!, 'w:bookmarkStart').some((node) => node.attrs['w:name'] === '_InkStrokes'));
  clearInk(inkSaved, inkSaved.inkStrokes ?? []);
  const inkCleared = await parseDocx(await saveDocx(inkSaved, toBuffer(mathDocx)));
  check('word ink clear', (inkCleared.inkStrokes ?? []).length === 0, String(inkCleared.inkStrokes?.length));

  const existingInkDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdInk" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../customXml/ink.xml"/></Relationships>') },
    { name: 'customXml/ink.xml', data: text('<?xml version="1.0"?><ink:strokes xmlns:ink="http://open-erp.local/office/ink"><ink:stroke id="s1" color="#2563eb" width="2"><ink:point x="0.2" y="0.2"/><ink:point x="0.4" y="0.5"/></ink:stroke></ink:strokes>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Ink</w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const existingInk = await parseDocx(existingInkDocx);
  check('word existing ink preserved', existingInk.inkStrokes?.length === 1 && existingInk.inkStrokes[0].color === '#2563eb',
    JSON.stringify(existingInk.inkStrokes));
  const existingInkSaved = await parseDocx(await saveDocx(existingInk, toBuffer(existingInkDocx)));
  check('word existing ink round-trip', existingInkSaved.inkStrokes?.length === 1, String(existingInkSaved.inkStrokes?.length));

  const inkmlSampleDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/ink/ink1.xml" ContentType="application/inkml+xml"/></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdInk" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/customXml" Target="../word/ink/ink1.xml" TargetMode="Internal"/></Relationships>') },
    { name: 'word/ink/ink1.xml', data: text('<?xml version="1.0"?><inkml:ink xmlns:inkml="http://www.w3.org/2003/InkML"><inkml:definitions><inkml:context xml:id="ctx0"><inkml:inkSource xml:id="inkSrc0"><inkml:traceFormat><inkml:channel name="X" type="integer" max="32767" units="in"/><inkml:channel name="Y" type="integer" max="32767" units="in"/><inkml:channel name="F" type="integer" max="1000" units="dev"/></inkml:traceFormat><inkml:channelProperties><inkml:channelProperty channel="X" name="resolution" value="1000" units="1/in"/><inkml:channelProperty channel="Y" name="resolution" value="1000" units="1/in"/></inkml:channelProperties></inkml:inkSource></inkml:context><inkml:brush xml:id="br0"><inkml:brushProperty name="width" value="0.07938" units="cm"/><inkml:brushProperty name="color" value="#3165BB"/></inkml:brush></inkml:definitions><inkml:traceGroup><inkml:trace xml:id="t1" contextRef="#ctx0" brushRef="#br0">32 635 275,\'34\'0\'109,"0"0"295</inkml:trace></inkml:traceGroup></inkml:ink>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Ink</w:t></w:r><w:r><w:contentPart xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdInk"/></w:r></w:p><w:sectPr><w:pgSz w:w="12240" w:h="15840"/></w:sectPr></w:body></w:document>') },
  ]);
  const inkmlSample = await parseDocx(inkmlSampleDocx);
  const inkmlPoints = inkmlSample.inkStrokes?.[0]?.points ?? [];
  check('word InkML differential trace parse', inkmlSample.inkStrokes?.length === 1
    && inkmlPoints.length === 3
    && Math.abs(inkmlPoints[2].x - 100 / 8500) < 0.0001
    && Math.abs(inkmlPoints[2].y - 635 / 11000) < 0.0001
    && Math.abs((inkmlPoints[2].pressure ?? 0) - 0.7887) < 0.001
    && inkmlSample.inkStrokes?.[0].color === '#3165BB',
    JSON.stringify(inkmlSample.inkStrokes));

  /* ------------------------- Word markup view --------------------------- */
  const markupDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/></Relationships>') },
    { name: 'word/media/image1.png', data: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]) },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:a="a" xmlns:pic="pic" xmlns:wp="wp" xmlns:wp15="wp15"><w:body><w:p><w:r><w:rPr><w:b/><w:rPrChange w:id="5" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:rPr/></w:rPrChange></w:rPr><w:t>A</w:t></w:r><w:ins w:id="1" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:r><w:t>B</w:t></w:r></w:ins><w:del w:id="2" w:author="Alice" w:date="2026-11-16T00:00:00Z"><w:r><w:delText>C</w:delText></w:r></w:del><w:r><w:drawing><wp:inline><wp:extent cx="914400" cy="457200"/><wp:docPr id="1" name="Logo" descr="Logo ERP"/><a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rIdImg"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p><w:p><w:r><w:drawing><wp:inline><wp:extent cx="914400" cy="457200"/><wp:docPr id="2" name="Video"/><wp15:webVideoPr href="https://youtu.be/demo" embeddedUrl="https://youtu.be/embed/demo"/></wp:inline></w:drawing></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const markupDoc = await parseDocx(markupDocx);
  const markupParagraph = markupDoc.blocks[0];
  if (markupParagraph.kind === 'paragraph') {
    const imageRun = markupParagraph.paragraph.runs.find((run) => run.imagePath);
    check('word image parse', imageRun?.imagePath === 'word/media/image1.png'
      && imageRun.imageWidth === 96 && imageRun.imageHeight === 48 && imageRun.alt === 'Logo ERP'
      && markupDoc.packageEntries?.get('word/media/image1.png')?.length === 11,
      JSON.stringify(imageRun));
    const videoRun = markupDoc.blocks[1].kind === 'paragraph'
      ? markupDoc.blocks[1].paragraph.runs.find((run) => run.videoUrl)
      : undefined;
    check('word online video parse', videoRun?.videoUrl === 'https://youtu.be/demo', JSON.stringify(videoRun));
    const formatRevision = listRevisions(markupDoc).find((revision) => revision.type === 'format');
    check('word format revision parsed', formatRevision?.id === 5, JSON.stringify(formatRevision));
    if (formatRevision) {
      rejectRevision(markupDoc, formatRevision.id);
      const runProps = descendants(markupDoc.blocks[0].kind === 'paragraph' ? markupDoc.blocks[0].paragraph.xmlNode! : markupDoc.xmlRoot!, 'w:rPr')[0];
      check('word rPrChange reject restores formatting',
        !runProps?.children.some((child) => child.name === 'w:b')
        && !runProps?.children.some((child) => child.name === 'w:rPrChange'),
        JSON.stringify(runProps?.children.map((child) => child.name)));
      const formatSaved = await parseDocx(await saveDocx(markupDoc, toBuffer(markupDocx)));
      const savedVideo = formatSaved.blocks[1].kind === 'paragraph'
        ? formatSaved.blocks[1].paragraph.runs.find((run) => run.videoUrl)
        : undefined;
      check('word video + format round-trip', savedVideo?.videoUrl === 'https://youtu.be/demo'
        && !descendants(formatSaved.xmlRoot!, 'w:rPrChange').length,
        JSON.stringify(savedVideo));
    } else {
      check('word rPrChange reject restores formatting', false, 'format revision missing');
      check('word video + format round-trip', false, 'format revision missing');
    }
    const all = paragraphSegments(markupParagraph.paragraph, 'all');
    const simple = paragraphSegments(markupParagraph.paragraph, 'simple');
    const none = paragraphSegments(markupParagraph.paragraph, 'none');
    check('word markup all segments', all.length === 3
      && all[0].kind === 'normal' && all[1].kind === 'insert' && all[1].text === 'B'
      && all[2].kind === 'delete' && all[2].text === 'C',
      JSON.stringify(all));
    check('word markup simple/none', simple.length === 2 && simple.map((item) => item.text).join('') === 'AB'
      && none.map((item) => item.text).join('') === 'AB' && simple.every((item) => item.kind === 'normal'),
      JSON.stringify(simple));
    check('word markup revision flag', paragraphHasRevision(markupParagraph.paragraph));
    check('word tracked runs include insertion', markupParagraph.paragraph.runs.map((run) => run.text).join('') === 'AB',
      markupParagraph.paragraph.runs.map((run) => run.text).join(''));

    const acceptedInsert = await parseDocx(await saveDocx(markupDoc, toBuffer(markupDocx)));
    const insertRevision = listRevisions(acceptedInsert).find((revision) => revision.type === 'insert');
    if (insertRevision && acceptedInsert.blocks[0].kind === 'paragraph') {
      acceptRevision(acceptedInsert, insertRevision.id);
      const afterAccept = paragraphSegments(acceptedInsert.blocks[0].paragraph, 'all');
      check('word markup accept integrates', afterAccept.length >= 2
        && afterAccept.some((segment) => segment.text === 'B' && segment.kind === 'normal')
        && afterAccept.some((segment) => segment.text === 'C' && segment.kind === 'delete'),
        JSON.stringify(afterAccept));
    } else {
      check('word markup accept integrates', false, 'insert revision missing');
    }

    const rejected = await parseDocx(await saveDocx(markupDoc, toBuffer(markupDocx)));
    const deleteRevision = listRevisions(rejected).find((revision) => revision.type === 'delete');
    if (deleteRevision && rejected.blocks[0].kind === 'paragraph') {
      rejectRevision(rejected, deleteRevision.id);
      const afterReject = paragraphSegments(rejected.blocks[0].paragraph, 'all');
      check('word markup reject integrates', afterReject.map((segment) => segment.text).join('') === 'ABC'
        && afterReject.some((segment) => segment.text === 'C' && segment.kind === 'normal'),
        JSON.stringify(afterReject));
    } else {
      check('word markup reject integrates', false, 'delete revision missing');
    }

    const editableDoc = await parseDocx(markupDocx);
    const editableBlock = editableDoc.blocks[0];
    if (editableBlock.kind === 'paragraph') {
      setAcceptedText(editableBlock.paragraph, 'Nội dung đã sửa');
      const edited = paragraphSegments(editableBlock.paragraph, 'all');
      const editedImage = editableBlock.paragraph.runs.find((run) => run.imagePath);
      check('word markup edit accepted text', edited.length === 1 && edited[0].text === 'Nội dung đã sửa'
        && edited[0].kind === 'normal' && !!editedImage,
        JSON.stringify(edited));
      const editedSaved = await parseDocx(await saveDocx(editableDoc, toBuffer(markupDocx)));
      const savedBlock = editedSaved.blocks[0];
      const savedImage = savedBlock.kind === 'paragraph'
        ? savedBlock.paragraph.runs.find((run) => run.imagePath)
        : undefined;
      check('word markup edit + image round-trip', savedBlock.kind === 'paragraph'
        && paragraphSegments(savedBlock.paragraph, 'all').map((segment) => segment.text).join('') === 'Nội dung đã sửa'
        && savedImage?.imagePath === 'word/media/image1.png'
        && editedSaved.packageEntries?.get('word/media/image1.png')?.length === 11,
        JSON.stringify(savedImage));
    } else {
      check('word markup edit accepted text', false, 'missing paragraph');
      check('word markup edit + image round-trip', false, 'missing paragraph');
    }
  } else {
    check('word markup all segments', false, 'missing paragraph');
  }

  /* ---------------------- Excel pivot/chart editing ---------------------- */
  const analysisXlsx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>') },
    { name: 'xl/workbook.xml', data: text('<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>') },
    { name: 'xl/_rels/workbook.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>') },
    { name: 'xl/worksheets/sheet1.xml', data: text('<?xml version="1.0"?><worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Khu vực</t></is></c><c r="B1" t="inlineStr"><is><t>Quý</t></is></c><c r="C1" t="inlineStr"><is><t>Doanh thu</t></is></c></row><row r="2"><c r="A2" t="inlineStr"><is><t>Bắc</t></is></c><c r="B2" t="inlineStr"><is><t>Q1</t></is></c><c r="C2"><v>100</v></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>Nam</t></is></c><c r="B3" t="inlineStr"><is><t>Q2</t></is></c><c r="C3"><v>150</v></c></row></sheetData></worksheet>') },
  ]);
  const analysisDoc = await parseXlsx(analysisXlsx);
  check('excel analysis parse empty', analysisDoc.analysis?.pivots.length === 0 && analysisDoc.analysis?.charts.length === 0);
  const pivotConfig = {
    id: 'pivot1', source: 'A1:C3', title: 'Khu vực × Doanh thu',
    rowField: { column: 1, header: 'Khu vực' },
    columnField: { column: 2, header: 'Quý' },
    values: [{ column: 3, aggregate: 'SUM' as const, header: 'Doanh thu' }],
  };
  const chartConfig = {
    id: 'chart1', type: 'line' as const, categories: 'A2:A3', series: [{ range: 'C2:C3', label: 'Doanh thu' }],
    title: 'Doanh thu theo khu vực', showLegend: false, axisTitle: 'VND',
  };
  if (analysisDoc.analysis) {
    upsertPivot(analysisDoc, analysisDoc.analysis, pivotConfig);
    upsertChart(analysisDoc, analysisDoc.analysis, chartConfig);
    saveAnalysis(analysisDoc, analysisDoc.analysis);
  }
  const analysisSaved = await parseXlsx(await saveXlsx(analysisDoc, toBuffer(analysisXlsx)));
  check('excel analysis round-trip', analysisSaved.analysis?.pivots.length === 1
    && analysisSaved.analysis?.charts.length === 1
    && analysisSaved.analysis.pivots[0].source === 'A1:C3'
    && analysisSaved.analysis.charts[0].axisTitle === 'VND',
    JSON.stringify(analysisSaved.analysis));
  const savedPivot = analysisSaved.analysis?.pivots[0];
  const savedChart = analysisSaved.analysis?.charts[0];
  if (savedPivot && savedChart) {
    const pivotResult = buildPivot(analysisSaved.sheets[0], savedPivot);
    const chartModel = buildChartModel(analysisSaved.sheets[0], savedChart);
    const chartLayout = layoutChart(chartModel, 480, 280);
    check('excel saved pivot rebuild', pivotResult.cells[0]?.[0]?.[0] === 100 && pivotResult.cells[1]?.[1]?.[0] === 150,
      JSON.stringify(pivotResult.cells));
    check('excel saved chart rebuild', chartModel.series[0].values.join(',') === '100,150'
      && chartModel.showLegend === false && chartLayout.legend.length === 0
      && chartLayout.axisTitle?.label === 'VND',
      JSON.stringify({ values: chartModel.series[0].values, legend: chartLayout.legend.length, axis: chartLayout.axisTitle }));
  } else {
    check('excel saved pivot rebuild', false, 'missing pivot config');
    check('excel saved chart rebuild', false, 'missing chart config');
  }

  /* ------------------------- formula catalogue 252 ----------------------- */
  check('formula catalogue >= 250', catalogueSize() >= 250, `size=${catalogueSize()}`);
  check('formula SUMSQ', evaluateFormula(book, '=SUMSQ(3,4)') === '25', evaluateFormula(book, '=SUMSQ(3,4)'));
  check('formula GCD/LCM', evaluateFormula(book, '=GCD(12,18)') === '6' && evaluateFormula(book, '=LCM(4,6)') === '12');
  check('formula FACT/COMBIN', evaluateFormula(book, '=FACT(5)') === '120' && evaluateFormula(book, '=COMBIN(5,2)') === '10');
  check('formula STDEV.S', Math.abs(Number(evaluateFormula(book, '=STDEV.S(A1:A4)')) - 12.909944) < 0.01,
    evaluateFormula(book, '=STDEV.S(A1:A4)'));
  check('formula PERCENTILE.INC', evaluateFormula(book, '=PERCENTILE.INC(A1:A4,0.5)') === '25',
    evaluateFormula(book, '=PERCENTILE.INC(A1:A4,0.5)'));
  check('formula CORREL', Math.abs(Number(evaluateFormula(book, '=CORREL(A1:A4,C1:C4)')) - 0.979796) < 0.01,
    evaluateFormula(book, '=CORREL(A1:A4,C1:C4)'));
  check('formula COUNTIFS/MAXIFS',
    evaluateFormula(book, '=COUNTIFS(B1:B4,"Việt Nam",C1:C4,">3")') === '1'
    && evaluateFormula(book, '=MAXIFS(A1:A4,B1:B4,"Việt Nam")') === '30',
    `${evaluateFormula(book, '=COUNTIFS(B1:B4,"Việt Nam",C1:C4,">3")')}/${evaluateFormula(book, '=MAXIFS(A1:A4,B1:B4,"Việt Nam")')}`);
  check('formula TEXTJOIN', evaluateFormula(book, '=TEXTJOIN("-",TRUE,B1:B4)') === 'Việt Nam-Lào-Việt Nam-Campuchia',
    evaluateFormula(book, '=TEXTJOIN("-",TRUE,B1:B4)'));
  check('formula LOOKUP', evaluateFormula(book, '=LOOKUP(25,A1:A4,A1:A4)') === '20',
    evaluateFormula(book, '=LOOKUP(25,A1:A4,A1:A4)'));
  check('formula DATEVALUE/WORKDAY',
    Number(evaluateFormula(book, '=DATEVALUE("2026-11-16")')) === Number(evaluateFormula(book, '=DATE(2026,11,16)'))
    && evaluateFormula(book, '=WORKDAY(DATE(2026,11,13),1)') === evaluateFormula(book, '=DATE(2026,11,16)'),
    `${evaluateFormula(book, '=DATEVALUE("2026-11-16")')}/${evaluateFormula(book, '=WORKDAY(DATE(2026,11,13),1)')}`);
  check('formula IPMT', Math.abs(Number(evaluateFormula(book, '=IPMT(0.1/12,1,360,-1000000)')) + 8333.33) < 1,
    evaluateFormula(book, '=IPMT(0.1/12,1,360,-1000000)'));
  check('formula DEC2HEX', evaluateFormula(book, '=DEC2HEX(255)') === 'FF', evaluateFormula(book, '=DEC2HEX(255)'));
  const cash = makeSheet([['A1', '-100'], ['A2', '60'], ['A3', '60']]);
  const irr = Number(evaluateFormula(cash, '=IRR(A1:A3)'));
  check('formula IRR', irr > 0.13 && irr < 0.14, String(irr));
  const database = makeSheet([
    ['A1', 'Khu vực'], ['B1', 'Doanh thu'],
    ['A2', 'Bắc'], ['B2', '100'],
    ['A3', 'Nam'], ['B3', '200'],
    ['A4', 'Bắc'], ['B4', '150'],
    ['D1', 'Khu vực'], ['D2', 'Bắc'],
  ]);
  check('formula DSUM', evaluateFormula(database, '=DSUM(A1:B4,"Doanh thu",D1:D2)') === '250',
    evaluateFormula(database, '=DSUM(A1:B4,"Doanh thu",D1:D2)'));

  /* ------------------------- catalogue expansion v2 ---------------------- */
  check('formula catalogue >= 400', catalogueSize() >= 400, `size=${catalogueSize()}`);
  check('formula CEILING/FLOOR.MATH', evaluateFormula(book, '=CEILING.MATH(-4.3,2)') === '-4'
    && evaluateFormula(book, '=FLOOR.MATH(-4.3,2)') === '-6',
    `${evaluateFormula(book, '=CEILING.MATH(-4.3,2)')}/${evaluateFormula(book, '=FLOOR.MATH(-4.3,2)')}`);
  check('formula GAMMA/GAMMALN', Math.abs(Number(evaluateFormula(book, '=GAMMA(5)')) - 24) < 1e-6
    && Math.abs(Number(evaluateFormula(book, '=GAMMALN(5)')) - Math.log(24)) < 1e-9,
    evaluateFormula(book, '=GAMMA(5)'));
  check('formula ERF/NORM.S.DIST', evaluateFormula(book, '=ERF(0)') === '0'
    && Math.abs(Number(evaluateFormula(book, '=NORM.S.DIST(0,TRUE)')) - 0.5) < 1e-6,
    evaluateFormula(book, '=NORM.S.DIST(0,TRUE)'));
  check('formula NORM.INV', Math.abs(Number(evaluateFormula(book, '=NORM.INV(0.5,10,2)')) - 10) < 1e-6,
    evaluateFormula(book, '=NORM.INV(0.5,10,2)'));
  check('formula BINOM.DIST', Math.abs(Number(evaluateFormula(book, '=BINOM.DIST(2,4,0.5,FALSE)')) - 0.375) < 1e-9
    && Math.abs(Number(evaluateFormula(book, '=BINOM.DIST(2,4,0.5,TRUE)')) - 0.6875) < 1e-9,
    evaluateFormula(book, '=BINOM.DIST(2,4,0.5,TRUE)'));
  check('formula POISSON.DIST', Math.abs(Number(evaluateFormula(book, '=POISSON.DIST(0,1,FALSE)')) - Math.exp(-1)) < 1e-9,
    evaluateFormula(book, '=POISSON.DIST(0,1,FALSE)'));
  check('formula BETA/T/F distributions', Math.abs(Number(evaluateFormula(book, '=BETA.DIST(0.5,2,2,TRUE)')) - 0.5) < 1e-6
    && Math.abs(Number(evaluateFormula(book, '=T.DIST(0,10,TRUE)')) - 0.5) < 1e-6
    && Math.abs(Number(evaluateFormula(book, '=F.DIST(1,5,5,TRUE)')) - 0.5) < 1e-6
    && Math.abs(Number(evaluateFormula(book, '=CHISQ.DIST.RT(3.841459,1)')) - 0.05) < 1e-3,
    `${evaluateFormula(book, '=BETA.DIST(0.5,2,2,TRUE)')}/${evaluateFormula(book, '=T.DIST(0,10,TRUE)')}/${evaluateFormula(book, '=F.DIST(1,5,5,TRUE)')}/${evaluateFormula(book, '=CHISQ.DIST.RT(3.841459,1)')}`);
  check('formula AVERAGEA/STDEVA', evaluateFormula(book, '=AVERAGEA(A1:A4)') === '25'
    && Math.abs(Number(evaluateFormula(book, '=STDEVA(A1:A4)')) - 12.909944) < 0.01,
    evaluateFormula(book, '=AVERAGEA(A1:A4)'));
  check('formula PERCENTRANK', evaluateFormula(book, '=PERCENTRANK(A1:A4,25)') === '0.5',
    evaluateFormula(book, '=PERCENTRANK(A1:A4,25)'));
  check('formula SUBTOTAL/AGGREGATE', evaluateFormula(book, '=SUBTOTAL(9,A1:A4)') === '100'
    && evaluateFormula(book, '=AGGREGATE(14,6,A1:A4,2)') === '30',
    `${evaluateFormula(book, '=SUBTOTAL(9,A1:A4)')}/${evaluateFormula(book, '=AGGREGATE(14,6,A1:A4,2)')}`);
  check('formula ADDRESS/COLUMNS', evaluateFormula(book, '=ADDRESS(2,3)') === '$C$2'
    && evaluateFormula(book, '=COLUMNS("A1:C5")') === '3' && evaluateFormula(book, '=ROWS("A1:C5")') === '5',
    `${evaluateFormula(book, '=ADDRESS(2,3)')}/${evaluateFormula(book, '=COLUMNS("A1:C5")')}`);
  check('formula WORKDAY.INTL', evaluateFormula(book, '=WORKDAY.INTL(DATE(2026,11,13),1,1)') === evaluateFormula(book, '=DATE(2026,11,16)'),
    evaluateFormula(book, '=WORKDAY.INTL(DATE(2026,11,13),1,1)'));
  check('formula LEFTB/FINDB', evaluateFormula(book, '=LEFTB("OpenERP",4)') === 'Open'
    && evaluateFormula(book, '=FINDB("ERP","OpenERP")') === '5');
  check('formula CUMIPMT', Number(evaluateFormula(book, '=CUMIPMT(0.1/12,360,1000000,1,12,0)')) < -99000
    && Number(evaluateFormula(book, '=CUMIPMT(0.1/12,360,1000000,1,12,0)')) > -100500,
    evaluateFormula(book, '=CUMIPMT(0.1/12,360,1000000,1,12,0)'));
  const xnpvSheet = makeSheet([['A1', '-100'], ['A2', '110'], ['D1', '1'], ['D2', '366']]);
  check('formula XNPV', Math.abs(Number(evaluateFormula(xnpvSheet, '=XNPV(0.1,A1:A2,D1:D2)'))) < 1e-6,
    evaluateFormula(xnpvSheet, '=XNPV(0.1,A1:A2,D1:D2)'));
  check('formula COMPLEX/IMABS', evaluateFormula(book, '=COMPLEX(3,4)') === '3+4i'
    && evaluateFormula(book, '=IMABS("3+4i")') === '5'
    && evaluateFormula(book, '=IMSUM("1+i","2+2i")') === '3+3i',
    `${evaluateFormula(book, '=COMPLEX(3,4)')}/${evaluateFormula(book, '=IMABS("3+4i")')}/${evaluateFormula(book, '=IMSUM("1+i","2+2i")')}`);
  check('formula CONVERT', evaluateFormula(book, '=CONVERT(1,"km","m")') === '1000'
    && evaluateFormula(book, '=CONVERT(100,"c","f")') === '212');


  /* -------------------- CF / DV rule creation + save --------------------- */
  const rulesBase = await saveXlsx(analysisDoc, toBuffer(analysisXlsx));
  const rulesSheet = analysisSaved.sheets[0];
  addConditionalRule(rulesSheet, { range: 'C2:C3', type: 'cellIs', operator: 'greaterThan', value: '120' });
  addValidationRule(rulesSheet, { ranges: 'C2:C3', type: 'whole', operator: 'between', formula1: '1', formula2: '200' });
  const rulesSaved = await parseXlsx(await saveXlsx(analysisSaved, toBuffer(rulesBase)));
  const savedCf = parseConditionalRules(rulesSaved.sheets[0]);
  const savedDv = parseValidations(rulesSaved.sheets[0]);
  check('excel cf rule round-trip', savedCf.some((rule) => rule.type === 'cellIs' && rule.operator === 'greaterThan'
    && rule.formulas[0] === '120'), JSON.stringify(savedCf));
  check('excel dv rule round-trip', savedDv.some((rule) => rule.type === 'whole' && rule.formula1 === '1' && rule.formula2 === '200'),
    JSON.stringify(savedDv));

  /* ------------------------ Table + slicer persistence ------------------- */
  const table = createTableConfig(rulesSaved.sheets[0], 'A1:C3', 'Sales');
  check('excel table create', !!table && table.columns.join(',') === 'Khu vực,Quý,Doanh thu',
    JSON.stringify(table?.columns));
  if (table && rulesSaved.analysis) {
    rulesSaved.analysis.tables.push(table);
    rulesSaved.analysis.slicers.push({
      id: 'slicer1', tableId: table.id, column: 'Khu vực', selected: ['Bắc'],
    });
    saveAnalysis(rulesSaved, rulesSaved.analysis);
    const tableSaved = await parseXlsx(await saveXlsx(rulesSaved, toBuffer(rulesBase)));
    check('excel table/slicer round-trip', tableSaved.analysis?.tables.length === 1
      && tableSaved.analysis?.tables[0].columns.join(',') === 'Khu vực,Quý,Doanh thu'
      && tableSaved.analysis?.slicers[0].selected.join(',') === 'Bắc',
      JSON.stringify(tableSaved.analysis?.slicers));
    const nativeBytes = await saveXlsx(rulesSaved, toBuffer(rulesBase));
    const nativeZip = await readZip(nativeBytes);
    const tableXml = nativeZip.entries.get('xl/tables/table1.xml');
    const sheetXml = nativeZip.entries.get('xl/worksheets/sheet1.xml');
    const sheetRels = nativeZip.entries.get('xl/worksheets/_rels/sheet1.xml.rels');
    const contentTypes = nativeZip.entries.get('[Content_Types].xml');
    const decode = (bytes: Uint8Array | undefined) => bytes ? new TextDecoder('utf-8').decode(bytes) : '';
    check('excel native table part', !!tableXml
      && decode(tableXml).includes('name="Sales"')
      && decode(tableXml).includes('ref="A1:C3"')
      && decode(tableXml).includes('<tableColumn id="1" name="Khu vực"/>')
      && decode(tableXml).includes('tableColumns count="3"'),
      decode(tableXml).slice(0, 220));
    check('excel native table sheet wiring', decode(sheetXml).includes('<tableParts count="1">')
      && decode(sheetXml).includes('r:id="rIdTable1"')
      && decode(sheetRels).includes('relationships/table')
      && decode(sheetRels).includes('../tables/table1.xml')
      && decode(contentTypes).includes('/xl/tables/table1.xml'),
      `${decode(sheetRels).includes('table1.xml')}/${decode(contentTypes).includes('tables/table1.xml')}`);
    const nativeSaved = await parseXlsx(toBuffer(nativeBytes));
    check('excel native table parse', nativeSaved.analysis?.tables.some((item) => item.name === 'Sales'
      && item.source === 'A1:C3' && item.columns.length === 3),
      JSON.stringify(nativeSaved.analysis?.tables));
    if (tableSaved.analysis?.tables[0]) {
      const rows = filterTableRows(tableSaved.sheets[0], tableSaved.analysis.tables[0], tableSaved.analysis.slicers);
      const values = slicerValues(tableSaved.sheets[0], tableSaved.analysis.tables[0], 0);
      check('excel slicer filters rows', rows.length === 1 && rows[0].cells[0] === 'Bắc',
        JSON.stringify(rows));
      check('excel slicer values', values.join(',') === 'Bắc,Nam', values.join(','));
    } else {
      check('excel slicer filters rows', false, 'missing saved table');
      check('excel slicer values', false, 'missing saved table');
    }
  } else {
    check('excel table/slicer round-trip', false, 'could not create table');
    check('excel slicer filters rows', false, 'could not create table');
    check('excel slicer values', false, 'could not create table');
  }

  const realSamplePath = path.join(process.cwd(), 'plugins/office-webapp/web/samples/sample-real-proposal.docx');
  if (fs.existsSync(realSamplePath)) {
    const realBytes = fs.readFileSync(realSamplePath);
    const realBuffer = realBytes.buffer.slice(realBytes.byteOffset, realBytes.byteOffset + realBytes.byteLength) as ArrayBuffer;
    const realZip = await readZip(realBuffer);
    const realDoc = await parseDocx(realBuffer);
    const realTables = realDoc.blocks.filter((block) => block.kind === 'table').length;
    const realText = realDoc.blocks.filter((block) => block.kind === 'paragraph')
      .map((block) => block.kind === 'paragraph' ? block.paragraph.runs.map((run) => run.text).join('') : '')
      .join('\n');
    check('word real proposal parse', realDoc.blocks.length >= 500 && realTables >= 13
      && realDoc.sections?.length === 5
      && [...realZip.entries.keys()].filter((name) => name.startsWith('word/media/')).length === 5
      && realDoc.wordCount > 80000,
      JSON.stringify({ blocks: realDoc.blocks.length, tables: realTables, words: realDoc.wordCount }));
    const contextualRun = realDoc.blocks.filter((block, index) => {
      if (block.kind !== 'paragraph' || !block.paragraph.contextualSpacing) return false;
      const previous = realDoc.blocks[index - 1];
      return previous?.kind === 'paragraph' && previous.paragraph.style === block.paragraph.style;
    });
    check('word contextual spacing collapses list spacing', contextualRun.length > 20
      && contextualRun.every((block) => block.kind === 'paragraph' && block.paragraph.spaceAfterPx === 0 && block.paragraph.spaceBeforePx === 0),
      JSON.stringify({ contextual: contextualRun.length }));
    const storedBreaks = realDoc.blocks.filter((block) => block.kind === 'paragraph' && block.paragraph.storedPageBreak);
    check('word stored page breaks parsed', storedBreaks.length >= 20,
      JSON.stringify({ storedBreaks: storedBreaks.length }));
    const realSaved = await saveDocx(realDoc, realBuffer);
    const realReparsed = await parseDocx(realSaved);
    const realSavedText = realReparsed.blocks.filter((block) => block.kind === 'paragraph')
      .map((block) => block.kind === 'paragraph' ? block.paragraph.runs.map((run) => run.text).join('') : '')
      .join('\n');
    check('word real proposal round-trip', (await readZip(realSaved)).entries.size === realZip.entries.size
      && realSavedText === realText
      && realReparsed.blocks.filter((block) => block.kind === 'table').length === realTables,
      JSON.stringify({ entries: (await readZip(realSaved)).entries.size, bytes: realSaved.length }));
    const spellStarted = Date.now();
    const realIssues = checkWordSpelling(realDoc.blocks);
    const spellMs = Date.now() - spellStarted;
    check('word real proposal spellcheck', realIssues.length > 0 && realIssues.length < 500
      && spellMs < 2000 && !realIssues.some((issue) => issue.word.toLowerCase() === 'coordinate'),
      JSON.stringify({ issues: realIssues.length, spellMs, kinds: spellcheckSummary(realIssues) }));
  }

  {
    const cell = (width: number) => `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="pct"/></w:tcPr><w:p/></w:tc>`;
    const tableXml = parseXml(
      `<w:document><w:body><w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/><w:jc w:val="center"/></w:tblPr>`
      + `<w:tblGrid><w:gridCol w:w="4680"/><w:gridCol w:w="4680"/></w:tblGrid>`
      + `<w:tr>${cell(5000)}${cell(5000)}</w:tr><w:tr>${cell(5000)}${cell(5000)}</w:tr></w:tbl>`
      + `<w:sectPr/></w:body></w:document>`);
    const tableDoc: WordDocument = {
      blocks: parseWordBlocks(tableXml, new Map()),
      wordCount: 0,
      pageSize: { width: 816, height: 1056 },
      warnings: [],
      xmlRoot: tableXml,
    };
    const parsed = tableDoc.blocks[0];
    check('word table layout parsed', parsed?.kind === 'table' && parsed.widthPct === 100 && parsed.align === 'center',
      JSON.stringify(parsed?.kind === 'table' ? { width: parsed.widthPct, align: parsed.align } : null));
    insertTableRow(tableDoc, 0, 0, 'below');
    const afterRow = tableDoc.blocks[0];
    check('word table insert row', afterRow?.kind === 'table' && afterRow.rows.length === 3
      && afterRow.rows.every((row) => row.length === 2),
      JSON.stringify(afterRow?.kind === 'table' ? afterRow.rows.map((row) => row.length) : null));
    check('word inserted row cells are saveable', afterRow?.kind === 'table'
      && afterRow.rows[1].every((cell) => cell.every((paragraph) => paragraph.xmlNode?.name === 'w:p')));
    insertTableColumn(tableDoc, 0, 0, 0, 'right');
    const afterColumn = tableDoc.blocks[0];
    check('word table insert column', afterColumn?.kind === 'table'
      && afterColumn.rows.every((row) => row.length === 3)
      && afterColumn.grid?.length === 3,
      JSON.stringify(afterColumn?.kind === 'table' ? { grid: afterColumn.grid, rows: afterColumn.rows.map((row) => row.length) } : null));
    check('word inserted column cells are saveable', afterColumn?.kind === 'table'
      && afterColumn.rows.every((row) => row.every((cell) => cell.every((paragraph) => paragraph.xmlNode?.name === 'w:p'))));
    check('word table header row toggle', setTableHeaderRow(tableDoc, 0, true)
      && tableDoc.blocks[0].kind === 'table' && tableDoc.blocks[0].headerRows === 1
      && setTableHeaderRow(tableDoc, 0, false) && tableDoc.blocks[0].kind === 'table'
      && (tableDoc.blocks[0].headerRows ?? 0) === 0);
    check('word table cell vertical align', setRowVerticalAlign(tableDoc, 0, 0, 'center')
      && tableDoc.blocks[0].kind === 'table'
      && tableDoc.blocks[0].cellStyles?.[0]?.[0]?.valign === 'center');
    distributeTableColumns(tableDoc, 0);
    const distributed = tableDoc.blocks[0];
    check('word table distribute columns', distributed?.kind === 'table'
      && distributed.grid?.every((width) => Math.abs(width - 33.33) < 0.1),
      JSON.stringify(distributed?.kind === 'table' ? distributed.grid : null));
    deleteTableColumn(tableDoc, 0, 0, 0);
    const afterDeleteColumn = tableDoc.blocks[0];
    check('word table delete column', afterDeleteColumn?.kind === 'table'
      && afterDeleteColumn.rows.every((row) => row.length === 2),
      JSON.stringify(afterDeleteColumn?.kind === 'table' ? afterDeleteColumn.rows.map((row) => row.length) : null));
    deleteTableRow(tableDoc, 0, 0);
    check('word table delete row', tableDoc.blocks[0].kind === 'table' && tableDoc.blocks[0].rows.length === 2);
    setTableAlignment(tableDoc, 0, 'right');
    const tableNode = tableDoc.blocks[0].kind === 'table' ? tableDoc.blocks[0].xmlNode : undefined;
    const jc = tableNode ? findChild(findChild(tableNode, 'w:tblPr'), 'w:jc') : null;
    check('word table alignment', tableDoc.blocks[0].kind === 'table' && tableDoc.blocks[0].align === 'right'
      && attr(jc, 'w:val') === 'right');
    deleteWordTable(tableDoc, 0);
    check('word table delete table', tableDoc.blocks.length === 0
      && descendants(tableXml, 'w:tbl').length === 0);
  }

  {
    // Word stores a merged cell as w:gridSpan plus a w:vMerge restart cell and a
    // continue cell per row it covers.
    const mergedXml = parseXml(
      `<w:document><w:body><w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr>`
      + '<w:tblGrid><w:gridCol w:w="3120"/><w:gridCol w:w="3120"/><w:gridCol w:w="3120"/></w:tblGrid>'
      + '<w:tr><w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/><w:gridSpan w:val="2"/><w:vMerge w:val="restart"/></w:tcPr>'
      + '<w:p><w:r><w:t>Merged</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc></w:tr>'
      + '<w:tr><w:tc><w:tcPr><w:tcW w:w="3333" w:type="pct"/><w:gridSpan w:val="2"/><w:vMerge/></w:tcPr><w:p/></w:tc>'
      + '<w:tc><w:p><w:r><w:t>F</w:t></w:r></w:p></w:tc></w:tr>'
      + '<w:tr><w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc>'
      + '<w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc></w:tr>'
      + '</w:tbl><w:sectPr/></w:body></w:document>');
    const mergedDoc: WordDocument = {
      blocks: parseWordBlocks(mergedXml, new Map()), wordCount: 0,
      pageSize: { width: 816, height: 1056 }, warnings: [], xmlRoot: mergedXml,
    };
    const merged = mergedDoc.blocks[0];
    const spans = merged?.kind === 'table' ? merged.cellSpans : undefined;
    const top = tableCellLayout(spans, 0, 0);
    const continueCell = tableCellLayout(spans, 1, 0);
    check('word merged cells parsed', merged?.kind === 'table'
      && top.colSpan === 2 && top.rowSpan === 2 && !top.covered
      && continueCell.covered && tableColumnCount(spans) === 3,
      JSON.stringify({ top, continueCell, columns: tableColumnCount(spans) }));

    // Merge a 2x2 run the way the ribbon command does.
    check('word table merge cells', mergeTableCells(mergedDoc, 0, { row: 2, cell: 0 }, { row: 2, cell: 1 })
      && mergedDoc.blocks[0].kind === 'table' && mergedDoc.blocks[0].rows[2].length === 2,
      JSON.stringify(mergedDoc.blocks[0].kind === 'table' ? mergedDoc.blocks[0].rows.map((row) => row.length) : null));
    const tableXmlNode = mergedDoc.blocks[0].kind === 'table' ? mergedDoc.blocks[0].xmlNode : undefined;
    const lastRowNode = tableXmlNode ? findChildren(tableXmlNode, 'w:tr').at(-1) : undefined;
    const lastRowCells = lastRowNode ? findChildren(lastRowNode, 'w:tc') : [];
    const gridSpanNode = findChild(findChild(lastRowCells[0], 'w:tcPr'), 'w:gridSpan');
    check('word table merge writes gridSpan', attr(gridSpanNode, 'w:val') === '2'
      && mergedDoc.blocks[0].kind === 'table' && mergedDoc.blocks[0].cellSpans?.[2]?.[0]?.colSpan === 2,
      JSON.stringify({ gridSpan: attr(gridSpanNode, 'w:val') }));
    check('word table merge joins text', mergedDoc.blocks[0].kind === 'table'
      && mergedDoc.blocks[0].rows[2][0].map((paragraph) => paragraph.runs.map((run) => run.text).join('')).join('') === 'AB',
      JSON.stringify(mergedDoc.blocks[0].kind === 'table'
        ? mergedDoc.blocks[0].rows[2][0].map((paragraph) => paragraph.runs.map((run) => run.text).join('')) : null));

    check('word table split cells', splitTableCells(mergedDoc, 0, 2, 0, 1, 2)
      && mergedDoc.blocks[0].kind === 'table' && mergedDoc.blocks[0].rows[2].length === 3
      && mergedDoc.blocks[0].cellSpans?.[2]?.every((span) => !span?.colSpan),
      JSON.stringify(mergedDoc.blocks[0].kind === 'table' ? mergedDoc.blocks[0].rows.map((row) => row.length) : null));

    // Table Design: theme-linked presets and a border painter over a cell range.
    const styleDoc = (() => {
      const xml = parseXml(
        '<w:document><w:body><w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr>'
        + '<w:tblGrid><w:gridCol w:w="3120"/><w:gridCol w:w="3120"/></w:tblGrid>'
        + '<w:tr><w:tc><w:p><w:r><w:t>A</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>B</w:t></w:r></w:p></w:tc></w:tr>'
        + '<w:tr><w:tc><w:p><w:r><w:t>C</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>D</w:t></w:r></w:p></w:tc></w:tr>'
        + '</w:tbl><w:sectPr/></w:body></w:document>');
      return { blocks: parseWordBlocks(xml, new Map()), wordCount: 0, pageSize: { width: 816, height: 1056 }, warnings: [], xmlRoot: xml } as WordDocument;
    })();
    const themed = applyTableStyle(styleDoc, 0, 'accentHeader', { accent: '#FF0000', font: 'Arial' });
    const styledBlock = styleDoc.blocks[0];
    check('word table theme-linked preset', themed && styledBlock.kind === 'table'
      && styledBlock.cellStyles?.[0]?.[0]?.fill === '#FF0000'
      && styledBlock.rows[0][0][0].runs[0]?.bold === true
      && styledBlock.rows[0][0][0].runs[0]?.color === '#FFFFFF'
      && styledBlock.rows[0][0][0].runs[0]?.font === 'Arial',
      JSON.stringify(styledBlock.kind === 'table' ? { cell: styledBlock.cellStyles?.[0]?.[0], run: styledBlock.rows[0][0][0].runs[0] } : null));

    const painted = applyTableCellBorder(styleDoc, 0, { row: 0, cell: 0, row2: 1, cell2: 1 }, 'bottom', true)
      && styledBlock.kind === 'table'
      && styledBlock.cellStyles?.[0]?.[0]?.borderBottom === true
      && styledBlock.cellStyles?.[1]?.[1]?.borderBottom === true
      && styledBlock.cellStyles?.[0]?.[1]?.borderBottom === true;
    const paintedXml = styledBlock.kind === 'table'
      ? findChildren(findChildren(styledBlock.xmlNode!, 'w:tr')[1], 'w:tc')
      : [];
    const paintedEdge = paintedXml[1] ? findChild(findChild(paintedXml[1], 'w:tcPr'), 'w:tcBorders') : undefined;
    check('word table border painter range', painted
      && attr(findChild(paintedEdge, 'w:bottom'), 'w:val') === 'single',
      JSON.stringify({ painted, edge: attr(findChild(paintedEdge, 'w:bottom'), 'w:val') }));
    applyTableCellBorder(styleDoc, 0, { row: 0, cell: 0, row2: 1, cell2: 1 }, 'bottom', false);
    check('word table border painter clears', styledBlock.kind === 'table'
      && styledBlock.cellStyles?.[1]?.[1]?.borderBottom === false,
      JSON.stringify(styledBlock.kind === 'table' ? styledBlock.cellStyles?.[1]?.[1] : null));

    // Word keeps a table preset as a real w:style type="table" + w:tblStyle id.
    const stylesPart = () => {
      const bytes = styleDoc.packageEntries?.get('word/styles.xml');
      return bytes ? new TextDecoder('utf-8').decode(bytes) : '';
    };
    const tableStyleId = styledBlock.kind === 'table'
      ? attr(findChild(findChild(styledBlock.xmlNode!, 'w:tblPr'), 'w:tblStyle'), 'w:val') : undefined;
    const accentStyles = stylesPart();
    check('word table style part firstRow', tableStyleId === 'OpenErpTableAccentHeader'
      && accentStyles.includes('w:type="table"')
      && accentStyles.includes('w:styleId="OpenErpTableAccentHeader"')
      && accentStyles.includes('w:type="firstRow"')
      && accentStyles.includes('w:fill="FF0000"'),
      JSON.stringify({ tableStyleId, part: accentStyles.slice(0, 160) }));

    applyTableStyle(styleDoc, 0, 'accentStriped', { accent: '#00FF00', accents: ['#00FF00', '#0000FF'] });
    const bandedStyles = stylesPart();
    const bandedId = styledBlock.kind === 'table'
      ? attr(findChild(findChild(styledBlock.xmlNode!, 'w:tblPr'), 'w:tblStyle'), 'w:val') : undefined;
    check('word table style part band1Horz', bandedId === 'OpenErpTableAccentStriped'
      && bandedStyles.includes('w:type="band1Horz"')
      && bandedStyles.includes('w:fill="DBDBFF"')
      && bandedStyles.includes('w:styleId="OpenErpTableAccentStriped"'),
      JSON.stringify({ bandedId, band1: bandedStyles.slice(bandedStyles.indexOf('band1Horz'), bandedStyles.indexOf('band1Horz') + 120) }));

    // A column command on a merged table must keep the grid consistent.
    const beforeColumns = tableColumnCount(mergedDoc.blocks[0].kind === 'table' ? mergedDoc.blocks[0].cellSpans : undefined);
    insertTableColumn(mergedDoc, 0, 0, 0, 'right');
    const afterInsert = mergedDoc.blocks[0].kind === 'table' ? mergedDoc.blocks[0].cellSpans : undefined;
    check('word merged table insert column', tableColumnCount(afterInsert) === beforeColumns + 1
      && mergedDoc.blocks[0].kind === 'table' && mergedDoc.blocks[0].rows.every((row, index) => row.length === afterInsert?.[index]?.length),
      JSON.stringify({ beforeColumns, afterColumns: tableColumnCount(afterInsert) }));
  }

  {
    // Saved merges must reopen as merges (w:gridSpan + w:vMerge restart/continue).
    const documentXml = '<?xml version="1.0"?>'
      + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'
      + '<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr>'
      + '<w:tblGrid><w:gridCol w:w="4680"/><w:gridCol w:w="4680"/></w:tblGrid>'
      + '<w:tr><w:tc><w:tcPr><w:tcW w:w="5000" w:type="pct"/></w:tcPr><w:p><w:r><w:t>Left</w:t></w:r></w:p></w:tc>'
      + '<w:tc><w:tcPr><w:tcW w:w="5000" w:type="pct"/></w:tcPr><w:p><w:r><w:t>Right</w:t></w:r></w:p></w:tc></w:tr>'
      + '<w:tr><w:tc><w:tcPr><w:tcW w:w="5000" w:type="pct"/></w:tcPr><w:p><w:r><w:t>Below</w:t></w:r></w:p></w:tc>'
      + '<w:tc><w:tcPr><w:tcW w:w="5000" w:type="pct"/></w:tcPr><w:p><w:r><w:t>Value</w:t></w:r></w:p></w:tc></w:tr>'
      + '</w:tbl><w:sectPr/></w:body></w:document>';
    const packageBuffer = await writeZip([
      {
        name: '[Content_Types].xml',
        data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>'),
      },
      {
        name: 'word/_rels/document.xml.rels',
        data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>'),
      },
      { name: 'word/document.xml', data: text(documentXml) },
    ]);
    const reopened = await parseDocx(packageBuffer);
    const mergedBoth = mergeTableCells(reopened, 0, { row: 0, cell: 0 }, { row: 1, cell: 1 });
    const saved = await saveDocx(reopened, toBuffer(packageBuffer));
    const after = await parseDocx(saved);
    const afterSpans = after.blocks[0]?.kind === 'table' ? after.blocks[0].cellSpans : undefined;
    check('word merged cells save round-trip', mergedBoth
      && after.blocks[0]?.kind === 'table' && after.blocks[0].rows.length === 2
      && afterSpans?.[0]?.[0]?.colSpan === 2 && afterSpans?.[0]?.[0]?.vMerge === 'restart'
      && afterSpans?.[1]?.[0]?.vMerge === 'continue'
      && tableCellLayout(afterSpans, 0, 0).rowSpan === 2,
      JSON.stringify(afterSpans));
  }

  const markdown = wordToMarkdown({
    blocks: [
      { kind: 'paragraph', paragraph: { headingLevel: 1, runs: [{ text: 'Tiêu đề' }] } },
      { kind: 'paragraph', paragraph: { runs: [{ text: 'đậm', bold: true }, { text: ' thường' }] } },
      { kind: 'paragraph', paragraph: { listType: 'bullet', runs: [{ text: 'mục' }] } },
      {
        kind: 'table',
        rows: [
          [[{ runs: [{ text: 'A' }] }], [{ runs: [{ text: 'B' }] }]],
          [[{ runs: [{ text: '1' }] }], [{ runs: [{ text: '2' }] }]],
        ],
      },
    ],
    wordCount: 5, pageSize: { width: 816, height: 1056 }, warnings: [],
  });
  check('word markdown export headings/format/list/table',
    markdown.includes('# Tiêu đề') && markdown.includes('**đậm** thường')
    && markdown.includes('- mục') && markdown.includes('| A | B |')
    && markdown.includes('| --- | --- |') && markdown.includes('| 1 | 2 |'),
    markdown);

  const rasterJpeg = new Uint8Array([0xFF, 0xD8, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0xFF, 0xD9]);
  const exportedPdf = imagesToPdf([
    {
      jpeg: rasterJpeg, width: 1632, height: 2112, pageWidth: 612, pageHeight: 792,
      textLines: [{ text: 'Xin chào', x: 72, y: 700, size: 12 }],
    },
    { jpeg: rasterJpeg, width: 1684, height: 1190, pageWidth: 841.89, pageHeight: 595.28 },
  ]);
  const exportedInfo = parsePdfInfo(exportedPdf);
  const exportedText = new TextDecoder('latin1').decode(exportedPdf);
  check('word pdf export structure', exportedText.startsWith('%PDF-1.4')
    && exportedInfo.pageCount === 2 && exportedInfo.width === 816 && exportedInfo.height === 1056
    && exportedText.includes('/Filter /DCTDecode') && exportedText.includes('/MediaBox [0 0 841.89 595.28]')
    && exportedText.includes('/ToUnicode') && exportedText.includes('<00580069006e00200063006800e0006f> Tj'),
    JSON.stringify(exportedInfo));

  const smartArtDocx = await writeZip([
    { name: '[Content_Types].xml', data: text('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>') },
    { name: 'word/_rels/document.xml.rels', data: text('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>') },
    { name: 'word/document.xml', data: text('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body><w:p><w:r><w:t>Before</w:t></w:r></w:p><w:sectPr/></w:body></w:document>') },
  ]);
  const smartArtDoc = await parseDocx(smartArtDocx);
  const smartArtBlock = insertWordSmartArt(smartArtDoc, ['Ý tưởng', 'Triển khai', 'Kết quả']);
  const smartArtRun = smartArtBlock?.kind === 'paragraph' ? smartArtBlock.paragraph.runs[0] : null;
  const smartArtEntries = smartArtDoc.packageEntries ?? new Map();
  const smartArtRels = new TextDecoder().decode(smartArtEntries.get('word/_rels/document.xml.rels'));
  const smartArtTypes = new TextDecoder().decode(smartArtEntries.get('[Content_Types].xml'));
  check('word smartart standard data+layout parts', Boolean(smartArtRun?.smartArt)
    && smartArtEntries.has('word/diagrams/data1.xml')
    && smartArtEntries.has('word/diagrams/layout1.xml')
    && smartArtRels.includes('diagramData') && smartArtRels.includes('diagramLayout')
    && smartArtTypes.includes('drawingml.diagramData') && smartArtTypes.includes('drawingml.diagramLayout')
    && new TextDecoder().decode(smartArtEntries.get('word/diagrams/layout1.xml')).includes('urn:microsoft.com/office/officeart/2005/8/layout/default')
    && new TextDecoder().decode(smartArtEntries.get('word/diagrams/data1.xml')).includes('colorful4'),
    JSON.stringify([...(smartArtEntries.keys())].filter((name) => name.includes('diagrams'))));

  const smartArtSaved = await parseDocx(await saveDocx(smartArtDoc, toBuffer(smartArtDocx)));
  const savedSmartArtRun = smartArtSaved.blocks
    .flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : [])
    .find((run) => run.smartArt);
  check('word smartart round-trip', savedSmartArtRun?.smartArt?.nodes.map((node) => node.text).join('|') === 'Ý tưởng|Triển khai|Kết quả'
    && descendants(smartArtSaved.xmlRoot!, 'dgm:relIds').length === 1
    && smartArtParts(smartArtSaved).length === 2,
    JSON.stringify(savedSmartArtRun?.smartArt?.nodes.map((node) => node.text)));

  if (savedSmartArtRun) updateWordSmartArt(savedSmartArtRun, ['Một', 'Hai']);
  const smartArtEdited = await parseDocx(await saveDocx(smartArtSaved, toBuffer(await saveDocx(smartArtDoc, toBuffer(smartArtDocx)))));
  const editedSmartArtRun = smartArtEdited.blocks
    .flatMap((block) => block.kind === 'paragraph' ? block.paragraph.runs : [])
    .find((run) => run.smartArt);
  check('word smartart edit round-trip', editedSmartArtRun?.smartArt?.nodes.map((node) => node.text).join('|') === 'Một|Hai',
    JSON.stringify(editedSmartArtRun?.smartArt?.nodes.map((node) => node.text)));

  /* ---------- Multi-format Word + OLE2 + OOXML enhancements ------------ */
  const samplesRoot = 'D:/Projects/open-erp/plugins/office-webapp/web/samples';
  const tmpRoot = 'D:/Projects/open-erp/plugins/office-webapp/web/.tmp';
  const readSampleBuf = (name: string): ArrayBuffer => {
    const raw = fs.readFileSync(path.join(samplesRoot, name));
    return raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength);
  };
  const docTextOf = (doc: WordDocument): string => doc.blocks.map((block) => {
    if (block.kind === 'paragraph') return block.paragraph.runs.map((r) => r.text ?? '').join('');
    return block.rows.map((row) => row.map((cell) => cell.map((p) => p.runs.map((r) => r.text ?? '').join('')).join(' ')).join(' | ')).join('\n');
  }).join('\n');

  // 1. OLE2 CFBF reader on real Word 16 .doc + corrupt guards
  const realDocBuf = readSampleBuf('qa-formats-real.doc');
  const ole2 = readOle2(realDocBuf);
  const streams = ole2.listStreams();
  check('ole2 streams listed from real doc', streams.includes('WordDocument') && (ole2.readStream('WordDocument')?.length ?? 0) > 512,
    JSON.stringify(streams));
  let ole2CorruptCode = '';
  try {
    readOle2(new Uint8Array(512).buffer);
  } catch (err) {
    ole2CorruptCode = (err as { code?: string }).code ?? '';
  }
  check('ole2 invalid header blocked', ole2CorruptCode === 'OFFICE_OLE2_CORRUPT', ole2CorruptCode);

  // Build corrupt FAT cycle test
  const loopBuf = new Uint8Array(512 * 4);
  loopBuf.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], 0);
  const loopView = new DataView(loopBuf.buffer);
  loopView.setUint16(0x1e, 9, true); // 512B sectors
  loopView.setUint16(0x20, 6, true);
  loopView.setUint32(0x2c, 1, true); // 1 FAT sector
  loopView.setUint32(0x30, 1, true); // dir sector 1
  loopView.setUint32(0x38, 4096, true);
  loopView.setInt32(0x4c, 0, true); // FAT in sector 0 (offset 512)
  loopView.setUint32(512 + 4, 2, true); // dir sector 1 -> 2
  loopView.setUint32(512 + 8, 1, true); // dir sector 2 -> 1 (cycle!)
  let ole2CycleCode = '';
  try {
    readOle2(loopBuf.buffer);
  } catch (err) {
    ole2CycleCode = (err as { code?: string }).code ?? '';
  }
  check('ole2 fat cycle blocked', ole2CycleCode === 'OFFICE_OLE2_CORRUPT', ole2CycleCode);

  // 2. Real Word 16 multi-format suite
  const realDocxOpen = await openOfficeFile('qa-formats-real.docx', readSampleBuf('qa-formats-real.docx'));
  const realDocxText = docTextOf(realDocxOpen.word!);
  check('real word16 docx opened', realDocxOpen.app === 'word'
    && realDocxText.includes('Báo cáo kiểm thử đa định dạng Word')
    && realDocxText.includes('Đọc tài liệu Word đa định dạng')
    && realDocxOpen.word!.blocks.some((b) => b.kind === 'table'),
    JSON.stringify({ blocks: realDocxOpen.word?.blocks.length }));

  const realDocOpen = await openOfficeFile('qa-formats-real.doc', realDocBuf);
  const realDocText = docTextOf(realDocOpen.word!);
  const realDocTbl = realDocOpen.word!.blocks.find((b) => b.kind === 'table');
  const realDocImg = realDocOpen.word!.blocks.flatMap((b) => b.kind === 'paragraph' ? b.paragraph.runs : []).find((r) => r.imagePath);
  check('real word16 doc opened', realDocOpen.app === 'word'
    && realDocOpen.word?.sourceFormat === 'doc'
    && realDocOpen.word?.readOnlyLegacy === true
    && realDocOpen.warnings.includes('OFFICE_LEGACY_FORMAT_READONLY')
    && realDocText.includes('Báo cáo kiểm thử đa định dạng Word')
    && realDocText.includes('Đọc tài liệu Word đa định dạng')
    && realDocTbl?.kind === 'table'
    && realDocTbl.rows.length === 3
    && realDocTbl.cellSpans?.[0]?.[0]?.colSpan === 2
    && realDocImg?.imageWidth === 96 && realDocImg?.imageHeight === 48,
    JSON.stringify({ warnings: realDocOpen.warnings, rows: realDocTbl?.kind === 'table' ? realDocTbl.rows.length : 0, span: realDocTbl?.kind === 'table' ? realDocTbl.cellSpans : null, img: realDocImg, snippet: realDocText.slice(0, 260) }));

  // Save .doc as .docx & re-parse
  const exportedFromDoc = await saveDocx(realDocOpen.word!, realDocBuf);
  fs.mkdirSync(tmpRoot, { recursive: true });
  fs.writeFileSync(path.join(tmpRoot, 'export-from-doc.docx'), exportedFromDoc);
  const reopenedDoc = await openOfficeFile('export-from-doc.docx', toBuffer(exportedFromDoc));
  check('legacy doc saveAs docx round-trip', reopenedDoc.app === 'word'
    && !reopenedDoc.word?.readOnlyLegacy
    && docTextOf(reopenedDoc.word!).includes('Báo cáo kiểm thử đa định dạng Word')
    && reopenedDoc.word!.blocks.some((b) => b.kind === 'table'),
    JSON.stringify({ blocks: reopenedDoc.word?.blocks.length }));

  const realRtfBuf = readSampleBuf('qa-formats-real.rtf');
  const realRtfOpen = await openOfficeFile('qa-formats-real.rtf', realRtfBuf);
  const realRtfText = docTextOf(realRtfOpen.word!);
  const realRtfTbl = realRtfOpen.word!.blocks.find((b) => b.kind === 'table');
  check('real word16 rtf opened', realRtfOpen.app === 'word'
    && realRtfOpen.word?.sourceFormat === 'rtf'
    && realRtfOpen.word?.readOnlyLegacy === true
    && realRtfText.includes('Báo cáo kiểm thử đa định dạng Word')
    && realRtfText.includes('Đọc tài liệu Word đa định dạng')
    && realRtfOpen.word?.notes?.footnotes.length === 1
    && realRtfOpen.word.notes.footnotes[0].text.includes('đa định dạng')
    && !realRtfOpen.warnings.includes('OFFICE_VECTOR_IMAGE_UNSUPPORTED')
    && realRtfTbl?.kind === 'table'
    && realRtfTbl.rows.length === 3
    && realRtfTbl.cellSpans?.[0]?.[0]?.colSpan === 2,
    JSON.stringify({ footnotes: realRtfOpen.word?.notes?.footnotes, warnings: realRtfOpen.warnings, span: realRtfTbl?.kind === 'table' ? realRtfTbl.cellSpans : null }));
  const exportedFromRtf = await saveDocx(realRtfOpen.word!, realRtfBuf);
  fs.writeFileSync(path.join(tmpRoot, 'export-from-rtf.docx'), exportedFromRtf);

  const realOdtBuf = readSampleBuf('qa-formats-real.odt');
  const realOdtOpen = await openOfficeFile('qa-formats-real.odt', realOdtBuf);
  const realOdtText = docTextOf(realOdtOpen.word!);
  const realOdtTbl = realOdtOpen.word!.blocks.find((b) => b.kind === 'table');
  check('real word16 odt opened', realOdtOpen.app === 'word'
    && realOdtOpen.word?.sourceFormat === 'odt'
    && realOdtOpen.word?.readOnlyLegacy === true
    && realOdtText.includes('Báo cáo kiểm thử đa định dạng Word')
    && realOdtText.includes('Đọc tài liệu Word đa định dạng')
    && realOdtTbl?.kind === 'table'
    && realOdtTbl.rows.length === 3
    && realOdtTbl.rows[0].length === 2
    && realOdtTbl.cellSpans?.[0]?.[0]?.colSpan === 2,
    JSON.stringify({ rows: realOdtTbl?.kind === 'table' ? realOdtTbl.rows.map((r) => r.length) : 0, span: realOdtTbl?.kind === 'table' ? realOdtTbl.cellSpans : null }));
  const exportedFromOdt = await saveDocx(realOdtOpen.word!, realOdtBuf);
  fs.writeFileSync(path.join(tmpRoot, 'export-from-odt.docx'), exportedFromOdt);

  const realDotxOpen = await openOfficeFile('qa-formats-real.dotx', readSampleBuf('qa-formats-real.dotx'));
  check('real word16 dotx opened', realDotxOpen.app === 'word'
    && realDotxOpen.word?.sourceFormat === 'dotx'
    && realDotxOpen.warnings.includes('OFFICE_TEMPLATE_OPENED_AS_DOCX')
    && docTextOf(realDotxOpen.word!).includes('Báo cáo kiểm thử đa định dạng Word'));

  const realFlatXmlOpen = await openOfficeFile('qa-formats-real.xml', readSampleBuf('qa-formats-real.xml'));
  check('real word16 flat opc xml opened', realFlatXmlOpen.app === 'word'
    && docTextOf(realFlatXmlOpen.word!).includes('Báo cáo kiểm thử đa định dạng Word')
    && realFlatXmlOpen.word!.blocks.some((b) => b.kind === 'table'));

  const realWord2003Open = await openOfficeFile('qa-formats-word2003.xml', readSampleBuf('qa-formats-word2003.xml'));
  check('real word16 word2003 xml opened', realWord2003Open.app === 'word'
    && docTextOf(realWord2003Open.word!).includes('Báo cáo kiểm thử đa định dạng Word')
    && realWord2003Open.word!.blocks.some((b) => b.kind === 'table'));

  let macroDocmCode = '';
  try {
    await openOfficeFile('qa-formats-macro.docm', readSampleBuf('qa-formats-macro.docm'));
  } catch (err) {
    macroDocmCode = (err as { code?: string }).code ?? '';
  }
  check('macro docm rejected', macroDocmCode === 'OFFICE_MACRO_FILE_UNSUPPORTED', macroDocmCode);

  let macroDotmCode = '';
  try {
    assertExtensionMatches('dotm', detectFileKind(new Uint8Array([0x50, 0x4b, 0x03, 0x04])));
  } catch (err) {
    macroDotmCode = (err as { code?: string }).code ?? '';
  }
  check('macro dotm rejected', macroDotmCode === 'OFFICE_MACRO_FILE_UNSUPPORTED', macroDotmCode);

  // 3. Disguised .doc sniffing & encrypted .doc rejection
  const rtfAsDocBytes = text('{\\rtf1\\ansi{\\*\\generator Word}\\pard Xin chao tu RTF-as-DOC\\par}');
  const rtfAsDocOpen = await openOfficeFile('legacy-rtf.doc', toBuffer(rtfAsDocBytes));
  check('rtf disguised as doc opened', rtfAsDocOpen.app === 'word'
    && rtfAsDocOpen.word?.readOnlyLegacy === true
    && docTextOf(rtfAsDocOpen.word!).includes('Xin chao tu RTF-as-DOC'));

  const htmlAsDocBytes = text('<!DOCTYPE html><html><body><h1>Báo cáo HTML</h1><table><tr><td>Ô 1</td><td>Ô 2</td></tr></table></body></html>');
  const htmlAsDocOpen = await openOfficeFile('web-export.doc', toBuffer(htmlAsDocBytes));
  check('html disguised as doc opened', htmlAsDocOpen.app === 'word'
    && htmlAsDocOpen.word?.readOnlyLegacy === true
    && docTextOf(htmlAsDocOpen.word!).includes('Báo cáo HTML')
    && htmlAsDocOpen.word!.blocks.some((b) => b.kind === 'table'));

  // Encrypted synthetic OLE2 .doc
  const encDocBuf = new Uint8Array(512 * 4);
  encDocBuf.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], 0);
  const encView = new DataView(encDocBuf.buffer);
  encView.setUint16(0x18, 0x003e, true);
  encView.setUint16(0x1a, 0x0003, true);
  encView.setUint16(0x1c, 0xfffe, true);
  encView.setUint16(0x1e, 9, true); // 512 sector
  encView.setUint16(0x20, 6, true);
  encView.setUint32(0x2c, 1, true); // 1 FAT
  encView.setUint32(0x30, 1, true); // dir sector 1
  encView.setUint32(0x38, 4096, true);
  encView.setInt32(0x3c, -2, true); // no minifat
  encView.setInt32(0x4c, 0, true); // FAT at sector 0
  // FAT: sector 0=FATSECT (-3), 1=ENDOFCHAIN (-2), 2=ENDOFCHAIN (-2)
  encView.setInt32(512 + 0, -3, true);
  encView.setInt32(512 + 4, -2, true);
  encView.setInt32(512 + 8, -2, true);
  // Dir entry 0 = Root Entry (offset 1024), entry 1 = WordDocument (offset 1024+128)
  const writeDirName = (off: number, name: string) => {
    for (let i = 0; i < name.length; i++) encView.setUint16(off + i * 2, name.charCodeAt(i), true);
    encView.setUint16(off + name.length * 2, 0, true);
    encView.setUint16(off + 0x40, (name.length + 1) * 2, true);
  };
  writeDirName(1024, 'Root Entry');
  encDocBuf[1024 + 0x42] = 5; // root
  encDocBuf[1024 + 0x43] = 1; // black
  encView.setInt32(1024 + 0x44, -1, true);
  encView.setInt32(1024 + 0x48, -1, true);
  encView.setInt32(1024 + 0x4c, 1, true); // child=1
  writeDirName(1024 + 128, 'WordDocument');
  encDocBuf[1024 + 128 + 0x42] = 2; // stream
  encDocBuf[1024 + 128 + 0x43] = 1;
  encView.setInt32(1024 + 128 + 0x44, -1, true);
  encView.setInt32(1024 + 128 + 0x48, -1, true);
  encView.setInt32(1024 + 128 + 0x4c, -1, true);
  encView.setUint32(1024 + 128 + 0x74, 2, true); // start sector 2
  encView.setUint32(1024 + 128 + 0x78, 512, true); // 512 bytes (uses regular FAT)
  // WordDocument FIB at offset 1536 (sector 2): wIdent=0xA5EC, flags bit 8 (0x0100 fEncrypted)
  encView.setUint16(1536 + 0x00, 0xa5ec, true);
  encView.setUint16(1536 + 0x0a, 0x0100, true);
  let encDocCode = '';
  try {
    await openOfficeFile('secret.doc', encDocBuf.buffer);
  } catch (err) {
    encDocCode = (err as { code?: string }).code ?? '';
  }
  check('encrypted doc rejected', encDocCode === 'OFFICE_ENCRYPTED_FILE_UNSUPPORTED', encDocCode);

  // 4. ZIP security guards
  let slipCode = '';
  try {
    const evil = await writeZip([{ name: 'C:/evil.txt', data: text('bad') }]);
    await readZip(toBuffer(evil));
  } catch (err) {
    slipCode = (err as { code?: string }).code ?? '';
  }
  check('zip drive-letter zip-slip blocked', slipCode === 'OFFICE_ZIP_UNSAFE_PATH', slipCode);

  // 5. Rich OOXML features (OMML, Chart, 2-col, AlternateContent, VML, titlePg, evenAndOddHeaders, EMF fallback)
  const richOpen = await openOfficeFile('qa-formats-rich.docx', readSampleBuf('qa-formats-rich.docx'));
  const richDoc = richOpen.word!;
  const firstRun = richDoc.blocks[0].kind === 'paragraph' ? richDoc.blocks[0].paragraph.runs[0] : undefined;
  const secondP = richDoc.blocks[1].kind === 'paragraph' ? richDoc.blocks[1].paragraph : undefined;
  const eqRun = secondP?.runs.find((r) => r.equation);
  const chartP = richDoc.blocks[2].kind === 'paragraph' ? richDoc.blocks[2].paragraph : undefined;
  const chartRun = chartP?.runs.find((r) => r.chart);
  const vmlP = richDoc.blocks[3].kind === 'paragraph' ? richDoc.blocks[3].paragraph : undefined;
  const emfRun = vmlP?.runs.find((r) => r.unsupportedImageFormat);
  const tblBlock = richDoc.blocks.find((b) => b.kind === 'table');
  const pbBlock = richDoc.blocks.find((b) => b.kind === 'paragraph' && b.paragraph.pageBreakBefore);
  check('rich docx rStyle/theme/smallCaps/uNone/shd/pBdr',
    firstRun?.bold === true && firstRun?.smallCaps === true && firstRun?.underline === false
    && firstRun?.color === '#1F4E79' && firstRun?.shading?.toUpperCase() === '#FEF08A'
    && (richDoc.blocks[0].kind === 'paragraph' && Boolean(richDoc.blocks[0].paragraph.borderSides?.bottom)));
  check('rich docx inline MathML equation',
    Boolean(eqRun?.equation?.mathMl.includes('<math')) && Boolean(eqRun?.equation?.mathMl.includes('<mfrac')));
  check('rich docx AlternateContent + DrawingML chart',
    chartRun?.chart?.title === 'Doanh thu theo quý'
    && chartRun?.chart?.layout.bars.length === 3
    && !docTextOf(richDoc).includes('Fallback ignored'));
  check('rich docx VML pict + EMF warning + sym/noBreakHyphen',
    Boolean(vmlP?.runs.some((r) => r.textBox?.text.includes('Hộp VML cổ điển')))
    && emfRun?.unsupportedImageFormat === 'EMF'
    && richOpen.warnings.includes('OFFICE_VECTOR_IMAGE_UNSUPPORTED'));
  check('rich docx tableBorders + firstRow shading',
    tblBlock?.kind === 'table' && tblBlock.tableBorders?.top === '2px solid #1F4E79'
    && tblBlock.cellStyles?.[0]?.[0]?.fill?.toUpperCase() === '#DBEAFE');
  check('rich docx sections/headers/evenAndOdd/NUMPAGES/pageBreakBefore',
    richDoc.evenAndOddHeaders === true
    && (richDoc.sections?.length ?? 0) >= 2
    && richDoc.sections![0].columns === 2
    && richDoc.sections![1].titlePg === true
    && richDoc.sections![1].headers.some((h) => h.type === 'first' && (h.tableRows?.length ?? 0) === 1)
    && richDoc.sections![1].footers.some((f) => f.hasNumPages === true)
    && Boolean(pbBlock));

  // 6. ODT export round-trip (Word Web Export > Download as ODT)
  const odtSampleDoc: WordDocument = {
    blocks: [
      { kind: 'paragraph', paragraph: { headingLevel: 1, style: 'Heading1', runs: [{ text: 'Kế hoạch Q4', bold: true, color: '#1F4E79' }] } },
      { kind: 'paragraph', paragraph: { listType: 'bullet', runs: [{ text: 'Mục tiêu chính', italic: true }] } },
      { kind: 'paragraph', paragraph: { listType: 'number', runs: [{ text: 'Bước triển khai', underline: true }] } },
      {
        kind: 'table',
        rows: [
          [[{ runs: [{ text: 'Hạng mục', bold: true }] }], [{ runs: [{ text: 'Giá trị' }] }]],
          [[{ runs: [{ text: 'A1' }] }], [{ runs: [{ text: '100' }] }]],
        ],
        grid: [50, 50],
        headerRows: 1,
        cellStyles: [[{ fill: '#DBEAFE' }, undefined], [undefined, undefined]],
      },
    ],
    wordCount: 9,
    pageSize: { width: 816, height: 1056 },
    pageMargins: { top: 96, bottom: 96, left: 96, right: 96 },
    warnings: [],
  };
  const odtBytes = await saveOdt(odtSampleDoc);
  const odtParsed = await parseOdt(odtBytes);
  const odtP0 = odtParsed.blocks[0]?.kind === 'paragraph' ? odtParsed.blocks[0].paragraph : undefined;
  const odtP1 = odtParsed.blocks[1]?.kind === 'paragraph' ? odtParsed.blocks[1].paragraph : undefined;
  const odtP2 = odtParsed.blocks[2]?.kind === 'paragraph' ? odtParsed.blocks[2].paragraph : undefined;
  const odtT = odtParsed.blocks[3]?.kind === 'table' ? odtParsed.blocks[3] : undefined;
  check('odt export round-trip heading/lists/table/fill',
    odtBytes[0] === 0x50 && odtBytes[1] === 0x4b
    && odtP0?.headingLevel === 1 && odtP0.runs[0]?.bold === true && odtP0.runs[0]?.text === 'Kế hoạch Q4'
    && odtP1?.listType === 'bullet' && odtP1.runs[0]?.italic === true
    && odtP2?.listType === 'number' && odtP2.runs[0]?.underline === true
    && odtT?.rows.length === 2 && odtT.rows[1]?.[1]?.[0]?.runs[0]?.text === '100'
    && odtT.cellStyles?.[0]?.[0]?.fill?.toUpperCase() === '#DBEAFE');

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

function makeSheet(entries: Array<[string, string, string?]>): ExcelSheet {
  const cells = new Map<string, ExcelCell>();
  let maxRow = 0;
  let maxCol = 0;
  for (const [ref, value, formula] of entries) {
    const match = /^([A-Z]+)(\d+)$/i.exec(ref);
    if (!match) continue;
    let col = 0;
    for (const char of match[1].toUpperCase()) col = col * 26 + (char.charCodeAt(0) - 64);
    const row = Number(match[2]);
    const numeric = value !== '' && Number.isFinite(Number(value.replace(/,/g, '')));
    cells.set(ref, {
      ref, row, col, value: formula ? '' : value,
      formula: formula ? `=${formula}` : undefined,
      type: numeric ? 'number' : value === '' ? 'empty' : 'string',
    });
    maxRow = Math.max(maxRow, row);
    maxCol = Math.max(maxCol, col);
  }
  return { name: 'Sheet1', cells, maxRow, maxCol, merges: [] };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
