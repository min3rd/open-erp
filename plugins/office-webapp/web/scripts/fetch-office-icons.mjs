/**
 * Downloads the Office/Fluent SVG icon set for every Word ribbon command and
 * regenerates `word-office-icons.ts`, so the ribbon uses the same artwork as
 * Office instead of hand-copied paths. MIT licensed (microsoft/fluentui-system-icons).
 *
 *   node scripts/fetch-office-icons.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const here = path.dirname(url.fileURLToPath(import.meta.url));
const ribbonFile = path.resolve(here, '../src/app/core/office/word-ribbon.ts');
const outFile = path.resolve(here, '../src/app/core/office/word-office-icons.ts');
const source = fs.readFileSync(ribbonFile, 'utf8');

const block = source.slice(source.indexOf('const WORD_COMMAND_ICONS'));
const mapping = new Map();
for (const match of block.matchAll(/^\s{2}([\w]+):\s*'([\w-]+)',?$/gm)) {
  mapping.set(match[1], match[2]);
}
console.log('commands with icons:', mapping.size);

const listing = await (await fetch('https://unpkg.com/@fluentui/svg-icons/icons/?meta')).json();
const files = new Set(listing.files.map((entry) => entry.path.replace(/^\/?(icons\/)?/, '')));
console.log('available icons in package:', files.size);

const snake = (value) => value.replace(/-/g, '_').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();

// Fluent names differ from the labels we used; map the ones that do not match 1:1.
const corrections = {
  'text-strike': 'text_strikethrough', 'text-clear': 'text_clear_formatting', 'text-bullet': 'text_bullet_list',
  clipboard: 'clipboard_paste', numbering: 'text_number_list_ltr', 'text-indent-dec': 'text_indent_decrease', 'text-indent-inc': 'text_indent_increase',
  droplet: 'color_fill', scissors: 'cut',
  'align-left': 'text_align_left', 'align-center': 'text_align_center', 'align-right': 'text_align_right', 'align-justify': 'text_align_justify',
  chart: 'chart_multiple', position: 'position_forward', bringForward: 'arrow_upload', sendBackward: 'arrow_download',
  rotateObjects: 'arrow_rotate_clockwise', refresh: 'arrow_clockwise', trash: 'delete', file: 'document',
  'table-repeat': 'table_arrow_repeat_all', 'table-merge-cells': 'table_cells_merge',
  'table-split-cells': 'table_cells_split', hash: 'document_page_number', watermark: 'text_effects',
  toc: 'text_bullet_list_ltr', footnote: 'text_footnote', quote: 'text_quote', caption: 'text_description',
  'comment-x': 'comment_dismiss', moon: 'weather_moon',
  'arrow-undo': 'arrow_undo', 'arrow-redo': 'arrow_redo',
  font_increase: 'font_increase', font_decrease: 'font_decrease',
  bold: 'text_bold', italic: 'text_italic', underline: 'text_underline', strike: 'text_strikethrough',
  clearFormat: 'text_clear_formatting', bullets: 'text_bullet_list', numbering2: 'text_number_list_ltr',
  sortParagraphs: 'text_sort_ascending', showMarks: 'text_paragraph', find: 'search', replace: 'arrow_swap',
  selectAll: 'select_all_on', indentDec: 'text_indent_decrease', indentInc: 'text_indent_increase',
  shading: 'color_fill', paste: 'clipboard_paste', cut: 'cut', copy: 'copy', painter: 'paint_brush',
  alignLeft: 'text_align_left', alignCenter: 'text_align_center', alignRight: 'text_align_right',
  alignJustify: 'text_align_justify', coverPage: 'document_one_page', checklist: 'task_list_ltr',
  paragraphBorders: 'border_outside', paragraphOptions: 'options', orientationMenu: 'orientation',
  tableOfFigures: 'document_bullet_list', markEntry: 'book_add', insertIndex: 'book_add', updateIndex: 'arrow_clockwise',
  tableInsertRowAbove: 'table_stack_above', tableInsertRowBelow: 'table_stack_below',
  tableInsertColumnLeft: 'table_stack_left', tableInsertColumnRight: 'table_stack_right',
  tableDeleteRow: 'table_delete_row', tableDeleteColumn: 'table_delete_column', tableDelete: 'table_dismiss',
  tableHeaderRow: 'table_arrow_repeat_all', tableMergeCells: 'table_cells_merge', tableSplitCells: 'table_cells_split',
  tableDistributeColumns: 'table_resize_column', tableCellTop: 'align_top', tableCellCenter: 'align_middle',
  tableCellBottom: 'align_bottom', tableAlignLeft: 'text_align_left', tableAlignCenter: 'text_align_center',
  tableAlignRight: 'text_align_right', picture: 'image', drawing: 'draw_shape', pageNumber: 'document_page_number',
  textBox: 'text_box_settings', equation: 'math_formula', symbol: 'omega', drawSelect: 'cursor',
  drawPen: 'pen', drawHighlighter: 'highlighter', drawRuler: 'ruler', eraserSmall: 'eraser', eraserMedium: 'eraser',
  lassoSelect: 'lasso', drawInkMode: 'pen', fingerPainting: 'draw_text', penFavorite: 'pen', addPenFavorite: 'add',
  inkStart: 'pen', inkHide: 'eye_off', inkDeleteAll: 'delete', drawClear: 'delete', themes: 'color_background',
  styleSets: 'text_font', pageColor: 'color_background', pageBorders: 'border_outside', watermark2: 'text_effects',
  columns: 'column_triple', columnsMore: 'column_triple', lineNumbers: 'number_row',
  breakPage: 'document_page_break', breakSection: 'document_split_hint', insertToc: 'text_bullet_list_ltr',
  insertTocInsert: 'text_bullet_list_ltr', updateToc: 'arrow_clockwise', insertFootnote: 'text_footnote',
  insertEndnote: 'document_endnote', nextNote: 'arrow_right', insertCitation: 'text_quote', bibliography: 'book',
  insertCaption: 'text_description', bookmarkRef: 'bookmark', crossRef: 'document_link', crossReference: 'document_link', markEntry2: 'book_add',
  envelopes: 'mail', labels: 'tag', startMailMerge: 'mail_template', selectRecipients: 'people_list',
  editRecipients: 'people_edit', highlightMergeFields: 'highlight', addressBlock: 'home', greetingLine: 'chat',
  insertMergeField: 'arrow_import', mergeRules: 'arrow_swap', previewResults: 'eye', findRecipient: 'search',
  checkErrors: 'error_circle', finishMerge: 'checkmark_circle',
  spelling: 'text_grammar_checkmark', spell: 'text_grammar_checkmark', spellcheck: 'text_grammar_checkmark',
  thesaurus: 'book_open', wordCount: 'text_number_format', accessibility: 'accessibility',
  acceptAll: 'checkmark', rejectAll: 'dismiss', acceptPrev: 'arrow_left', acceptNext: 'arrow_right',
  rejectPrev: 'arrow_left', rejectNext: 'arrow_right',
  readMode: 'book_open', printLayout: 'print', webLayout: 'globe',
  immersive: 'full_screen_maximize', darkMode: 'weather_moon', ruler: 'ruler',
  navigation: 'panel_left_text', nav: 'panel_left_text',
  viewHeaderFooter: 'document_header', viewFootnotes: 'text_footnote', viewEndnotes: 'document_endnote',
  zoom: 'zoom_in', zoom100: 'zoom_fit', pageWidth: 'document_width', wholePage: 'page_fit',
  newWindow: 'window_new', fullscreen: 'full_screen_maximize', macros: 'code',
  help: 'question_circle', shortcuts: 'keyboard', feedback: 'person_feedback',
  reviewPane: 'panel_right', pane: 'panel_right', trackChanges: 'document_edit', track: 'document_edit',
  reviewCommentNew: 'comment_add', reviewCommentDelete: 'comment_dismiss', reviewCommentPrev: 'comment_arrow_left',
  reviewCommentNext: 'comment_arrow_right', showComments: 'comment_multiple', filterComments: 'filter',
  markAllRead: 'comment_multiple_checkmark', restrictEditing: 'lock_closed', wrapText: 'text_wrap', selectionPane: 'panel_left',
  alignObjects: 'align_straighten', groupObjects: 'group', altText: 'accessibility', resetPicture: 'arrow_reset',
  deleteObject: 'delete', objectSize: 'resize', shapeFill: 'color_fill', shapeOutline: 'color_line',
  cover: 'document_one_page', grid: 'grid', table: 'table', blankPage: 'document_add', pageBreak: 'document_page_break',
  icons: 'emoji', smartArt: 'diagram', video: 'video', link: 'link', bookmark: 'bookmark', newComment: 'comment_add',
  header: 'document_header', footer: 'document_footer', search: 'search', separatePages: 'document_multiple',
  switchBackground: 'dark_theme', count: 'text_number_format',
  book: 'book_open', print: 'print', newwindow: 'window_new',
  keyboard: 'keyboard', sigma: 'math_formula', omega: 'omega', cursor: 'cursor', eraser: 'eraser',
  shapes: 'shapes', textbox: 'text_box_settings',
};

const cache = new Map();
async function fetchIcon(rawName) {
  if (cache.has(rawName)) return cache.get(rawName);
  const candidates = [corrections[rawName], snake(rawName), rawName].filter(Boolean);
  let result = null;
  for (const candidate of candidates) {
    for (const variant of ['regular', 'filled']) {
      const file = `${candidate}_20_${variant}.svg`;
      if (!files.has(file)) continue;
      const response = await fetch(`https://unpkg.com/@fluentui/svg-icons/icons/${file}`);
      if (!response.ok) continue;
      const svg = await response.text();
      const body = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
      result = { name: rawName, body };
      break;
    }
    if (result) break;
  }
  cache.set(rawName, result);
  return result;
}

const icons = {};
const missing = [];
for (const [command, name] of mapping) {
  const icon = await fetchIcon(name);
  if (icon) icons[icon.name] = icon.body;
  else if (!missing.includes(name)) missing.push(`${command}→${name}`);
}
// Chrome glyphs and layered accent paths used by the shell and Word 365 Web ribbon.
const UI_ICONS = [
  'dismiss', 'search', 'chevron_down', 'chevron_left', 'chevron_right', 'more_horizontal', 'add', 'subtract',
  'cloud_checkmark', 'cloud_sync', 'cloud', 'folder_open', 'share', 'arrow_export_ltr', 'arrow_download', 'arrow_upload', 'arrow_reply', 'save', 'rename', 'info', 'warning',
  'panel_left', 'panel_left_text', 'weather_sunny', 'weather_moon', 'dark_theme', 'zoom_fit', 'zoom_in',
  'document', 'document_pdf', 'document_add', 'document_copy', 'document_page_break', 'document_edit', 'document_text', 'document_checkmark',
  'document_table', 'document_landscape', 'document_margins', 'document_width', 'document_page_number', 'document_one_page',
  'document_link', 'document_endnote', 'document_header_footer', 'document_split_hint', 'slide_content', 'code_text',
  'edit', 'eye', 'table', 'orientation', 'orientation_portrait', 'column_single_compare', 'column_double_compare', 'column_triple',
  'options', 'select_all_on', 'page_fit', 'omega', 'text_font', 'clipboard_paste', 'text_indent_decrease', 'text_indent_increase', 'arrow_right',
  'text_color', 'text_color_accent', 'highlight', 'highlight_accent',
  'color_fill', 'color_fill_accent', 'color_background', 'color_background_accent', 'color_line', 'color_line_accent',
  'border_top', 'border_bottom', 'border_left', 'border_right', 'border_outside', 'border_all', 'border_inside', 'border_none',
  'text_line_spacing', 'text_align_left', 'text_align_center', 'text_align_right', 'text_align_justify',
  'font_increase', 'font_decrease', 'text_subscript', 'text_superscript', 'text_change_case', 'text_grammar_checkmark',
  'comment_add', 'comment_multiple', 'comment_multiple_checkmark', 'comment_dismiss', 'comment_arrow_left', 'comment_arrow_right',
  'checkmark', 'checkmark_circle', 'delete', 'send', 'question_circle', 'print', 'copy', 'link', 'file',
];
for (const name of UI_ICONS) {
  if (icons[name]) continue;
  const icon = await fetchIcon(name);
  if (icon) icons[icon.name] = icon.body;
  else missing.push(`ui→${name}`);
}
console.log('downloaded icons:', Object.keys(icons).length, 'missing:', missing.length);
if (missing.length) console.log('missing:', missing.join(', '));

const entries = Object.entries(icons).sort(([a], [b]) => a.localeCompare(b))
  .map(([name, body]) => `  ${JSON.stringify(name)}: ${JSON.stringify(body)},`)
  .join('\n');

fs.writeFileSync(outFile, `/** Office 365 (Fluent) SVG artwork, MIT — microsoft/fluentui-system-icons.
 *  Generated by scripts/fetch-office-icons.mjs; do not edit by hand. */
export const OFFICE_ICON_SVG: Record<string, string> = {
${entries}
};

/** Every \`d\` attribute of a downloaded icon, for code that only needs the paths. */
export const OFFICE_ICON_PATHS: Record<string, string[]> = Object.fromEntries(
  Object.entries(OFFICE_ICON_SVG).map(([name, body]) => [
    name,
    [...body.matchAll(/ d="([^"]+)"/g)].map((match) => match[1]),
  ]),
);
`);
console.log('wrote', path.basename(outFile));
