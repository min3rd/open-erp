import type { ExcelSheet } from './types';

export type ChartType = 'bar' | 'column' | 'line' | 'pie' | 'area' | 'scatter' | 'doughnut';

export interface ChartSeriesConfig {
  /** Range of values, e.g. B2:B10. */
  range: string;
  label?: string;
}

export interface ChartConfig {
  type: ChartType;
  /** Category labels, e.g. A2:A10. */
  categories: string;
  series: ChartSeriesConfig[];
  title?: string;
  showLegend?: boolean;
  axisTitle?: string;
}

export interface ChartSeries {
  label: string;
  values: number[];
  color: string;
}

export interface ChartModel {
  type: ChartType;
  title: string;
  categories: string[];
  series: ChartSeries[];
  min: number;
  max: number;
  showLegend: boolean;
  axisTitle?: string;
  error?: string;
}

export interface ChartBar { x: number; y: number; width: number; height: number; color: string; series: number; }
export interface ChartPoint { x: number; y: number; color: string; series: number; }
export interface ChartSlice { path: string; color: string; label: string; value: number; }
export interface ChartTick { x: number; y: number; label: string; }

export interface ChartLayout {
  width: number;
  height: number;
  plot: { x: number; y: number; width: number; height: number };
  bars: ChartBar[];
  lines: ChartPoint[][];
  slices: ChartSlice[];
  ticksY: ChartTick[];
  ticksX: ChartTick[];
  legend: Array<{ label: string; color: string; x: number; y: number }>;
  axisTitle?: { x: number; y: number; label: string };
}

const PALETTE = ['#4472c4', '#ed7d31', '#a5a5a5', '#ffc000', '#5b9bd5', '#70ad47', '#264478', '#9e480e'];

export function buildChartModel(sheet: ExcelSheet, config: ChartConfig): ChartModel {
  const categories = valuesOf(sheet, config.categories);
  const series: ChartSeries[] = [];
  for (const [index, item] of config.series.entries()) {
    const values = valuesOf(sheet, item.range);
    if (!values.length) {
      return { type: config.type, title: config.title ?? '', categories: [], series: [], min: 0, max: 0, showLegend: config.showLegend !== false, axisTitle: config.axisTitle, error: 'CHART_SERIES_EMPTY' };
    }
    series.push({
      label: item.label ?? `Series ${index + 1}`,
      values: values.map(toNumber),
      color: PALETTE[index % PALETTE.length],
    });
  }
  if (!series.length) {
    return { type: config.type, title: config.title ?? '', categories: [], series: [], min: 0, max: 0, showLegend: config.showLegend !== false, axisTitle: config.axisTitle, error: 'CHART_NO_SERIES' };
  }
  const all = series.flatMap((item) => item.values).filter((value) => Number.isFinite(value));
  const min = all.length ? Math.min(0, ...all) : 0;
  const max = all.length ? Math.max(0, ...all) : 1;
  return {
    type: config.type,
    title: config.title ?? '',
    categories: categories.length ? categories : series[0].values.map((_, index) => String(index + 1)),
    series,
    min,
    max: max === min ? min + 1 : max,
    showLegend: config.showLegend !== false,
    axisTitle: config.axisTitle,
  };
}

export function layoutChart(model: ChartModel, width = 480, height = 280): ChartLayout {
  const padding = { left: 44, right: 12, top: 24, bottom: 28 };
  const legendHeight = 18;
  const plot = {
    x: padding.left,
    y: padding.top,
    width: Math.max(40, width - padding.left - padding.right),
    height: Math.max(40, height - padding.top - padding.bottom - legendHeight),
  };
  const layout: ChartLayout = {
    width, height, plot, bars: [], lines: [], slices: [], ticksY: [], ticksX: [], legend: [],
  };
  if (model.axisTitle) {
    layout.axisTitle = { x: plot.x, y: plot.y - 8, label: model.axisTitle };
  }
  if (model.error || !model.series.length) return layout;

  if (model.type === 'pie' || model.type === 'doughnut') {
    const first = model.series[0];
    const total = first.values.reduce((sum, value) => sum + Math.max(0, value), 0);
    const cx = width / 2;
    const cy = plot.y + plot.height / 2;
    const radius = Math.max(20, Math.min(plot.width, plot.height) / 2 - 6);
    const inner = model.type === 'doughnut' ? radius * 0.55 : 0;
    let angle = -Math.PI / 2;
    first.values.forEach((value, index) => {
      const share = total > 0 ? Math.max(0, value) / total : 0;
      const next = angle + share * Math.PI * 2;
      const color = PALETTE[index % PALETTE.length];
      layout.slices.push({
        path: slicePath(cx, cy, radius, inner, angle, next),
        color,
        label: model.categories[index] ?? String(index + 1),
        value,
      });
      angle = next;
    });
    if (model.showLegend) {
      model.series.forEach((item, index) => {
        layout.legend.push({ label: item.label, color: item.color, x: plot.x + index * 90, y: height - 10 });
      });
    }
    return layout;
  }

  const count = Math.max(1, model.categories.length);
  const range = model.max - model.min || 1;
  const yFor = (value: number) => plot.y + plot.height - ((value - model.min) / range) * plot.height;
  for (let step = 0; step <= 4; step++) {
    const value = model.min + (range * step) / 4;
    layout.ticksY.push({
      x: plot.x - 6,
      y: yFor(value),
      label: formatTick(value),
    });
  }
  const slot = plot.width / count;
  model.categories.forEach((category, index) => {
    layout.ticksX.push({
      x: plot.x + slot * index + slot / 2,
      y: plot.y + plot.height + 14,
      label: category.length > 8 ? `${category.slice(0, 7)}…` : category,
    });
  });

  if (model.type === 'line' || model.type === 'area' || model.type === 'scatter') {
    model.series.forEach((item, seriesIndex) => {
      layout.lines.push(item.values.map((value, index) => ({
        x: plot.x + slot * index + slot / 2,
        y: yFor(value),
        color: item.color,
        series: seriesIndex,
      })));
    });
  } else {
    const groupWidth = slot * 0.72;
    const barWidth = Math.max(2, groupWidth / model.series.length);
    model.series.forEach((item, seriesIndex) => {
      item.values.forEach((value, index) => {
        const baseY = yFor(Math.max(model.min, 0));
        const valueY = yFor(value);
        layout.bars.push({
          x: plot.x + slot * index + (slot - groupWidth) / 2 + barWidth * seriesIndex,
          y: Math.min(baseY, valueY),
          width: barWidth - 1,
          height: Math.abs(baseY - valueY),
          color: item.color,
          series: seriesIndex,
        });
      });
    });
  }
  if (model.showLegend) {
    model.series.forEach((item, index) => {
      layout.legend.push({ label: item.label, color: item.color, x: plot.x + index * 90, y: height - 6 });
    });
  }
  return layout;
}

function valuesOf(sheet: ExcelSheet, range: string): string[] {
  const match = /^([A-Z]+)(\d+):?([A-Z]+)?(\d+)?$/i.exec(range.trim());
  if (!match) return [];
  const start = position(match[1], match[2]);
  if (!start) return [];
  const end = match[3] && match[4] ? position(match[3], match[4]) : start;
  if (!end) return [];
  const values: string[] = [];
  for (let row = Math.min(start.row, end.row); row <= Math.max(start.row, end.row); row++) {
    for (let col = Math.min(start.col, end.col); col <= Math.max(start.col, end.col); col++) {
      values.push(sheet.cells.get(`${columnName(col)}${row}`)?.value ?? '');
    }
  }
  return values;
}

function position(letters: string, digits: string): { row: number; col: number } | null {
  const row = Number(digits);
  if (!Number.isFinite(row) || row < 1) return null;
  let col = 0;
  for (const char of letters.toUpperCase()) col = col * 26 + (char.charCodeAt(0) - 64);
  return { row, col };
}

function toNumber(value: string): number {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatTick(value: number): string {
  if (Math.abs(value) >= 1000000) return `${Math.round(value / 100000) / 10}M`;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 100) / 10}k`;
  return String(Math.round(value * 100) / 100);
}

function slicePath(cx: number, cy: number, radius: number, inner: number, start: number, end: number): string {
  const large = end - start > Math.PI ? 1 : 0;
  const x1 = cx + radius * Math.cos(start);
  const y1 = cy + radius * Math.sin(start);
  const x2 = cx + radius * Math.cos(end);
  const y2 = cy + radius * Math.sin(end);
  if (inner <= 0) {
    return `M${round(cx)},${round(cy)} L${round(x1)},${round(y1)} A${radius},${radius} 0 ${large} 1 ${round(x2)},${round(y2)} Z`;
  }
  const ix2 = cx + inner * Math.cos(end);
  const iy2 = cy + inner * Math.sin(end);
  const ix1 = cx + inner * Math.cos(start);
  const iy1 = cy + inner * Math.sin(start);
  return `M${round(x1)},${round(y1)} A${radius},${radius} 0 ${large} 1 ${round(x2)},${round(y2)} `
    + `L${round(ix2)},${round(iy2)} A${inner},${inner} 0 ${large} 0 ${round(ix1)},${round(iy1)} Z`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function columnName(value: number): string {
  let column = '';
  let current = value;
  while (current > 0) {
    const remainder = (current - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    current = Math.floor((current - 1) / 26);
  }
  return column;
}
