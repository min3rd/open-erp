import { attr, descendants, findChild, findChildren, parseXml, type XmlNode } from '../binary/xml';
import { findZipEntry } from '../binary/zip';
import { layoutChart, type ChartModel, type ChartType } from './chart';
import type { WordChart } from './types';

const PALETTE = ['#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47', '#264478', '#9e480e'];

/**
 * Parse DrawingML chart XML (`word/charts/chart*.xml`) referenced by `<c:chart>`
 * inside `<w:drawing>` into a renderable `WordChart` layout.
 */
export function parseWordChart(
  chartPath: string,
  entries: Map<string, Uint8Array>,
  width = 480,
  height = 280,
): WordChart | null {
  const entry = findZipEntry(entries, chartPath);
  if (!entry) return null;
  const parsed = parseXml(new TextDecoder('utf-8').decode(entry.data));
  const chartSpace = findChild(parsed, 'c:chartSpace') ?? parsed;
  const chartNode = findChild(chartSpace, 'c:chart');
  const plotArea = findChild(chartNode, 'c:plotArea');
  if (!chartNode || !plotArea) return null;

  const detected = detectChartElement(plotArea);
  if (!detected) return null;

  const titleNode = findChild(chartNode, 'c:title');
  const title = titleNode
    ? descendants(titleNode, 'a:t').map((node) => node.text).join('').trim() || undefined
    : undefined;
  const showLegend = Boolean(findChild(chartNode, 'c:legend'));

  let categories: string[] = [];
  const series: Array<{ label: string; values: number[]; color: string }> = [];
  const seriesNodes = findChildren(detected.node, 'c:ser');

  seriesNodes.forEach((serNode, index) => {
    const label = readSeriesLabel(serNode) || `Series ${index + 1}`;
    if (!categories.length) {
      categories = readPointStrings(findChild(serNode, 'c:cat') ?? findChild(serNode, 'c:xVal'));
    }
    const rawValues = readPointStrings(findChild(serNode, 'c:val') ?? findChild(serNode, 'c:yVal'));
    const values = rawValues.map((value) => {
      const numeric = Number(String(value).replace(/,/g, ''));
      return Number.isFinite(numeric) ? numeric : 0;
    });
    const fillHex = attr(descendants(findChild(serNode, 'c:spPr'), 'a:srgbClr')[0] ?? null, 'val');
    series.push({
      label,
      values,
      color: fillHex ? `#${fillHex}` : PALETTE[index % PALETTE.length],
    });
  });

  if (!series.length) return null;
  if (!categories.length) {
    const count = Math.max(...series.map((item) => item.values.length), 0);
    categories = Array.from({ length: count }, (_, idx) => String(idx + 1));
  }
  const allValues = series.flatMap((item) => item.values).filter((value) => Number.isFinite(value));
  const min = allValues.length ? Math.min(0, ...allValues) : 0;
  const max = allValues.length ? Math.max(0, ...allValues) : 1;

  const model: ChartModel = {
    type: detected.type,
    title: title ?? '',
    categories,
    series,
    min,
    max: max === min ? min + 1 : max,
    showLegend,
  };
  const safeW = Math.max(220, width || 480);
  const safeH = Math.max(140, height || 280);
  const layout = layoutChart(model, safeW, safeH);
  return {
    type: detected.type,
    title,
    categories,
    series,
    width: safeW,
    height: safeH,
    layout,
  };
}

function detectChartElement(plotArea: XmlNode): { type: ChartType; node: XmlNode } | null {
  for (const child of plotArea.children) {
    if (child.name === 'c:barChart' || child.name === 'c:bar3DChart') {
      const dir = attr(findChild(child, 'c:barDir'), 'val');
      return { type: dir === 'bar' ? 'bar' : 'column', node: child };
    }
    if (child.name === 'c:lineChart' || child.name === 'c:line3DChart') {
      return { type: 'line', node: child };
    }
    if (child.name === 'c:pieChart' || child.name === 'c:pie3DChart') {
      return { type: 'pie', node: child };
    }
    if (child.name === 'c:doughnutChart') {
      return { type: 'doughnut', node: child };
    }
    if (child.name === 'c:areaChart' || child.name === 'c:area3DChart') {
      return { type: 'area', node: child };
    }
    if (child.name === 'c:scatterChart') {
      return { type: 'scatter', node: child };
    }
  }
  return null;
}

function readSeriesLabel(serNode: XmlNode): string {
  const tx = findChild(serNode, 'c:tx');
  if (!tx) return '';
  const direct = findChild(tx, 'c:v');
  if (direct?.text) return direct.text.trim();
  const pt = descendants(tx, 'c:v')[0];
  return pt?.text?.trim() ?? '';
}

function readPointStrings(container: XmlNode | null): string[] {
  if (!container) return [];
  const cache = findChild(container, 'c:numCache')
    ?? findChild(container, 'c:strCache')
    ?? descendants(container, 'c:numCache')[0]
    ?? descendants(container, 'c:strCache')[0]
    ?? descendants(container, 'c:multiLvlStrCache')[0]
    ?? null;
  if (!cache) return [];
  const pts = findChildren(cache, 'c:pt')
    .map((pt) => ({
      idx: Number(attr(pt, 'idx') ?? 0),
      val: findChild(pt, 'c:v')?.text ?? '',
    }))
    .sort((left, right) => left.idx - right.idx);
  return pts.map((item) => item.val);
}
