import { FLUENT_ICON_PATHS } from './word-fluent-icons';
import { OFFICE_ICON_PATHS, OFFICE_ICON_SVG } from './word-office-icons';
import { WORD_ACCENT_TABLE_PRESETS } from './word-tables';

export type WordRibbonTabId =
  | 'home' | 'insert' | 'table' | 'tableLayout' | 'picture' | 'shape' | 'draw' | 'design' | 'layout' | 'references' | 'mailings' | 'review'
  | 'view' | 'help';

export interface WordRibbonItem {
  /** Stable command id dispatched through `runWordCommand`. */
  id: string;
  labelKey: string;
  /** Short typographic glyph rendered above/before the label (no emoji). */
  glyph?: string;
  /** Office-style large button: glyph/label stacked. */
  large?: boolean;
  /** Icon-only small button (Office compact toolbar). */
  compact?: boolean;
  /** Custom control rendered by the template instead of a plain button. */
  control?: 'fontName' | 'fontSize' | 'fontColor' | 'highlight' | 'style' | 'spacing'
  | 'margins' | 'orientation' | 'pageSize' | 'columns' | 'lineNumbers' | 'zoom' | 'shading' | 'hyphenation' | 'borderLine'
  | 'tableGrid' | 'alignMenu' | 'spacingMenu' | 'bordersMenu' | 'stylePicker' | 'marginsMenu' | 'orientationMenu'
  | 'pageSizeMenu' | 'columnsMenu' | 'breaksMenu' | 'markupMenu' | 'commentFilterMenu' | 'zoomMenu' | 'pageColorMenu' | 'moreHome';
  /** Office command shown but unavailable in the browser implementation. */
  disabled?: boolean;
  /** Small button that keeps its icon next to the label (Word's Find/Replace). */
  labeled?: boolean;
  /** Ribbon row this item belongs to (1-based); items without a row share row 1. */
  row?: number;
  /** Word shows a caret on split buttons (Paste, Find, Replace, Select). */
  caret?: boolean;
  /** Tooltip explaining why a disabled command is unavailable. */
  hintKey?: string;
}

export interface WordRibbonGroup {
  id: string;
  labelKey: string;
  /** Word's small dialog launcher at the group's bottom-right corner. */
  launcher?: 'format' | 'paragraph' | 'find' | 'clipboard' | 'styles';
  items: WordRibbonItem[];
}

export interface WordRibbonTab {
  id: WordRibbonTabId;
  labelKey: string;
  groups: WordRibbonGroup[];
}

const it = (
  id: string, labelKey: string, glyph?: string, large?: boolean,
  control?: WordRibbonItem['control'], compact?: boolean, disabled?: boolean, hintKey?: string,
  row?: number,
): WordRibbonItem => ({ id, labelKey, glyph, large, control, compact, disabled, hintKey, row });

export const WORD_RIBBON: WordRibbonTab[] = [
  {
    id: 'home',
    labelKey: 'office.ribbon.home',
    groups: [
      {
        id: 'clipboard',
        labelKey: 'office.rb.group.clipboard',
        launcher: 'clipboard',
        items: [
          { id: 'paste', labelKey: 'office.rb.paste', large: true, caret: true },
          it('cut', 'office.rb.cut', undefined, false, undefined, true),
          it('copy', 'office.rb.copy', undefined, false, undefined, true),
          it('painter', 'office.word.formatPainter', undefined, false, undefined, true),
        ],
      },
      {
        id: 'font',
        labelKey: 'office.rb.group.font',
        launcher: 'format',
        items: [
          it('fontName', 'office.rb.fontName', undefined, false, 'fontName', undefined, undefined, undefined, 1),
          it('fontSize', 'office.rb.fontSize', undefined, false, 'fontSize', undefined, undefined, undefined, 1),
          it('growFont', 'office.word.growFont', undefined, false, undefined, true, undefined, undefined, 1),
          it('shrinkFont', 'office.word.shrinkFont', undefined, false, undefined, true, undefined, undefined, 1),
          it('bold', 'office.word.bold', undefined, false, undefined, true, undefined, undefined, 2),
          it('italic', 'office.word.italic', undefined, false, undefined, true, undefined, undefined, 2),
          it('underline', 'office.word.underline', undefined, false, undefined, true, undefined, undefined, 2),
          it('strike', 'office.word.strike', undefined, false, undefined, true, undefined, undefined, 2),
          it('subscript', 'office.word.subscript', undefined, false, undefined, true, undefined, undefined, 2),
          it('superscript', 'office.word.superscript', undefined, false, undefined, true, undefined, undefined, 2),
          { id: 'changeCase', labelKey: 'office.word.changeCase', row: 2, caret: true, compact: true },
          it('highlight', 'office.word.highlight', undefined, false, 'highlight', undefined, undefined, undefined, 2),
          it('fontColor', 'office.rb.fontColor', undefined, false, 'fontColor', undefined, undefined, undefined, 2),
          it('clearFormat', 'office.word.clearFormat', undefined, false, undefined, true, undefined, undefined, 2),
        ],
      },
      {
        id: 'paragraph',
        labelKey: 'office.rb.group.paragraph',
        launcher: 'paragraph',
        items: [
          { id: 'bullets', labelKey: 'office.word.list.bullet', compact: true, row: 1, caret: true },
          { id: 'numbering', labelKey: 'office.word.list.number', compact: true, row: 1, caret: true }, it('checklist', 'office.rb.checklist', undefined, false, undefined, true, undefined, undefined, 1),
          it('indentDec', 'office.rb.indentDec', undefined, false, undefined, true, undefined, undefined, 1),
          it('indentInc', 'office.rb.indentInc', undefined, false, undefined, true, undefined, undefined, 1),
          it('sortParagraphs', 'office.rb.sort', undefined, false, undefined, true, undefined, undefined, 1),
          it('showMarks', 'office.rb.showMarks', undefined, false, undefined, true, undefined, undefined, 1),
          it('alignLeft', 'office.word.align.left', undefined, false, undefined, true, undefined, undefined, 2),
          it('alignCenter', 'office.word.align.center', undefined, false, undefined, true, undefined, undefined, 2),
          it('alignRight', 'office.word.align.right', undefined, false, undefined, true, undefined, undefined, 2),
          it('alignJustify', 'office.word.align.justify', undefined, false, undefined, true, undefined, undefined, 2),
          it('spacing', 'office.word.lineSpacing', undefined, false, 'spacing', undefined, undefined, undefined, 2),
          it('shading', 'office.rb.shading', undefined, false, 'shading', undefined, undefined, undefined, 2),
          { id: 'paragraphBorders', labelKey: 'office.rb.paragraphBorders', compact: true, row: 2, caret: true },
          it('paragraphOptions', 'office.rb.paragraphOptions', undefined, false, undefined, true, undefined, undefined, 2),
        ],
      },
      {
        id: 'styles',
        labelKey: 'office.rb.group.styles',
        launcher: 'styles',
        items: [
          it('style', 'office.word.style', undefined, false, 'style'),
        ],
      },
      {
        id: 'editing',
        labelKey: 'office.rb.group.editing',
        launcher: 'find',
        items: [
          { id: 'find', labelKey: 'office.rb.find', labeled: true, caret: true },
          { id: 'replace', labelKey: 'office.rb.replace', labeled: true, caret: true },
          { id: 'selectAll', labelKey: 'office.rb.selectAll', labeled: true, caret: true },
        ],
      },
    ],
  },
  {
    id: 'insert',
    labelKey: 'office.ribbon.insert',
    groups: [
      {
        id: 'pages',
        labelKey: 'office.rb.group.pages',
        items: [
          it('coverPage', 'office.rb.coverPage', undefined, true),
          it('blankPage', 'office.rb.blankPage', undefined, true),
          it('pageBreak', 'office.word.pageBreak', undefined, true),
        ],
      },
      {
        id: 'tables',
        labelKey: 'office.rb.group.tables',
        items: [it('table', 'office.word.insertTable', undefined, true)],
      },
      {
        id: 'illustrations',
        labelKey: 'office.rb.group.illustrations',
        items: [
          it('picture', 'office.word.insertImage', undefined, true),
          it('shapes', 'office.rb.shapes', undefined, true),
          it('icons', 'office.rb.icons', undefined, true),
          it('smartArt', 'office.rb.smartArt', undefined, true),
          it('chart', 'office.rb.chart', undefined, true),
          it('drawing', 'office.rb.drawing', undefined, true),
        ],
      },
      {
        id: 'media',
        labelKey: 'office.rb.group.media',
        items: [it('video', 'office.word.videoInsert', undefined, true)],
      },
      {
        id: 'links',
        labelKey: 'office.rb.group.links',
        items: [
          it('link', 'office.word.link', undefined, true),
          it('bookmark', 'office.rb.bookmark', undefined, true),
          it('crossReference', 'office.rb.crossReference', undefined, true),
          it('insertTocInsert', 'office.word.toc', undefined, true),
        ],
      },
      {
        id: 'comments',
        labelKey: 'office.rb.group.comments',
        items: [it('newComment', 'office.rb.newComment', undefined, true)],
      },
      {
        id: 'headerFooter',
        labelKey: 'office.rb.group.headerFooter',
        items: [
          it('header', 'office.rb.header', undefined, true),
          it('footer', 'office.rb.footer', undefined, true),
          it('pageNumber', 'office.rb.pageNumber', undefined, true),
        ],
      },
      {
        id: 'text',
        labelKey: 'office.rb.group.text',
        items: [
          it('textBox', 'office.rb.textBox', undefined, true),
          it('equation', 'office.word.equation', undefined, true),
          it('symbol', 'office.word.symbol', undefined, true),
          it('emoji', 'office.rb.emoji', undefined, true),
        ],
      },
    ],
  },
  {
    id: 'table',
    labelKey: 'office.ribbon.tableDesign',
    groups: [
      {
        id: 'tableStyle',
        labelKey: 'office.rb.group.tableStyle',
        items: [
          it('tableStyleGrid', 'office.word.table.styleGrid', undefined, true),
          it('tableStyleHeader', 'office.word.table.styleHeader', undefined, true),
          it('tableStyleBanded', 'office.word.table.styleBanded', undefined, true),
          it('tableStyleList', 'office.word.table.styleList', undefined, true),
          it('tableStyleShaded', 'office.word.table.styleShaded', undefined, true),
          it('tableStyleNone', 'office.word.table.styleNone', undefined, true),
          it('tableStyleGridLight', 'office.word.table.styleGridLight', undefined, true),
          it('tableStyleAccentHeader', 'office.word.table.styleAccentHeader', undefined, true),
          it('tableStyleAccentStriped', 'office.word.table.styleAccentStriped', undefined, true),
          it('tableStyleOutline', 'office.word.table.styleOutline', undefined, true),
          it('tableStyleBandedColumns', 'office.word.table.styleBandedColumns', undefined, true),
          it('tableStyleFirstCol', 'office.word.table.styleFirstCol', undefined, true),
          it('tableStyleLastRow', 'office.word.table.styleLastRow', undefined, true),
          it('tableStyleGridThick', 'office.word.table.styleGridThick', undefined, true),
          it('tableStyleWordGrid', 'office.word.table.styleWordGrid', undefined, true),
          // Word's theme-linked families, accent 1-6 (24 gallery entries).
          ...WORD_ACCENT_TABLE_PRESETS.map((entry) => it(
            `tableStyleWord${entry.preset[0].toUpperCase()}${entry.preset.slice(1)}`,
            entry.labelKey,
            undefined,
            true,
          )),
        ],
      },
      {
        id: 'tableBorders',
        labelKey: 'office.rb.group.tableBorders',
        items: [
          { id: 'tableBorderTop', labelKey: 'office.word.table.borderTop', labeled: true },
          { id: 'tableBorderBottom', labelKey: 'office.word.table.borderBottom', labeled: true },
          { id: 'tableBorderLeft', labelKey: 'office.word.table.borderLeft', labeled: true },
          { id: 'tableBorderRight', labelKey: 'office.word.table.borderRight', labeled: true },
          { id: 'tableBorderDiagDown', labelKey: 'office.word.table.borderDiagDown', labeled: true },
          { id: 'tableBorderDiagUp', labelKey: 'office.word.table.borderDiagUp', labeled: true },
          { id: 'tableBorderNone', labelKey: 'office.word.table.borderNone', labeled: true },
          it('borderLine', 'office.word.table.borderLine', undefined, false, 'borderLine'),
        ],
      },
    ],
  },
  {
    id: 'tableLayout',
    labelKey: 'office.ribbon.tableLayout',
    groups: [
      {
        id: 'tableRows',
        labelKey: 'office.rb.group.tableRows',
        items: [
          it('tableInsertRowAbove', 'office.word.table.insertRowAbove', undefined, false, undefined, true),
          it('tableInsertRowBelow', 'office.word.table.insertRowBelow', undefined, false, undefined, true),
          it('tableInsertColumnLeft', 'office.word.table.insertColumnLeft', undefined, false, undefined, true),
          it('tableInsertColumnRight', 'office.word.table.insertColumnRight', undefined, false, undefined, true),
          it('tableDeleteRow', 'office.word.table.deleteRow', undefined, false, undefined, true),
          it('tableDeleteColumn', 'office.word.table.deleteColumn', undefined, false, undefined, true),
          it('tableDelete', 'office.word.table.deleteTable', undefined, false, undefined, true),
        ],
      },
      {
        id: 'tableMerge',
        labelKey: 'office.rb.group.tableMerge',
        items: [
          it('tableMergeCells', 'office.word.table.mergeCells', undefined, false, undefined, true),
          it('tableSplitCells', 'office.word.table.splitCells', undefined, false, undefined, true),
        ],
      },
      {
        id: 'tableLayout',
        labelKey: 'office.rb.group.tableLayout',
        items: [
          it('tableHeaderRow', 'office.word.table.headerRow', undefined, false, undefined, true),
          it('tableDistributeColumns', 'office.word.table.distributeColumns', undefined, false, undefined, true),
          it('tableCellTop', 'office.word.table.cellTop', undefined, false, undefined, true),
          it('tableCellCenter', 'office.word.table.cellCenter', undefined, false, undefined, true),
          it('tableCellBottom', 'office.word.table.cellBottom', undefined, false, undefined, true),
        ],
      },
      {
        id: 'tableAlign',
        labelKey: 'office.rb.group.tableAlign',
        items: [
          it('tableAlignLeft', 'office.word.table.alignLeft', undefined, false, undefined, true),
          it('tableAlignCenter', 'office.word.table.alignCenter', undefined, false, undefined, true),
          it('tableAlignRight', 'office.word.table.alignRight', undefined, false, undefined, true),
        ],
      },
    ],
  },
  {
    id: 'picture',
    labelKey: 'office.ribbon.picture',
    groups: [
      {
        id: 'pictureAdjust',
        labelKey: 'office.rb.group.adjust',
        items: [
          it('altText', 'office.rb.altText', undefined, true),
          it('resetPicture', 'office.rb.resetPicture', undefined, true),
          it('deleteObject', 'office.rb.deleteObject', undefined, true),
        ],
      },
      {
        id: 'pictureStyles',
        labelKey: 'office.rb.group.pictureStyles',
        items: [
          it('objectSize', 'office.rb.objectSize', undefined, true),
          it('position', 'office.rb.position', undefined, true),
          it('wrapText', 'office.rb.wrapText', undefined, true),
        ],
      },
      {
        id: 'pictureArrange',
        labelKey: 'office.rb.group.arrange',
        items: [
          it('bringForward', 'office.rb.bringForward', undefined, true),
          it('sendBackward', 'office.rb.sendBackward', undefined, true),
          it('selectionPane', 'office.rb.selectionPane', undefined, true),
          it('alignObjects', 'office.rb.alignObjects', undefined, true),
          it('groupObjects', 'office.rb.groupObjects', undefined, true),
          it('rotateObjects', 'office.rb.rotateObjects', undefined, true),
        ],
      },
    ],
  },
  {
    id: 'shape',
    labelKey: 'office.ribbon.shape',
    groups: [
      {
        id: 'shapeStyles',
        labelKey: 'office.rb.group.shapeStyles',
        items: [
          it('shapeFill', 'office.rb.shapeFill', undefined, true),
          it('shapeOutline', 'office.rb.shapeOutline', undefined, true),
        ],
      },
      {
        id: 'shapeArrange',
        labelKey: 'office.rb.group.arrange',
        items: [
          it('objectSize', 'office.rb.objectSize', undefined, true),
          it('position', 'office.rb.position', undefined, true),
          it('wrapText', 'office.rb.wrapText', undefined, true),
          it('bringForward', 'office.rb.bringForward', undefined, true),
          it('sendBackward', 'office.rb.sendBackward', undefined, true),
          it('selectionPane', 'office.rb.selectionPane', undefined, true),
          it('alignObjects', 'office.rb.alignObjects', undefined, true),
          it('groupObjects', 'office.rb.groupObjects', undefined, true),
          it('rotateObjects', 'office.rb.rotateObjects', undefined, true),
        ],
      },
      {
        id: 'shapeAccessibility',
        labelKey: 'office.rb.group.accessibility',
        items: [it('altText', 'office.rb.altText', undefined, true), it('deleteObject', 'office.rb.deleteObject', undefined, true)],
      },
    ],
  },
  {
    id: 'draw',
    labelKey: 'office.ribbon.draw',
    groups: [
      {
        id: 'pens',
        labelKey: 'office.rb.group.pens',
        items: [
          it('drawSelect', 'office.rb.drawSelect', undefined, true),
          it('drawPen', 'office.word.ink', undefined, true),
          it('drawHighlighter', 'office.word.highlighter', undefined, true),
          it('drawEraser', 'office.rb.drawEraser', undefined, true),
          it('eraserSmall', 'office.word.eraserSmall', undefined, true),
          it('eraserMedium', 'office.word.eraserMedium', undefined, true),
          it('lassoSelect', 'office.word.lasso', undefined, true),
          it('drawInkMode', 'office.word.mouseInk', undefined, true),
          it('fingerPainting', 'office.word.touchInk', undefined, true),
          it('penFavorite', 'office.word.favoritePen', undefined, true),
          it('addPenFavorite', 'office.word.addFavorite', undefined, true),
          it('drawClear', 'office.rb.drawClear', undefined, true),
          it('drawRuler', 'office.word.ruler', undefined, true),
        ],
      },
    ],
  },
  {
    id: 'design',
    labelKey: 'office.ribbon.design',
    groups: [
      {
        id: 'documentFormatting',
        labelKey: 'office.rb.group.documentFormatting',
        items: [
          it('themes', 'office.rb.themes', undefined, true),
          it('styleSets', 'office.rb.styleSets', undefined, true),
        ],
      },
      {
        id: 'pageBackground',
        labelKey: 'office.rb.group.pageBackground',
        items: [
          it('pageColor', 'office.word.pageColor', undefined, true),
          it('pageBorders', 'office.rb.pageBorders', undefined, true),
          it('watermark', 'office.rb.watermark', undefined, true),
        ],
      },
    ],
  },
  {
    id: 'layout',
    labelKey: 'office.ribbon.layout',
    groups: [
      {
        id: 'pageSetup',
        labelKey: 'office.rb.group.pageSetup',
        items: [
          it('margins', 'office.rb.margins', undefined, false, 'margins'),
          it('orientation', 'office.rb.orientation', undefined, false, 'orientation'),
          it('pageSize', 'office.rb.pageSize', undefined, false, 'pageSize'),
          it('columns', 'office.rb.columns', undefined, false, 'columns'),
          it('columnsMore', 'office.rb.columnsMore'),
          it('lineNumbers', 'office.word.lineNumbers', undefined, false, 'lineNumbers'),
          it('hyphenation', 'office.word.hyphenation', undefined, false, 'hyphenation'),
        ],
      },
      {
        id: 'breaks',
        labelKey: 'office.rb.group.breaks',
        items: [
          it('breakPage', 'office.rb.breakPage'),
          it('breakSection', 'office.rb.breakSection'),
        ],
      },
      {
        id: 'paragraphLayout',
        labelKey: 'office.rb.group.paragraph',
        items: [
          it('layoutIndentDec', 'office.rb.indentDec', '←'),
          it('layoutIndentInc', 'office.rb.indentInc', '→'),
          it('layoutSpacing', 'office.word.lineSpacing', undefined, false, 'spacing'),
        ],
      },
      {
        id: 'arrange',
        labelKey: 'office.rb.group.arrange',
        items: [
          it('position', 'office.rb.position', undefined, true),
          it('wrapText', 'office.rb.wrapText', undefined, true),
          it('bringForward', 'office.rb.bringForward', undefined, true),
          it('sendBackward', 'office.rb.sendBackward', undefined, true),
          it('selectionPane', 'office.rb.selectionPane', undefined, true),
          it('alignObjects', 'office.rb.alignObjects', undefined, true),
          it('groupObjects', 'office.rb.groupObjects', undefined, true),
          it('rotateObjects', 'office.rb.rotateObjects', undefined, true),
        ],
      },
      {
        id: 'pageBackgroundLayout',
        labelKey: 'office.rb.group.pageBackground',
        items: [
          it('layoutPageColor', 'office.word.pageColor', undefined, true),
          it('layoutPageBorders', 'office.rb.pageBorders', undefined, true),
        ],
      },
    ],
  },
  {
    id: 'references',
    labelKey: 'office.ribbon.references',
    groups: [
      {
        id: 'toc',
        labelKey: 'office.rb.group.toc',
        items: [
          it('insertToc', 'office.word.toc', undefined, true),
          it('updateToc', 'office.rb.updateToc', undefined, true),
        ],
      },
      {
        id: 'notes',
        labelKey: 'office.rb.group.notes',
        items: [
          it('insertFootnote', 'office.word.footnote', undefined, true),
          it('insertEndnote', 'office.word.endnote', undefined, true),
          it('nextNote', 'office.rb.nextNote', undefined, true),
        ],
      },
      {
        id: 'citations',
        labelKey: 'office.rb.group.citations',
        items: [
          it('insertCitation', 'office.rb.insertCitation', undefined, true),
          it('bibliography', 'office.rb.bibliography', undefined, true),
        ],
      },
      {
        id: 'captions',
        labelKey: 'office.rb.group.captions',
        items: [
          it('insertCaption', 'office.rb.insertCaption', undefined, true),
          it('tableOfFigures', 'office.rb.tableOfFigures', undefined, true),
          it('bookmarkRef', 'office.rb.bookmark', undefined, true),
          it('crossRef', 'office.rb.crossReference', undefined, true),
        ],
      },
      {
        id: 'index',
        labelKey: 'office.rb.group.index',
        items: [
          it('markEntry', 'office.rb.markEntry', undefined, true),
          it('insertIndex', 'office.rb.insertIndex', undefined, true),
          it('updateIndex', 'office.rb.updateIndex', undefined, true),
        ],
      },
    ],
  },
  {
    id: 'mailings',
    labelKey: 'office.ribbon.mailings',
    groups: [
      {
        id: 'mailCreate',
        labelKey: 'office.rb.group.mailCreate',
        items: [
          it('envelopes', 'office.rb.envelopes', undefined, true),
          it('labels', 'office.rb.labels', undefined, true),
        ],
      },
      {
        id: 'mailStart',
        labelKey: 'office.rb.group.mailStart',
        items: [
          it('startMailMerge', 'office.rb.startMailMerge', undefined, true),
          it('selectRecipients', 'office.rb.selectRecipients', undefined, true),
          it('editRecipients', 'office.rb.editRecipients', undefined, true),
        ],
      },
      {
        id: 'mailFields',
        labelKey: 'office.rb.group.mailFields',
        items: [
          it('highlightMergeFields', 'office.rb.highlightMergeFields', undefined, true),
          it('addressBlock', 'office.rb.addressBlock', undefined, true),
          it('greetingLine', 'office.rb.greetingLine', undefined, true),
          it('insertMergeField', 'office.rb.insertMergeField', undefined, true),
          it('mergeRules', 'office.rb.mergeRules', undefined, true),
        ],
      },
      {
        id: 'mailPreview',
        labelKey: 'office.rb.group.mailPreview',
        items: [
          it('previewResults', 'office.rb.previewResults', undefined, true),
          it('findRecipient', 'office.rb.findRecipient', undefined, true),
          it('checkErrors', 'office.rb.checkErrors', undefined, true),
        ],
      },
      {
        id: 'mailFinish',
        labelKey: 'office.rb.group.mailFinish',
        items: [
          it('finishMerge', 'office.rb.finishMerge', undefined, true),
        ],
      },
    ],
  },
  {
    id: 'review',
    labelKey: 'office.ribbon.review',
    groups: [
      {
        id: 'proofing',
        labelKey: 'office.rb.group.proofing',
        items: [
          it('spelling', 'office.word.spellcheck', undefined, true),
          it('thesaurus', 'office.rb.thesaurus', undefined, true),
          it('wordCount', 'office.rb.wordCount', undefined, true),
          it('accessibility', 'office.word.accessibility', undefined, true),
        ],
      },
      {
        id: 'inkReview',
        labelKey: 'office.rb.group.ink',
        items: [
          it('inkStart', 'office.word.inkStart', undefined, true),
          it('inkHide', 'office.word.hideInk', undefined, true),
          it('inkDeleteAll', 'office.word.deleteAllInk', undefined, true),
        ],
      },
      {
        id: 'protect',
        labelKey: 'office.rb.group.protect',
        items: [
          it('restrictEditing', 'office.rb.restrictEditing', undefined, true),
        ],
      },
      {
        id: 'reviewComments',
        labelKey: 'office.rb.group.comments',
        items: [
          it('reviewCommentNew', 'office.rb.newComment', undefined, true),
          it('reviewCommentDelete', 'office.rb.deleteComment', undefined, true),
          it('reviewCommentPrev', 'office.rb.prevComment'),
          it('reviewCommentNext', 'office.rb.nextComment'),
          it('showComments', 'office.rb.showComments'),
          it('filterComments', 'office.rb.filterComments'),
          it('markAllRead', 'office.rb.markAllRead'),
        ],
      },
      {
        id: 'tracking',
        labelKey: 'office.rb.group.tracking',
        items: [
          it('trackChanges', 'office.track.toggle', undefined, true),
          it('markup', 'office.rb.markup'),
          it('reviewPane', 'office.track.title', undefined, true),
          it('acceptAll', 'office.rb.acceptAll'),
          it('rejectAll', 'office.rb.rejectAll'),
          it('acceptPrev', 'office.rb.acceptPrev'),
          it('acceptNext', 'office.rb.acceptNext'),
          it('rejectPrev', 'office.rb.rejectPrev'),
          it('rejectNext', 'office.rb.rejectNext'),
        ],
      },
    ],
  },
  {
    id: 'view',
    labelKey: 'office.ribbon.view',
    groups: [
      {
        id: 'views',
        labelKey: 'office.rb.group.views',
        items: [
          it('readMode', 'office.word.reading', undefined, true),
          it('printLayout', 'office.rb.printLayout', undefined, true),
          it('webLayout', 'office.rb.webLayout', undefined, true),
          it('immersive', 'office.word.immersive', undefined, true),
          it('darkMode', 'office.word.dark', undefined, true),
        ],
      },
      {
        id: 'pageMovement',
        labelKey: 'office.rb.group.pageMovement',
        items: [
          it('separatePages', 'office.rb.separatePages', undefined, true),
          it('switchBackground', 'office.rb.switchBackground', undefined, true),
        ],
      },
      {
        id: 'show',
        labelKey: 'office.rb.group.show',
        items: [
          it('ruler', 'office.word.ruler', undefined, true),
          it('navigation', 'office.word.navigation', undefined, true),
          it('viewHeaderFooter', 'office.rb.viewHeaderFooter', undefined, true),
          it('viewFootnotes', 'office.rb.viewFootnotes'),
          it('viewEndnotes', 'office.rb.viewEndnotes'),
        ],
      },
      {
        id: 'zoomGroup',
        labelKey: 'office.rb.group.zoom',
        items: [
          it('zoom', 'office.status.zoom', undefined, false, 'zoom'),
          it('zoom100', 'office.rb.zoom100'),
          it('pageWidth', 'office.rb.pageWidth'),
          it('wholePage', 'office.rb.wholePage'),
        ],
      },
      {
        id: 'window',
        labelKey: 'office.rb.group.window',
        items: [
          it('newWindow', 'office.rb.newWindow', undefined, true),
          it('fullscreen', 'office.rb.fullscreen', undefined, true),
          it('macros', 'office.rb.macros', undefined, true, undefined, false, true, 'office.rb.macrosUnavailable'),
        ],
      },
    ],
  },
  {
    id: 'help',
    labelKey: 'office.ribbon.help',
    groups: [
      {
        id: 'helpGroup',
        labelKey: 'office.rb.group.help',
        items: [
          it('help', 'office.rb.help', undefined, true),
          it('shortcuts', 'office.rb.shortcuts', undefined, true),
          it('feedback', 'office.rb.feedback'),
        ],
      },
    ],
  },
];

export function wordRibbonTab(id: WordRibbonTabId): WordRibbonTab | undefined {
  return WORD_RIBBON.find((tab) => tab.id === id);
}

const sl = (
  id: string,
  labelKey: string,
  opts?: { control?: WordRibbonItem['control']; compact?: boolean; labeled?: boolean; caret?: boolean; disabled?: boolean; hintKey?: string },
): WordRibbonItem => ({
  id,
  labelKey,
  compact: opts?.compact ?? true,
  labeled: opts?.labeled ?? false,
  caret: opts?.caret ?? false,
  control: opts?.control,
  disabled: opts?.disabled,
  hintKey: opts?.hintKey,
});

/** Curated Word for the Web Single-Line (Simplified) Ribbon definition per tab. */
export const WORD_SINGLE_LINE_RIBBON: Partial<Record<WordRibbonTabId, WordRibbonGroup[]>> = {
  home: [
    {
      id: 'undoRedo',
      labelKey: 'office.rb.group.undo',
      items: [
        sl('undo', 'office.word.undo'),
        sl('redo', 'office.word.redo'),
      ],
    },
    {
      id: 'clipboard',
      labelKey: 'office.rb.group.clipboard',
      items: [
        sl('paste', 'office.rb.paste', { caret: true }),
        sl('cut', 'office.rb.cut'),
        sl('copy', 'office.rb.copy'),
        sl('painter', 'office.word.formatPainter'),
      ],
    },
    {
      id: 'font',
      labelKey: 'office.rb.group.font',
      items: [
        sl('fontName', 'office.rb.fontName', { control: 'fontName', compact: false }),
        sl('fontSize', 'office.rb.fontSize', { control: 'fontSize', compact: false }),
        sl('growFont', 'office.word.growFont'),
        sl('shrinkFont', 'office.word.shrinkFont'),
        sl('bold', 'office.word.bold'),
        sl('italic', 'office.word.italic'),
        sl('underline', 'office.word.underline'),
        sl('highlight', 'office.word.highlight', { control: 'highlight', compact: false }),
        sl('fontColor', 'office.rb.fontColor', { control: 'fontColor', compact: false }),
        sl('clearFormat', 'office.word.clearFormat'),
      ],
    },
    {
      id: 'paragraph',
      labelKey: 'office.rb.group.paragraph',
      items: [
        sl('bullets', 'office.word.list.bullet', { caret: true }),
        sl('numbering', 'office.word.list.number', { caret: true }),
        sl('alignMenu', 'office.word.alignment', { control: 'alignMenu', compact: false }),
        sl('spacingMenu', 'office.word.lineSpacing', { control: 'spacingMenu', compact: false }),
        sl('shading', 'office.rb.shading', { control: 'shading', compact: false }),
        sl('bordersMenu', 'office.rb.paragraphBorders', { control: 'bordersMenu', compact: false }),
      ],
    },
    {
      id: 'styles',
      labelKey: 'office.rb.group.styles',
      items: [
        sl('stylePicker', 'office.word.style', { control: 'stylePicker', compact: false }),
      ],
    },
    {
      id: 'editing',
      labelKey: 'office.rb.group.editing',
      items: [
        sl('find', 'office.rb.find', { caret: true }),
      ],
    },
    {
      id: 'more',
      labelKey: 'office.rb.moreOptions',
      items: [
        sl('moreHome', 'office.rb.moreOptions', { control: 'moreHome', compact: false }),
      ],
    },
  ],
  insert: [
    {
      id: 'pages',
      labelKey: 'office.rb.group.pages',
      items: [
        sl('pageBreak', 'office.word.pageBreak', { compact: false, labeled: true }),
        sl('blankPage', 'office.rb.blankPage'),
        sl('coverPage', 'office.rb.coverPage'),
      ],
    },
    {
      id: 'tables',
      labelKey: 'office.rb.group.tables',
      items: [
        sl('tableGrid', 'office.word.insertTable', { control: 'tableGrid', compact: false }),
      ],
    },
    {
      id: 'illustrations',
      labelKey: 'office.rb.group.illustrations',
      items: [
        sl('picture', 'office.word.insertImage', { compact: false, labeled: true }),
        sl('shapes', 'office.rb.shapes'),
        sl('icons', 'office.rb.icons'),
        sl('chart', 'office.rb.chart'),
        sl('smartArt', 'office.rb.smartArt'),
        sl('drawing', 'office.rb.drawing'),
        sl('video', 'office.word.videoInsert'),
      ],
    },
    {
      id: 'links',
      labelKey: 'office.rb.group.links',
      items: [
        sl('link', 'office.word.link', { compact: false, labeled: true }),
        sl('bookmark', 'office.rb.bookmark'),
        sl('insertTocInsert', 'office.word.toc'),
      ],
    },
    {
      id: 'comments',
      labelKey: 'office.rb.group.comments',
      items: [
        sl('newComment', 'office.rb.newComment', { compact: false, labeled: true }),
      ],
    },
    {
      id: 'headerFooter',
      labelKey: 'office.rb.group.headerFooter',
      items: [
        sl('header', 'office.rb.header'),
        sl('footer', 'office.rb.footer'),
        sl('pageNumber', 'office.rb.pageNumber'),
      ],
    },
    {
      id: 'text',
      labelKey: 'office.rb.group.text',
      items: [
        sl('textBox', 'office.rb.textBox'),
        sl('equation', 'office.word.equation'),
        sl('symbol', 'office.word.symbol'),
        sl('emoji', 'office.rb.emoji'),
      ],
    },
  ],
  table: [
    {
      id: 'tableStyle',
      labelKey: 'office.rb.group.tableStyle',
      items: [
        sl('tableStyleGrid', 'office.word.table.styleGrid', { compact: false, labeled: true }),
        sl('tableStyleHeader', 'office.word.table.styleHeader'),
        sl('tableStyleBanded', 'office.word.table.styleBanded'),
        sl('tableStyleAccentHeader', 'office.word.table.styleAccentHeader'),
        sl('tableStyleNone', 'office.word.table.styleNone'),
      ],
    },
    {
      id: 'tableBorders',
      labelKey: 'office.rb.group.tableBorders',
      items: [
        sl('tableBorderTop', 'office.word.table.borderTop'),
        sl('tableBorderBottom', 'office.word.table.borderBottom'),
        sl('tableBorderLeft', 'office.word.table.borderLeft'),
        sl('tableBorderRight', 'office.word.table.borderRight'),
        sl('tableBorderNone', 'office.word.table.borderNone'),
        sl('borderLine', 'office.word.table.borderLine', { control: 'borderLine', compact: false }),
      ],
    },
  ],
  tableLayout: [
    {
      id: 'tableRows',
      labelKey: 'office.rb.group.tableRows',
      items: [
        sl('tableInsertRowAbove', 'office.word.table.insertRowAbove'),
        sl('tableInsertRowBelow', 'office.word.table.insertRowBelow'),
        sl('tableInsertColumnLeft', 'office.word.table.insertColumnLeft'),
        sl('tableInsertColumnRight', 'office.word.table.insertColumnRight'),
        sl('tableDeleteRow', 'office.word.table.deleteRow'),
        sl('tableDeleteColumn', 'office.word.table.deleteColumn'),
        sl('tableDelete', 'office.word.table.deleteTable'),
      ],
    },
    {
      id: 'tableMerge',
      labelKey: 'office.rb.group.tableMerge',
      items: [
        sl('tableMergeCells', 'office.word.table.mergeCells'),
        sl('tableSplitCells', 'office.word.table.splitCells'),
      ],
    },
    {
      id: 'tableLayout',
      labelKey: 'office.rb.group.tableLayout',
      items: [
        sl('tableHeaderRow', 'office.word.table.headerRow'),
        sl('tableDistributeColumns', 'office.word.table.distributeColumns'),
        sl('tableCellTop', 'office.word.table.cellTop'),
        sl('tableCellCenter', 'office.word.table.cellCenter'),
        sl('tableCellBottom', 'office.word.table.cellBottom'),
      ],
    },
    {
      id: 'tableAlign',
      labelKey: 'office.rb.group.tableAlign',
      items: [
        sl('tableAlignLeft', 'office.word.table.alignLeft'),
        sl('tableAlignCenter', 'office.word.table.alignCenter'),
        sl('tableAlignRight', 'office.word.table.alignRight'),
      ],
    },
  ],
  picture: [
    {
      id: 'pictureAdjust',
      labelKey: 'office.rb.group.adjust',
      items: [
        sl('altText', 'office.rb.altText', { compact: false, labeled: true }),
        sl('resetPicture', 'office.rb.resetPicture'),
        sl('deleteObject', 'office.rb.deleteObject'),
      ],
    },
    {
      id: 'pictureStyles',
      labelKey: 'office.rb.group.pictureStyles',
      items: [
        sl('objectSize', 'office.rb.objectSize'),
        sl('position', 'office.rb.position'),
        sl('wrapText', 'office.rb.wrapText'),
      ],
    },
    {
      id: 'pictureArrange',
      labelKey: 'office.rb.group.arrange',
      items: [
        sl('bringForward', 'office.rb.bringForward'),
        sl('sendBackward', 'office.rb.sendBackward'),
        sl('alignObjects', 'office.rb.alignObjects'),
        sl('rotateObjects', 'office.rb.rotateObjects'),
        sl('selectionPane', 'office.rb.selectionPane'),
      ],
    },
  ],
  shape: [
    {
      id: 'shapeStyles',
      labelKey: 'office.rb.group.shapeStyles',
      items: [
        sl('shapeFill', 'office.rb.shapeFill', { compact: false, labeled: true }),
        sl('shapeOutline', 'office.rb.shapeOutline', { compact: false, labeled: true }),
      ],
    },
    {
      id: 'shapeArrange',
      labelKey: 'office.rb.group.arrange',
      items: [
        sl('objectSize', 'office.rb.objectSize'),
        sl('position', 'office.rb.position'),
        sl('wrapText', 'office.rb.wrapText'),
        sl('bringForward', 'office.rb.bringForward'),
        sl('sendBackward', 'office.rb.sendBackward'),
        sl('alignObjects', 'office.rb.alignObjects'),
        sl('rotateObjects', 'office.rb.rotateObjects'),
      ],
    },
    {
      id: 'shapeAccessibility',
      labelKey: 'office.rb.group.accessibility',
      items: [
        sl('altText', 'office.rb.altText'),
        sl('deleteObject', 'office.rb.deleteObject'),
      ],
    },
  ],
  layout: [
    {
      id: 'pageSetup',
      labelKey: 'office.rb.group.pageSetup',
      items: [
        sl('marginsMenu', 'office.rb.margins', { control: 'marginsMenu', compact: false }),
        sl('orientationMenu', 'office.rb.orientation', { control: 'orientationMenu', compact: false }),
        sl('pageSizeMenu', 'office.rb.pageSize', { control: 'pageSizeMenu', compact: false }),
        sl('columnsMenu', 'office.rb.columns', { control: 'columnsMenu', compact: false }),
        sl('breaksMenu', 'office.rb.group.breaks', { control: 'breaksMenu', compact: false }),
        sl('lineNumbers', 'office.word.lineNumbers', { control: 'lineNumbers', compact: false }),
        sl('hyphenation', 'office.word.hyphenation', { control: 'hyphenation', compact: false }),
      ],
    },
    {
      id: 'paragraphLayout',
      labelKey: 'office.rb.group.paragraph',
      items: [
        sl('layoutIndentDec', 'office.rb.indentDec'),
        sl('layoutIndentInc', 'office.rb.indentInc'),
        sl('spacingMenu', 'office.word.lineSpacing', { control: 'spacingMenu', compact: false }),
      ],
    },
    {
      id: 'pageBackgroundLayout',
      labelKey: 'office.rb.group.pageBackground',
      items: [
        sl('pageColorMenu', 'office.word.pageColor', { control: 'pageColorMenu', compact: false }),
        sl('layoutPageBorders', 'office.rb.pageBorders'),
        sl('watermark', 'office.rb.watermark'),
      ],
    },
  ],
  references: [
    {
      id: 'toc',
      labelKey: 'office.rb.group.toc',
      items: [
        sl('insertToc', 'office.word.toc', { compact: false, labeled: true }),
        sl('updateToc', 'office.rb.updateToc'),
      ],
    },
    {
      id: 'notes',
      labelKey: 'office.rb.group.notes',
      items: [
        sl('insertFootnote', 'office.word.footnote', { compact: false, labeled: true }),
        sl('insertEndnote', 'office.word.endnote', { compact: false, labeled: true }),
        sl('nextNote', 'office.rb.nextNote'),
      ],
    },
    {
      id: 'citations',
      labelKey: 'office.rb.group.citations',
      items: [
        sl('insertCitation', 'office.rb.insertCitation', { compact: false, labeled: true }),
        sl('bibliography', 'office.rb.bibliography'),
      ],
    },
    {
      id: 'captions',
      labelKey: 'office.rb.group.captions',
      items: [
        sl('insertCaption', 'office.rb.insertCaption'),
        sl('tableOfFigures', 'office.rb.tableOfFigures'),
        sl('bookmarkRef', 'office.rb.bookmark'),
        sl('crossRef', 'office.rb.crossReference'),
      ],
    },
    {
      id: 'index',
      labelKey: 'office.rb.group.index',
      items: [
        sl('markEntry', 'office.rb.markEntry'),
        sl('insertIndex', 'office.rb.insertIndex'),
        sl('updateIndex', 'office.rb.updateIndex'),
      ],
    },
  ],
  review: [
    {
      id: 'proofing',
      labelKey: 'office.rb.group.proofing',
      items: [
        sl('spelling', 'office.word.spellcheck', { compact: false, labeled: true }),
        sl('wordCount', 'office.rb.wordCount', { compact: false, labeled: true }),
        sl('thesaurus', 'office.rb.thesaurus'),
        sl('accessibility', 'office.word.accessibility'),
      ],
    },
    {
      id: 'reviewComments',
      labelKey: 'office.rb.group.comments',
      items: [
        sl('reviewCommentNew', 'office.rb.newComment', { compact: false, labeled: true }),
        sl('reviewCommentDelete', 'office.rb.deleteComment'),
        sl('reviewCommentPrev', 'office.rb.prevComment'),
        sl('reviewCommentNext', 'office.rb.nextComment'),
        sl('showComments', 'office.rb.showComments', { compact: false, labeled: true }),
        sl('filterComments', 'office.rb.filterComments', { control: 'commentFilterMenu', compact: false }),
        sl('markAllRead', 'office.rb.markAllRead'),
      ],
    },
    {
      id: 'tracking',
      labelKey: 'office.rb.group.tracking',
      items: [
        sl('trackChanges', 'office.track.toggle', { compact: false, labeled: true }),
        sl('markup', 'office.rb.markup', { control: 'markupMenu', compact: false }),
        sl('acceptAll', 'office.rb.acceptAll', { caret: true }),
        sl('rejectAll', 'office.rb.rejectAll', { caret: true }),
        sl('reviewPane', 'office.track.title'),
      ],
    },
    {
      id: 'protect',
      labelKey: 'office.rb.group.protect',
      items: [
        sl('restrictEditing', 'office.rb.restrictEditing'),
      ],
    },
  ],
  view: [
    {
      id: 'views',
      labelKey: 'office.rb.group.views',
      items: [
        sl('printLayout', 'office.rb.printLayout', { compact: false, labeled: true }),
        sl('readMode', 'office.word.reading', { compact: false, labeled: true }),
        sl('webLayout', 'office.rb.webLayout', { compact: false, labeled: true }),
        sl('immersive', 'office.word.immersive'),
      ],
    },
    {
      id: 'pageMovement',
      labelKey: 'office.rb.group.pageMovement',
      items: [
        sl('separatePages', 'office.rb.separatePages', { compact: false, labeled: true }),
        sl('darkMode', 'office.word.dark', { compact: false, labeled: true }),
        sl('switchBackground', 'office.rb.switchBackground', { compact: false, labeled: true }),
      ],
    },
    {
      id: 'show',
      labelKey: 'office.rb.group.show',
      items: [
        sl('ruler', 'office.word.ruler', { compact: false, labeled: true }),
        sl('navigation', 'office.word.navigation', { compact: false, labeled: true }),
        sl('viewHeaderFooter', 'office.rb.viewHeaderFooter'),
        sl('viewFootnotes', 'office.rb.viewFootnotes'),
        sl('viewEndnotes', 'office.rb.viewEndnotes'),
      ],
    },
    {
      id: 'zoomGroup',
      labelKey: 'office.rb.group.zoom',
      items: [
        sl('zoom', 'office.status.zoom', { control: 'zoomMenu', compact: false }),
        sl('zoom100', 'office.rb.zoom100'),
        sl('pageWidth', 'office.rb.pageWidth'),
        sl('wholePage', 'office.rb.wholePage'),
        sl('fullscreen', 'office.rb.fullscreen'),
      ],
    },
  ],
  help: [
    {
      id: 'helpGroup',
      labelKey: 'office.rb.group.help',
      items: [
        sl('help', 'office.rb.help', { compact: false, labeled: true }),
        sl('shortcuts', 'office.rb.shortcuts', { compact: false, labeled: true }),
        sl('feedback', 'office.rb.feedback'),
      ],
    },
  ],
};

export function wordSingleLineGroups(id: WordRibbonTabId): WordRibbonGroup[] {
  return WORD_SINGLE_LINE_RIBBON[id] ?? WORD_RIBBON.find((tab) => tab.id === id)?.groups ?? [];
}

/** Icon name for ribbon commands, mapped 1:1 to Microsoft Word 365 Web Fluent UI icons. */
export const WORD_COMMAND_ICONS: Record<string, string> = {
  undo: 'arrow-undo',
  redo: 'arrow-redo',
  growFont: 'font_increase',
  shrinkFont: 'font_decrease',
  subscript: 'text_subscript',
  superscript: 'text_superscript',
  changeCase: 'text_change_case',
  fontColor: 'text_color',
  highlight: 'highlight',
  bold: 'text-bold',
  italic: 'text-italic',
  underline: 'text-underline',
  strike: 'text-strike',
  clearFormat: 'text-clear',
  bullets: 'text-bullet',
  numbering: 'numbering',
  sortParagraphs: 'sortParagraphs',
  showMarks: 'showMarks',
  find: 'find',
  replace: 'replace',
  selectAll: 'select_all_on',
  indentDec: 'text-indent-dec',
  indentInc: 'text-indent-inc',
  shading: 'color_fill',
  paste: 'clipboard',
  pasteKeep: 'clipboard',
  pastePlain: 'clipboard',
  pasteSpecial: 'clipboard',
  cut: 'scissors',
  copy: 'copy',
  painter: 'painter',
  alignLeft: 'align-left',
  alignCenter: 'align-center',
  alignRight: 'align-right',
  alignJustify: 'align-justify',
  coverPage: 'cover',
  shapes: 'shapes',
  icons: 'icons',
  smartArt: 'diagram',
  chart: 'chart',
  themes: 'themes',
  styleSets: 'styleSets',
  tableOfFigures: 'tableOfFigures',
  markEntry: 'markEntry',
  insertIndex: 'insertIndex',
  updateIndex: 'updateIndex',
  checklist: 'checklist',
  paragraphBorders: 'border_bottom',
  bordersMenu: 'border_bottom',
  paragraphOptions: 'options',
  emoji: 'emoji',
  markAllRead: 'comment_multiple_checkmark',
  showComments: 'comment_multiple',
  filterComments: 'filterComments',
  acceptPrev: 'acceptPrev',
  acceptNext: 'acceptNext',
  rejectPrev: 'rejectPrev',
  rejectNext: 'rejectNext',
  separatePages: 'separatePages',
  switchBackground: 'switchBackground',
  zoom100: 'zoom100',
  viewHeaderFooter: 'viewHeaderFooter',
  viewFootnotes: 'viewFootnotes',
  viewEndnotes: 'viewEndnotes',
  thesaurus: 'thesaurus',
  restrictEditing: 'restrictEditing',
  macros: 'macros',
  position: 'position',
  wrapText: 'wrapText',
  bringForward: 'bringForward',
  sendBackward: 'sendBackward',
  selectionPane: 'selectionPane',
  alignObjects: 'alignObjects',
  groupObjects: 'groupObjects',
  rotateObjects: 'rotateObjects',
  altText: 'accessibility',
  resetPicture: 'resetPicture',
  deleteObject: 'deleteObject',
  objectSize: 'resize',
  shapeFill: 'color_fill',
  shapeOutline: 'color_line',
  envelopes: 'envelopes',
  labels: 'labels',
  startMailMerge: 'startMailMerge',
  selectRecipients: 'selectRecipients',
  editRecipients: 'editRecipients',
  highlightMergeFields: 'highlightMergeFields',
  addressBlock: 'addressBlock',
  greetingLine: 'greetingLine',
  insertMergeField: 'insertMergeField',
  mergeRules: 'mergeRules',
  previewResults: 'previewResults',
  findRecipient: 'findRecipient',
  checkErrors: 'checkErrors',
  finishMerge: 'finishMerge',
  blankPage: 'document_add',
  pageBreak: 'document_page_break',
  table: 'table',
  tableInsertRowAbove: 'table-stack-above',
  tableInsertRowBelow: 'table-stack-below',
  tableInsertColumnLeft: 'table-stack-left',
  tableInsertColumnRight: 'table-stack-right',
  tableDeleteRow: 'table-delete-row',
  tableDeleteColumn: 'table-delete-column',
  tableDelete: 'table-dismiss',
  tableHeaderRow: 'table-repeat',
  tableStyleGrid: 'grid',
  tableStyleHeader: 'grid',
  tableStyleBanded: 'grid',
  tableStyleList: 'grid',
  tableStyleShaded: 'grid',
  tableStyleNone: 'grid',
  tableStyleGridLight: 'grid',
  tableStyleAccentHeader: 'grid',
  tableStyleAccentStriped: 'grid',
  tableStyleOutline: 'grid',
  tableStyleBandedColumns: 'grid',
  tableStyleFirstCol: 'grid',
  tableStyleLastRow: 'grid',
  tableStyleGridThick: 'grid',
  tableStyleWordGrid: 'grid',
  tableMergeCells: 'table-merge-cells',
  tableSplitCells: 'table-split-cells',
  tableDistributeColumns: 'table-resize-column',
  tableCellTop: 'textbox-align-top',
  tableCellCenter: 'textbox-align-middle',
  tableCellBottom: 'textbox-align-bottom',
  tableAlignLeft: 'align-left',
  tableAlignCenter: 'align-center',
  tableAlignRight: 'align-right',
  picture: 'image',
  drawing: 'draw_shape',
  video: 'video',
  link: 'link',
  bookmark: 'bookmark',
  crossReference: 'document_link',
  newComment: 'comment_add',
  header: 'header',
  footer: 'footer',
  pageNumber: 'document_page_number',
  textBox: 'textbox',
  equation: 'sigma',
  symbol: 'omega',
  drawSelect: 'cursor',
  drawPen: 'pen',
  drawHighlighter: 'highlight',
  drawRuler: 'ruler',
  eraserSmall: 'eraser',
  eraserMedium: 'eraser',
  lassoSelect: 'lassoSelect',
  drawInkMode: 'drawInkMode',
  fingerPainting: 'fingerPainting',
  penFavorite: 'pen',
  addPenFavorite: 'add',
  inkStart: 'pen',
  inkHide: 'inkHide',
  inkDeleteAll: 'trash',
  drawEraser: 'eraser',
  drawClear: 'trash',
  pageColor: 'color_background',
  pageBorders: 'border_outside',
  layoutPageColor: 'color_background',
  layoutPageBorders: 'border_outside',
  watermark: 'watermark',
  insertToc: 'toc',
  insertTocInsert: 'toc',
  updateToc: 'refresh',
  insertFootnote: 'footnote',
  insertEndnote: 'document_endnote',
  nextNote: 'arrow_right',
  insertCitation: 'quote',
  bibliography: 'book',
  insertCaption: 'caption',
  bookmarkRef: 'bookmark',
  crossRef: 'document_link',
  spelling: 'text_grammar_checkmark',
  wordCount: 'count',
  accessibility: 'accessibility',
  reviewCommentNew: 'comment_add',
  reviewCommentDelete: 'comment_dismiss',
  trackChanges: 'track',
  reviewPane: 'pane',
  readMode: 'book',
  printLayout: 'print',
  webLayout: 'webLayout',
  immersive: 'immersive',
  darkMode: 'moon',
  ruler: 'ruler',
  navigation: 'panel_left_text',
  newWindow: 'newwindow',
  fullscreen: 'fullscreen',
  help: 'help',
  shortcuts: 'keyboard',
  feedback: 'person_feedback',
  moreHome: 'more_horizontal',
  tableGrid: 'table',
  alignMenu: 'align-left',
  spacingMenu: 'text_line_spacing',
  stylePicker: 'styleSets',
  marginsMenu: 'document_margins',
  orientationMenu: 'orientation',
  pageSizeMenu: 'document_width',
  columnsMenu: 'column_triple',
  columnsMore: 'column_triple',
  breaksMenu: 'document_split_hint',
  breakPage: 'document_page_break',
  breakSection: 'document_split_hint',
  layoutIndentDec: 'text-indent-dec',
  layoutIndentInc: 'text-indent-inc',
  pageColorMenu: 'color_background',
  markup: 'track',
  acceptAll: 'checkmark',
  rejectAll: 'dismiss',
  reviewCommentPrev: 'comment_arrow_left',
  reviewCommentNext: 'comment_arrow_right',
  zoom: 'zoom_in',
  zoomMenu: 'zoom_in',
  pageWidth: 'document_width',
  wholePage: 'page_fit',
  tableBorderTop: 'border_top',
  tableBorderBottom: 'border_bottom',
  tableBorderLeft: 'border_left',
  tableBorderRight: 'border_right',
  tableBorderDiagDown: 'border_all',
  tableBorderDiagUp: 'border_inside',
  tableBorderNone: 'border_none',
};

/** Fluent UI System Icons (the icon set used by Office for the web). */
export function wordIconPaths(commandId: string): string[] {
  const name = WORD_COMMAND_ICONS[commandId];
  return name ? OFFICE_ICON_PATHS[name] ?? FLUENT_ICON_PATHS[name] ?? [] : [];
}

/** Full Office SVG markup for a command, so multiple paths/fills render intact. */
export function wordIconSvg(commandId: string): string {
  const name = WORD_COMMAND_ICONS[commandId];
  const body = name ? OFFICE_ICON_SVG[name] ?? null : null;
  if (!body) {
    const paths = wordIconPaths(commandId);
    return paths.length ? `<svg viewBox="0 0 20 20" aria-hidden="true">${paths.map((d) => `<path d="${d}"/>`).join('')}</svg>` : '';
  }
  return `<svg viewBox="0 0 20 20" aria-hidden="true">${body}</svg>`;
}

/** Layered two-tone Fluent SVG markup (base glyph + swatch-tinted accent layer). */
export function wordLayeredIconSvg(baseKey: string, accentKey: string): string {
  const base = OFFICE_ICON_SVG[baseKey] ?? '';
  const accent = OFFICE_ICON_SVG[accentKey] ?? '';
  if (!base && !accent) return '';
  const accentLayer = accent ? `<g class="op-icon-accent">${accent}</g>` : '';
  return `<svg viewBox="0 0 20 20" aria-hidden="true">${accentLayer}${base}</svg>`;
}
