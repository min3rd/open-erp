import { attr, descendants, findChild, parseXml, serializeXml, type XmlNode } from '../binary/xml';
import type { WordDocument } from './types';
import { setDocVar } from './word-protect';

export interface WordThemePreset {
  id: string;
  labelKey: string;
  accent: string;
  font: string;
}

export const WORD_THEMES: WordThemePreset[] = [
  { id: 'office', labelKey: 'office.rb.theme.office', accent: '1F4E79', font: 'Calibri' },
  { id: 'berlin', labelKey: 'office.rb.theme.berlin', accent: 'C00000', font: 'Arial' },
  { id: 'tokyo', labelKey: 'office.rb.theme.tokyo', accent: '2E7D32', font: 'Cambria' },
  { id: 'paris', labelKey: 'office.rb.theme.paris', accent: '6A1B9A', font: 'Georgia' },
];

export const WORD_STYLE_SETS: Array<{ id: string; labelKey: string }> = [
  { id: 'default', labelKey: 'office.rb.styleSet.default' },
  { id: 'modern', labelKey: 'office.rb.styleSet.modern' },
  { id: 'classic', labelKey: 'office.rb.styleSet.classic' },
];

const THEME_PATH = 'word/theme/theme1.xml';

export function parseWordTheme(entries: Map<string, Uint8Array>): { accent: string; font: string } | undefined {
  const bytes = entries.get(THEME_PATH);
  if (!bytes) return undefined;
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const scheme = descendants(root, 'a:clrScheme')[0];
  const accent = attr(descendants(scheme, 'a:accent1')[0] ? findChild(descendants(scheme, 'a:accent1')[0], 'a:srgbClr') : null, 'val');
  const font = attr(findChild(descendants(root, 'a:majorFont')[0], 'a:latin'), 'typeface');
  if (!accent && !font) return undefined;
  return { accent: accent ? `#${accent.toUpperCase()}` : '#1F4E79', font: font || 'Calibri' };
}

export function applyWordTheme(document: WordDocument, preset: WordThemePreset): boolean {
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;
  const bytes = entries.get(THEME_PATH);
  let root: XmlNode;
  if (bytes) {
    root = parseXml(new TextDecoder('utf-8').decode(bytes));
  } else {
    root = {
      name: 'a:theme',
      attrs: { 'xmlns:a': 'http://schemas.openxmlformats.org/drawingml/2006/main', name: preset.id },
      text: '', children: [{
        name: 'a:themeElements', attrs: {}, text: '', children: [
          { name: 'a:clrScheme', attrs: { name: preset.id }, text: '', children: [
            { name: 'a:accent1', attrs: {}, text: '', children: [
              { name: 'a:srgbClr', attrs: { val: preset.accent }, text: '', children: [] },
            ] },
          ] },
          { name: 'a:fontScheme', attrs: { name: preset.id }, text: '', children: [
            { name: 'a:majorFont', attrs: {}, text: '', children: [
              { name: 'a:latin', attrs: { typeface: preset.font }, text: '', children: [] },
            ] },
            { name: 'a:minorFont', attrs: {}, text: '', children: [
              { name: 'a:latin', attrs: { typeface: preset.font }, text: '', children: [] },
            ] },
          ] },
        ],
      }],
    };
    ensureThemePart(entries);
  }
  const scheme = descendants(root, 'a:clrScheme')[0];
  const accent1 = scheme ? findChild(scheme, 'a:accent1') : null;
  const color = accent1 ? findChild(accent1, 'a:srgbClr') : null;
  if (color) color.attrs['val'] = preset.accent;
  for (const fontNode of [...descendants(root, 'a:majorFont'), ...descendants(root, 'a:minorFont')]) {
    const latin = findChild(fontNode, 'a:latin');
    if (latin) latin.attrs['typeface'] = preset.font;
  }
  entries.set(THEME_PATH, new TextEncoder().encode(
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + serializeXml(root)));
  document.theme = { accent: `#${preset.accent}`, font: preset.font };
  setDocVar(document, 'OpenErpTheme', preset.id);
  return true;
}

function ensureThemePart(entries: Map<string, Uint8Array>): void {
  const typesPath = '[Content_Types].xml';
  let types = entries.get(typesPath) ? new TextDecoder('utf-8').decode(entries.get(typesPath)) : '';
  if (!types) {
    types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"></Types>';
  }
  if (!types.includes('/word/theme/theme1.xml')) {
    types = types.replace('</Types>', '<Override PartName="/word/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/></Types>');
  }
  entries.set(typesPath, new TextEncoder().encode(types));

  const relsPath = 'word/_rels/document.xml.rels';
  let rels = entries.get(relsPath) ? new TextDecoder('utf-8').decode(entries.get(relsPath)) : '';
  if (!rels) {
    rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>';
  }
  if (!rels.includes('theme/theme1.xml')) {
    rels = rels.replace('</Relationships>',
      '<Relationship Id="rIdTheme" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/></Relationships>');
  }
  entries.set(relsPath, new TextEncoder().encode(rels));
}

const HEADING_SIZES: Record<string, Array<{ size: number; bold: boolean; color?: string }>> = {
  default: [{ size: 32, bold: true }, { size: 26, bold: true }, { size: 24, bold: true }],
  modern: [{ size: 36, bold: true, color: '1F4E79' }, { size: 28, bold: true, color: '2E75B6' }, { size: 24, bold: false, color: '404040' }],
  classic: [{ size: 30, bold: true }, { size: 26, bold: true }, { size: 22, bold: true }],
};

export function applyStyleSet(document: WordDocument, styleSet: string): boolean {
  const entries = document.packageEntries ?? new Map<string, Uint8Array>();
  document.packageEntries = entries;
  const sizes = HEADING_SIZES[styleSet] ?? HEADING_SIZES['default'];
  const bytes = entries.get('word/styles.xml');
  if (bytes) {
    const root = parseXml(new TextDecoder('utf-8').decode(bytes));
    const styles = findChild(root, 'w:styles') ?? root;
    sizes.forEach((config, index) => {
      const styleId = `Heading${index + 1}`;
      const style = styles.children.find((child) => child.name === 'w:style' && child.attrs['w:styleId'] === styleId);
      if (!style) return;
      let rPr = findChild(style, 'w:rPr');
      if (!rPr) {
        rPr = { name: 'w:rPr', attrs: {}, text: '', children: [] };
        style.children.push(rPr);
      }
      const halfPoints = String(Math.round(config.size * 2));
      let sz = findChild(rPr, 'w:sz');
      if (!sz) { sz = { name: 'w:sz', attrs: {}, text: '', children: [] }; rPr.children.push(sz); }
      sz.attrs['w:val'] = halfPoints;
      const bold = findChild(rPr, 'w:b');
      if (config.bold && !bold) rPr.children.push({ name: 'w:b', attrs: {}, text: '', children: [] });
      if (!config.bold && bold) rPr.children = rPr.children.filter((child) => child !== bold);
      if (config.color) {
        let color = findChild(rPr, 'w:color');
        if (!color) { color = { name: 'w:color', attrs: {}, text: '', children: [] }; rPr.children.push(color); }
        color.attrs['w:val'] = config.color;
      }
    });
    entries.set('word/styles.xml', new TextEncoder().encode(
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' + serializeXml(root)));
  }
  document.styleSet = styleSet;
  setDocVar(document, 'OpenErpStyleSet', styleSet);
  return true;
}

export function parseStyleSet(entries: Map<string, Uint8Array>): string | undefined {
  const bytes = entries.get('word/settings.xml');
  if (!bytes) return 'default';
  const root = parseXml(new TextDecoder('utf-8').decode(bytes));
  const settings = findChild(root, 'w:settings') ?? root;
  for (const variable of findChild(settings, 'w:docVars')?.children ?? []) {
    const name = attr(variable, 'w:name');
    if (name === 'OpenErpStyleSet') return attr(variable, 'w:val') ?? 'default';
  }
  return 'default';
}
