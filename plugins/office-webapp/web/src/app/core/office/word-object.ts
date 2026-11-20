import { descendants, findChild, type XmlNode } from '../binary/xml';
import type { WordRun } from './types';
import { setImageAlt } from './word-accessibility';

const EMU_PER_PX = 9525;

/** Alt text on pictures/shapes: model plus the OOXML part Word reads. */
export function setRunAlt(run: WordRun, alt: string): void {
  const value = alt.trim();
  run.alt = value || undefined;
  const node = run.xmlNode
    ? (descendants(run.xmlNode, 'pic:cNvPr')[0] ?? descendants(run.xmlNode, 'wp:docPr')[0])
    : undefined;
  if (node) setImageAlt(node, value);
}

/** Fill/outline colour for a `wps:wsp` shape, mirrored into DrawingML. */
export function setShapeColor(run: WordRun, kind: 'fill' | 'outline', color: string): boolean {
  if (!run.textBox) return false;
  run.textBox = { ...run.textBox, [kind]: color };
  const spPr = run.xmlNode ? descendants(run.xmlNode, 'wps:spPr')[0] : undefined;
  if (!spPr) return true;
  const hex = color.replace('#', '').toUpperCase();
  let solid: XmlNode | null = null;
  if (kind === 'fill') {
    solid = findChild(spPr, 'a:solidFill');
    if (!solid) {
      solid = { name: 'a:solidFill', attrs: {}, text: '', children: [] };
      spPr.children.unshift(solid);
    }
  } else {
    let line = findChild(spPr, 'a:ln');
    if (!line) {
      line = { name: 'a:ln', attrs: { w: '12700' }, text: '', children: [] };
      spPr.children.push(line);
    }
    solid = findChild(line, 'a:solidFill');
    if (!solid) {
      solid = { name: 'a:solidFill', attrs: {}, text: '', children: [] };
      line.children.push(solid);
    }
  }
  let swatch = findChild(solid, 'a:srgbClr');
  if (!swatch) {
    swatch = { name: 'a:srgbClr', attrs: { val: hex }, text: '', children: [] };
    solid.children.push(swatch);
  }
  swatch.attrs['val'] = hex;
  return true;
}

/** Width/height in CSS pixels for a picture or shape, persisted as EMU extents. */
export function resizeRunObject(run: WordRun, width: number, height: number): void {
  const w = Math.max(8, Math.round(width));
  const h = Math.max(8, Math.round(height));
  if (run.textBox) {
    run.textBox = { ...run.textBox, width: w, height: h };
    if (run.xmlNode) {
      const ext = descendants(run.xmlNode, 'a:ext')[0];
      if (ext) { ext.attrs['cx'] = String(w * EMU_PER_PX); ext.attrs['cy'] = String(h * EMU_PER_PX); }
      const extent = descendants(run.xmlNode, 'wp:extent')[0];
      if (extent) { extent.attrs['cx'] = String(w * EMU_PER_PX); extent.attrs['cy'] = String(h * EMU_PER_PX); }
    }
    return;
  }
  run.imageWidth = w;
  run.imageHeight = h;
  const extent = run.xmlNode ? descendants(run.xmlNode, 'wp:extent')[0] : undefined;
  if (extent) { extent.attrs['cx'] = String(w * EMU_PER_PX); extent.attrs['cy'] = String(h * EMU_PER_PX); }
}
