import type { WordBlock, WordDocument, WordParagraph, WordRun } from './types';

type WordTableBlock = Extract<WordBlock, { kind: 'table' }>;

/** Inline Markdown for one run, mirroring Word's formatting (474-F25). */
function runMarkdown(run: WordRun): string {
  if (run.pageBreak) return '\n\n---\n\n';
  if (run.imagePath) return `![${run.alt ?? ''}](${run.imagePath})`;
  if (run.videoUrl) return `[${run.text || run.videoUrl}](${run.videoUrl})`;
  let text = run.text ?? '';
  if (!text) return '';
  if (run.link) text = `[${text}](${run.link})`;
  if (run.bold) text = `**${text}**`;
  if (run.italic) text = `*${text}*`;
  if (run.strike) text = `~~${text}~~`;
  return text;
}

export function paragraphMarkdown(paragraph: WordParagraph): string {
  const text = paragraph.runs.map(runMarkdown).join('').trim();
  if (!text) return '';
  if (paragraph.listType === 'bullet') return `- ${text}`;
  if (paragraph.listType === 'number') return `1. ${text}`;
  if (paragraph.headingLevel) return `${'#'.repeat(Math.min(paragraph.headingLevel, 6))} ${text}`;
  if (paragraph.style === 'Title') return `# ${text}`;
  if (paragraph.style === 'Subtitle') return `## ${text}`;
  if (paragraph.style === 'Quote') return `> ${text}`;
  return text;
}

const cellText = (paragraphs: WordParagraph[]): string =>
  paragraphs.map((paragraph) => paragraph.runs.map(runMarkdown).join('')).join(' ').replace(/\|/g, '\\|').trim();

function tableMarkdown(table: WordTableBlock): string {
  const rows = table.rows.map((row) => row.map(cellText));
  const columns = Math.max(1, ...rows.map((row) => row.length));
  const line = (cells: string[]): string =>
    `| ${Array.from({ length: columns }, (_, index) => cells[index] ?? '').join(' | ')} |`;
  if (!rows.length) return '';
  // GFM needs a header row; a docx table without one keeps its first row as header.
  const [header, ...body] = rows;
  return [line(header), `| ${Array.from({ length: columns }, () => '---').join(' | ')} |`, ...body.map(line)].join('\n');
}

function blockMarkdown(block: WordBlock): string {
  if (block.kind === 'paragraph') return paragraphMarkdown(block.paragraph);
  return tableMarkdown(block);
}

export function wordToMarkdown(document: WordDocument): string {
  const blocks = document.blocks.map(blockMarkdown).filter(Boolean);
  return `${blocks.join('\n\n')}\n`;
}
