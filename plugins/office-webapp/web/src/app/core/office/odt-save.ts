import { writeZip } from '../binary/zip';
import type { WordBlock, WordCellStyle, WordDocument, WordParagraph, WordRun } from './types';

const enc = new TextEncoder();

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function pxToCm(px: number): string {
  return `${Math.round(((px * 2.54) / 96) * 1000) / 1000}cm`;
}

function twipsToCm(twips: number): string {
  return `${Math.round(((twips * 2.54) / 1440) * 1000) / 1000}cm`;
}

function highlightToHex(name: string | undefined): string | undefined {
  if (!name || name === 'none') return undefined;
  const map: Record<string, string> = {
    yellow: '#FFFF00',
    green: '#00FF00',
    cyan: '#00FFFF',
    magenta: '#FF00FF',
    red: '#FF0000',
    blue: '#0000FF',
  };
  if (map[name]) return map[name];
  return name.startsWith('#') ? name : `#${name}`;
}

function normalizeColor(color: string | undefined): string | undefined {
  if (!color) return undefined;
  const clean = color.trim();
  if (!clean || clean === 'auto' || clean === 'transparent') return undefined;
  return clean.startsWith('#') ? clean : `#${clean}`;
}

/** Pure-TypeScript OpenDocument Text (.odt) serializer compatible with LibreOffice, Word, and `parseOdt`. */
export async function saveOdt(doc: WordDocument): Promise<Uint8Array> {
  const autoStyles: string[] = [];
  const pStyleCache = new Map<string, string>();
  const tStyleCache = new Map<string, string>();
  const cStyleCache = new Map<string, string>();
  const colStyleCache = new Map<number, string>();
  let pCounter = 0;
  let tCounter = 0;
  let cCounter = 0;
  let colCounter = 0;

  const pageWidthPx = doc.pageSize?.width || 816;
  const pageHeightPx = doc.pageSize?.height || 1056;
  const mTop = doc.pageMargins?.top ?? 96;
  const mBottom = doc.pageMargins?.bottom ?? 96;
  const mLeft = doc.pageMargins?.left ?? 96;
  const mRight = doc.pageMargins?.right ?? 96;

  const paragraphStyleName = (p: WordParagraph): string => {
    const align = p.align === 'center' ? 'center' : p.align === 'right' ? 'right' : p.align === 'justify' ? 'justify' : p.align === 'left' ? 'left' : undefined;
    const key = JSON.stringify([
      p.style ?? '',
      align ?? '',
      p.indent ?? 0,
      p.indentRight ?? 0,
      p.firstLineIndent ?? 0,
      p.spaceBeforePx ?? 0,
      p.spaceAfterPx ?? 0,
      p.lineSpacing ?? 0,
      Boolean(p.pageBreakBefore),
      p.shading ?? '',
    ]);
    const existing = pStyleCache.get(key);
    if (existing) return existing;
    const name = `P${++pCounter}`;
    pStyleCache.set(key, name);

    const parent = p.headingLevel
      ? `Heading_20_${p.headingLevel}`
      : p.style === 'Title' || p.style === 'Subtitle' || p.style === 'Quote'
        ? p.style
        : 'Standard';

    const attrs: string[] = [];
    if (align) attrs.push(`fo:text-align="${align}"`);
    if (p.indent) attrs.push(`fo:margin-left="${twipsToCm(p.indent)}"`);
    if (p.indentRight) attrs.push(`fo:margin-right="${twipsToCm(p.indentRight)}"`);
    if (p.firstLineIndent) attrs.push(`fo:text-indent="${twipsToCm(p.firstLineIndent)}"`);
    if (p.spaceBeforePx) attrs.push(`fo:margin-top="${pxToCm(p.spaceBeforePx)}"`);
    if (p.spaceAfterPx !== undefined) attrs.push(`fo:margin-bottom="${pxToCm(p.spaceAfterPx)}"`);
    if (p.lineSpacing) attrs.push(`fo:line-height="${Math.round(p.lineSpacing * 100)}%"`);
    if (p.pageBreakBefore) attrs.push(`fo:break-before="page"`);
    const pShade = normalizeColor(p.shading);
    if (pShade) attrs.push(`fo:background-color="${pShade}"`);

    const pProps = attrs.length ? `<style:paragraph-properties ${attrs.join(' ')}/>` : '';
    const textAttrs: string[] = [];
    if (p.fontSizePt) textAttrs.push(`fo:font-size="${p.fontSizePt}pt"`);
    if (p.fontFamily) textAttrs.push(`fo:font-family="'${escapeXml(p.fontFamily)}'"`);
    const tProps = textAttrs.length ? `<style:text-properties ${textAttrs.join(' ')}/>` : '';
    autoStyles.push(`<style:style style:name="${name}" style:family="paragraph" style:parent-style-name="${parent}">${pProps}${tProps}</style:style>`);
    return name;
  };

  const textStyleName = (run: WordRun): string | undefined => {
    const color = normalizeColor(run.color);
    const bg = normalizeColor(run.shading) ?? highlightToHex(run.highlight);
    if (!run.bold && !run.italic && !run.underline && !run.strike && !run.caps && !run.smallCaps && !run.vertAlign && !color && !bg && !run.sizePt && !run.font) {
      return undefined;
    }
    const key = JSON.stringify([
      Boolean(run.bold), Boolean(run.italic), Boolean(run.underline), Boolean(run.strike),
      Boolean(run.caps), Boolean(run.smallCaps), run.vertAlign ?? '',
      color ?? '', bg ?? '', run.sizePt ?? 0, run.font ?? '',
    ]);
    const existing = tStyleCache.get(key);
    if (existing) return existing;
    const name = `T${++tCounter}`;
    tStyleCache.set(key, name);

    const attrs: string[] = [];
    if (run.bold) attrs.push('fo:font-weight="bold"');
    if (run.italic) attrs.push('fo:font-style="italic"');
    if (run.underline) attrs.push('style:text-underline-style="solid" style:text-underline-width="auto"');
    if (run.strike) attrs.push('style:text-line-through-style="solid"');
    if (run.caps) attrs.push('fo:text-transform="uppercase"');
    if (run.smallCaps) attrs.push('fo:font-variant="small-caps"');
    if (run.vertAlign === 'superscript') attrs.push('style:text-position="super 58%"');
    else if (run.vertAlign === 'subscript') attrs.push('style:text-position="sub 58%"');
    if (color) attrs.push(`fo:color="${escapeXml(color)}"`);
    if (bg) attrs.push(`fo:background-color="${escapeXml(bg)}"`);
    if (run.sizePt) attrs.push(`fo:font-size="${run.sizePt}pt"`);
    if (run.font) attrs.push(`fo:font-family="'${escapeXml(run.font)}'"`);
    autoStyles.push(`<style:style style:name="${name}" style:family="text"><style:text-properties ${attrs.join(' ')}/></style:style>`);
    return name;
  };

  const cellStyleName = (cs: WordCellStyle | undefined): string => {
    const key = JSON.stringify(cs ?? {});
    const existing = cStyleCache.get(key);
    if (existing) return existing;
    const name = `Cell${++cCounter}`;
    cStyleCache.set(key, name);
    const attrs: string[] = ['fo:padding="0.1cm"'];
    const fill = normalizeColor(cs?.fill);
    if (fill) attrs.push(`fo:background-color="${escapeXml(fill)}"`);
    if (cs?.valign === 'center') attrs.push('style:vertical-align="middle"');
    else if (cs?.valign === 'bottom') attrs.push('style:vertical-align="bottom"');
    else attrs.push('style:vertical-align="top"');
    const bw = cs?.borderWidthPx ? `${Math.round(((cs.borderWidthPx * 72) / 96) * 10) / 10}pt` : '0.5pt';
    const bc = normalizeColor(cs?.borderColor) ?? '#000000';
    const rule = `${bw} solid ${escapeXml(bc)}`;
    attrs.push(`fo:border-top="${cs?.borderTop === false ? 'none' : rule}"`);
    attrs.push(`fo:border-bottom="${cs?.borderBottom === false ? 'none' : rule}"`);
    attrs.push(`fo:border-left="${cs?.borderLeft === false ? 'none' : rule}"`);
    attrs.push(`fo:border-right="${cs?.borderRight === false ? 'none' : rule}"`);
    autoStyles.push(`<style:style style:name="${name}" style:family="table-cell"><style:table-cell-properties ${attrs.join(' ')}/></style:style>`);
    return name;
  };

  const colStyleName = (widthPx: number): string => {
    const rounded = Math.max(24, Math.round(widthPx));
    const existing = colStyleCache.get(rounded);
    if (existing) return existing;
    const name = `Col${++colCounter}`;
    colStyleCache.set(rounded, name);
    autoStyles.push(`<style:style style:name="${name}" style:family="table-column"><style:table-column-properties style:column-width="${pxToCm(rounded)}"/></style:style>`);
    return name;
  };

  const renderInlineText = (raw: string): string => {
    if (!raw) return '';
    return escapeXml(raw)
      .replace(/\t/g, '<text:tab/>')
      .replace(/\n/g, '<text:line-break/>')
      .replace(/ {2,}/g, (spaces) => ` <text:s text:c="${spaces.length - 1}"/>`);
  };

  const renderRuns = (runs: WordRun[]): string => runs.map((run) => {
    if (run.pageBreak) return '';
    const innerText = run.equation
      ? `[${run.equation.label}]`
      : run.noteRef
        ? `[${run.noteRef.label}]`
        : run.textBox
          ? run.textBox.text
          : run.text ?? '';
    if (!innerText) return '';
    const style = textStyleName(run);
    const body = renderInlineText(innerText);
    const span = style ? `<text:span text:style-name="${style}">${body}</text:span>` : body;
    if (run.link) {
      return `<text:a xlink:type="simple" xlink:href="${escapeXml(run.link)}">${span}</text:a>`;
    }
    return span;
  }).join('');

  const renderParagraph = (p: WordParagraph): string => {
    const sName = paragraphStyleName(p);
    const inline = renderRuns(p.runs);
    if (p.headingLevel && !p.listType) {
      return `<text:h text:style-name="${sName}" text:outline-level="${Math.min(6, Math.max(1, p.headingLevel))}">${inline}</text:h>`;
    }
    return `<text:p text:style-name="${sName}">${inline}</text:p>`;
  };

  const bodyParts: string[] = [];
  let idx = 0;
  let tableSeq = 0;
  while (idx < doc.blocks.length) {
    const block: WordBlock = doc.blocks[idx];
    if (block.kind === 'paragraph') {
      const listType = block.paragraph.listType;
      if (listType) {
        const styleName = listType === 'number' ? 'NumberingList' : 'BulletList';
        const items: string[] = [];
        while (idx < doc.blocks.length) {
          const cur = doc.blocks[idx];
          if (cur.kind !== 'paragraph' || cur.paragraph.listType !== listType) break;
          items.push(`<text:list-item>${renderParagraph(cur.paragraph)}</text:list-item>`);
          idx++;
        }
        bodyParts.push(`<text:list text:style-name="${styleName}">${items.join('')}</text:list>`);
        continue;
      }
      bodyParts.push(renderParagraph(block.paragraph));
      idx++;
      continue;
    }

    // Table block
    tableSeq++;
    const colCount = Math.max(1, ...block.rows.map((r) => r.length));
    const colWidths = block.colWidthsPx?.length
      ? block.colWidthsPx
      : Array.from({ length: colCount }, (_, c) => {
          const pct = block.grid?.[c];
          return pct ? Math.round(((pageWidthPx - mLeft - mRight) * pct) / 100) : Math.round((pageWidthPx - mLeft - mRight) / colCount);
        });
    const colsXml = colWidths.slice(0, colCount).map((w) => `<table:table-column table:style-name="${colStyleName(w)}"/>`).join('');
    const headerCount = block.headerRows ?? 0;
    const renderRow = (rIdx: number): string => {
      const row = block.rows[rIdx];
      const cellsXml = row.map((cellParas, cIdx) => {
        const span = block.cellSpans?.[rIdx]?.[cIdx];
        if (span?.vMerge === 'continue') return '<table:covered-table-cell/>';
        const csName = cellStyleName(block.cellStyles?.[rIdx]?.[cIdx]);
        const spanAttrs: string[] = [`table:style-name="${csName}"`];
        if (span?.colSpan && span.colSpan > 1) spanAttrs.push(`table:number-columns-spanned="${span.colSpan}"`);
        if (span?.vMerge === 'restart') {
          let rSpan = 1;
          for (let nr = rIdx + 1; nr < block.rows.length; nr++) {
            if (block.cellSpans?.[nr]?.[cIdx]?.vMerge === 'continue') rSpan++;
            else break;
          }
          if (rSpan > 1) spanAttrs.push(`table:number-rows-spanned="${rSpan}"`);
        }
        const parasXml = (cellParas.length ? cellParas : [{ runs: [{ text: '' }] }])
          .map((cp) => renderParagraph(cp)).join('');
        const coveredFollows = span?.colSpan && span.colSpan > 1
          ? '<table:covered-table-cell/>'.repeat(span.colSpan - 1)
          : '';
        return `<table:table-cell ${spanAttrs.join(' ')}>${parasXml}</table:table-cell>${coveredFollows}`;
      }).join('');
      return `<table:table-row>${cellsXml}</table:table-row>`;
    };

    const headerRowsXml = headerCount > 0
      ? `<table:table-header-rows>${Array.from({ length: Math.min(headerCount, block.rows.length) }, (_, r) => renderRow(r)).join('')}</table:table-header-rows>`
      : '';
    const dataRowsXml = Array.from(
      { length: Math.max(0, block.rows.length - headerCount) },
      (_, offset) => renderRow(headerCount + offset),
    ).join('');
    bodyParts.push(`<table:table table:name="Table${tableSeq}">${colsXml}${headerRowsXml}${dataRowsXml}</table:table>`);
    idx++;
  }

  const headerText = doc.sections?.[0]?.headers.find((h) => h.type === 'default')?.text ?? '';
  const footerText = doc.sections?.[0]?.footers.find((f) => f.type === 'default')?.text ?? '';

  const stylesXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  office:version="1.2">
  <office:styles>
    <style:style style:name="Standard" style:family="paragraph" style:class="text">
      <style:paragraph-properties fo:margin-bottom="0.21cm"/>
      <style:text-properties fo:font-size="11pt" fo:font-family="'Calibri'"/>
    </style:style>
    <style:style style:name="Title" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="22pt" fo:font-weight="bold"/>
    </style:style>
    <style:style style:name="Subtitle" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="15pt" fo:color="#4B5563"/>
    </style:style>
    <style:style style:name="Quote" style:family="paragraph" style:parent-style-name="Standard">
      <style:paragraph-properties fo:margin-left="0.5cm"/>
      <style:text-properties fo:font-style="italic"/>
    </style:style>
    <style:style style:name="Heading_20_1" style:display-name="Heading 1" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="20pt" fo:font-weight="bold" fo:color="#1F4E79"/>
    </style:style>
    <style:style style:name="Heading_20_2" style:display-name="Heading 2" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="16pt" fo:font-weight="bold" fo:color="#1F4E79"/>
    </style:style>
    <style:style style:name="Heading_20_3" style:display-name="Heading 3" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="13pt" fo:font-weight="bold" fo:color="#1F3864"/>
    </style:style>
    <style:style style:name="Heading_20_4" style:display-name="Heading 4" style:family="paragraph" style:parent-style-name="Standard">
      <style:text-properties fo:font-size="11pt" fo:font-weight="bold" fo:font-style="italic"/>
    </style:style>
    <text:list-style style:name="BulletList">
      <text:list-level-style-bullet text:level="1" text:bullet-char="•"/>
    </text:list-style>
    <text:list-style style:name="NumberingList">
      <text:list-level-style-number text:level="1" style:num-format="1"/>
    </text:list-style>
  </office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="Mpm1">
      <style:page-layout-properties fo:page-width="${pxToCm(pageWidthPx)}" fo:page-height="${pxToCm(pageHeightPx)}"
        fo:margin-top="${pxToCm(mTop)}" fo:margin-bottom="${pxToCm(mBottom)}"
        fo:margin-left="${pxToCm(mLeft)}" fo:margin-right="${pxToCm(mRight)}"/>
    </style:page-layout>
  </office:automatic-styles>
  <office:master-styles>
    <style:master-page style:name="Standard" style:page-layout-name="Mpm1">
      ${headerText ? `<style:header><text:p>${escapeXml(headerText)}</text:p></style:header>` : ''}
      ${footerText ? `<style:footer><text:p>${escapeXml(footerText)}</text:p></style:footer>` : ''}
    </style:master-page>
  </office:master-styles>
</office:document-styles>`;

  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:xlink="http://www.w3.org/1999/xlink"
  office:version="1.2">
  <office:automatic-styles>
    ${autoStyles.join('\n    ')}
  </office:automatic-styles>
  <office:body>
    <office:text>
      ${bodyParts.join('\n      ')}
    </office:text>
  </office:body>
</office:document-content>`;

  const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.2" manifest:media-type="application/vnd.oasis.opendocument.text"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

  return writeZip([
    { name: 'mimetype', data: enc.encode('application/vnd.oasis.opendocument.text') },
    { name: 'content.xml', data: enc.encode(contentXml) },
    { name: 'styles.xml', data: enc.encode(stylesXml) },
    { name: 'META-INF/manifest.xml', data: enc.encode(manifestXml) },
  ]);
}
