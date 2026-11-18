import { FLUENT_ICON_PATHS } from './word-fluent-icons';

export type WordRibbonTabId =
  | 'home' | 'insert' | 'table' | 'draw' | 'design' | 'layout' | 'references' | 'mailings' | 'review'
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
    | 'margins' | 'orientation' | 'pageSize' | 'columns' | 'lineNumbers' | 'zoom' | 'shading';
  /** Office command shown but unavailable in the browser implementation. */
  disabled?: boolean;
  /** Tooltip explaining why a disabled command is unavailable. */
  hintKey?: string;
}

export interface WordRibbonGroup {
  id: string;
  labelKey: string;
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
): WordRibbonItem => ({ id, labelKey, glyph, large, control, compact, disabled, hintKey });

export const WORD_RIBBON: WordRibbonTab[] = [
  {
    id: 'home',
    labelKey: 'office.ribbon.home',
    groups: [
      {
        id: 'clipboard',
        labelKey: 'office.rb.group.clipboard',
        items: [
          it('paste', 'office.rb.paste', undefined, true),
          it('cut', 'office.rb.cut', undefined, false, undefined, true),
          it('copy', 'office.rb.copy', undefined, false, undefined, true),
          it('painter', 'office.word.formatPainter', undefined, false, undefined, true),
        ],
      },
      {
        id: 'font',
        labelKey: 'office.rb.group.font',
        items: [
          it('fontName', 'office.rb.fontName', undefined, false, 'fontName'),
          it('fontSize', 'office.rb.fontSize', undefined, false, 'fontSize'),
          it('growFont', 'office.word.growFont', undefined, false, undefined, true),
          it('shrinkFont', 'office.word.shrinkFont', undefined, false, undefined, true),
          it('bold', 'office.word.bold', undefined, false, undefined, true),
          it('italic', 'office.word.italic', undefined, false, undefined, true),
          it('underline', 'office.word.underline', undefined, false, undefined, true),
          it('strike', 'office.word.strike', undefined, false, undefined, true),
          it('fontColor', 'office.rb.fontColor', undefined, false, 'fontColor'),
          it('highlight', 'office.word.highlight', undefined, false, 'highlight'),
          it('clearFormat', 'office.word.clearFormat', undefined, false, undefined, true),
        ],
      },
      {
        id: 'paragraph',
        labelKey: 'office.rb.group.paragraph',
        items: [
          it('bullets', 'office.word.list.bullet', undefined, false, undefined, true),
          it('numbering', 'office.word.list.number', undefined, false, undefined, true),
          it('checklist', 'office.rb.checklist', undefined, false, undefined, true),
          it('indentDec', 'office.rb.indentDec', undefined, false, undefined, true),
          it('indentInc', 'office.rb.indentInc', undefined, false, undefined, true),
          it('alignLeft', 'office.word.align.left', undefined, false, undefined, true),
          it('alignCenter', 'office.word.align.center', undefined, false, undefined, true),
          it('alignRight', 'office.word.align.right', undefined, false, undefined, true),
          it('alignJustify', 'office.word.align.justify', undefined, false, undefined, true),
          it('spacing', 'office.word.lineSpacing', undefined, false, 'spacing'),
          it('shading', 'office.rb.shading', undefined, false, 'shading'),
          it('paragraphBorders', 'office.rb.paragraphBorders', undefined, false, undefined, true),
          it('paragraphOptions', 'office.rb.paragraphOptions', undefined, false, undefined, true),
          it('sortParagraphs', 'office.rb.sort', undefined, false, undefined, true),
          it('showMarks', 'office.rb.showMarks', undefined, false, undefined, true),
        ],
      },
      {
        id: 'styles',
        labelKey: 'office.rb.group.styles',
        items: [
          it('style', 'office.word.style', undefined, false, 'style'),
        ],
      },
      {
        id: 'editing',
        labelKey: 'office.rb.group.editing',
        items: [
          it('find', 'office.rb.find', undefined, false, undefined, true),
          it('replace', 'office.rb.replace', undefined, false, undefined, true),
          it('selectAll', 'office.rb.selectAll', undefined, false, undefined, true),
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
    labelKey: 'office.ribbon.table',
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
    id: 'draw',
    labelKey: 'office.ribbon.draw',
    groups: [
      {
        id: 'pens',
        labelKey: 'office.rb.group.pens',
        items: [
          it('drawSelect', 'office.rb.drawSelect', undefined, true),
          it('drawPen', 'office.word.ink', undefined, true),
          it('drawEraser', 'office.rb.drawEraser', undefined, true),
          it('drawClear', 'office.rb.drawClear', undefined, true),
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

/** Icon name for large ribbon commands, matching Office button placement. */
export const WORD_COMMAND_ICONS: Record<string, string> = {
  undo: 'arrow-undo',
  redo: 'arrow-redo',
  growFont: 'text-font-size',
  shrinkFont: 'text-font-size-off',
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
  selectAll: 'selectAll',
  indentDec: 'text-indent-dec',
  indentInc: 'text-indent-inc',
  shading: 'droplet',
  paste: 'clipboard',
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
  chart: 'chart',
  themes: 'themes',
  styleSets: 'styleSets',
  tableOfFigures: 'tableOfFigures',
  markEntry: 'markEntry',
  insertIndex: 'insertIndex',
  updateIndex: 'updateIndex',
  checklist: 'checklist',
  paragraphBorders: 'paragraphBorders',
  paragraphOptions: 'paragraphOptions',
  emoji: 'emoji',
  markAllRead: 'markAllRead',
  showComments: 'showComments',
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
  blankPage: 'file',
  pageBreak: 'file',
  table: 'grid',
  tableInsertRowAbove: 'table-stack-above',
  tableInsertRowBelow: 'table-stack-below',
  tableInsertColumnLeft: 'table-stack-left',
  tableInsertColumnRight: 'table-stack-right',
  tableDeleteRow: 'table-delete-row',
  tableDeleteColumn: 'table-delete-column',
  tableDelete: 'table-dismiss',
  tableHeaderRow: 'table-repeat',
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
  drawing: 'pen',
  video: 'video',
  link: 'link',
  bookmark: 'bookmark',
  crossReference: 'link',
  newComment: 'comment',
  header: 'header',
  footer: 'footer',
  pageNumber: 'hash',
  textBox: 'textbox',
  equation: 'sigma',
  symbol: 'omega',
  drawSelect: 'cursor',
  drawPen: 'pen',
  drawEraser: 'eraser',
  drawClear: 'trash',
  pageColor: 'droplet',
  pageBorders: 'square',
  layoutPageColor: 'droplet',
  layoutPageBorders: 'square',
  watermark: 'watermark',
  insertToc: 'toc',
  insertTocInsert: 'toc',
  updateToc: 'refresh',
  insertFootnote: 'footnote',
  insertEndnote: 'footnote',
  nextNote: 'footnote',
  insertCitation: 'quote',
  bibliography: 'book',
  insertCaption: 'caption',
  bookmarkRef: 'bookmark',
  crossRef: 'link',
  spelling: 'spell',
  wordCount: 'count',
  accessibility: 'accessibility',
  reviewCommentNew: 'comment',
  reviewCommentDelete: 'comment-x',
  trackChanges: 'track',
  reviewPane: 'pane',
  readMode: 'book',
  printLayout: 'print',
  immersive: 'immersive',
  darkMode: 'moon',
  ruler: 'ruler',
  navigation: 'nav',
  newWindow: 'newwindow',
  fullscreen: 'fullscreen',
  help: 'help',
  shortcuts: 'keyboard',
};

/** Fluent UI System Icons (the icon set used by Office for the web). */
export function wordIconPaths(commandId: string): string[] {
  const name = WORD_COMMAND_ICONS[commandId];
  return name ? FLUENT_ICON_PATHS[name] ?? [] : [];
}
