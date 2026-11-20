/**
 * Text flow shared by pagination and table row splitting. Word breaks a line
 * greedily at word boundaries and after hyphens ("in-memory" becomes "in-" /
 * "memory"), so the same rule reproduced with the browser's own advance widths
 * gives the character offset of every line start — the offsets pagination needs
 * to cut a paragraph or a table cell exactly where the line ends instead of
 * guessing a proportional position.
 */

export interface WordTextLine {
  /** Inclusive character offset where the line starts. */
  start: number;
  /** Exclusive character offset where the line's content ends. */
  end: number;
}

/**
 * Break units of a text: a run of whitespace, or a word chunk that may end after
 * a hyphen. Word (and the browser) may start a new line after the hyphen, so a
 * hyphenated compound is not one unbreakable token.
 */
const WRAP_PATTERN = /\s+|[^\s-]*-(?=[^\s-])|[^\s-]+/g;

/**
 * Wraps one paragraph of text. A hard line break (Word's `w:br`, our "\n") ends
 * the line immediately: the caller splits the text on it, because Word never
 * re-flows those breaks as spaces.
 */
function wrapSegment(
  text: string,
  maxWidth: number,
  measure: (value: string) => number,
): WordTextLine[] {
  const limit = Math.max(1, maxWidth);
  const lines: WordTextLine[] = [];
  let lineStart = 0;
  let lineWidth = 0;
  let lineEnd = 0;
  let match = WRAP_PATTERN.exec(text);
  while (match) {
    const value = match[0];
    const start = match.index;
    const end = start + value.length;
    if (/^\s+$/.test(value)) {
      // A line never starts with the spaces that ended the previous one.
      if (lineWidth > 0) {
        lineWidth += measure(value);
        lineEnd = end;
      }
    } else {
      const wordWidth = measure(value);
      if (lineWidth + wordWidth > limit && lineEnd > lineStart) {
        lines.push({ start: lineStart, end: lineEnd });
        lineStart = start;
        lineWidth = wordWidth;
        lineEnd = end;
      } else {
        lineWidth += wordWidth;
        lineEnd = end;
      }
    }
    match = WRAP_PATTERN.exec(text);
  }
  lines.push({ start: lineStart, end: Math.max(lineEnd, text.length) });
  return lines;
}

export function wrapTextLines(
  text: string,
  maxWidth: number,
  measure: (value: string) => number,
): WordTextLine[] {
  if (!text.includes('\n')) return wrapSegment(text, maxWidth, measure);
  const lines: WordTextLine[] = [];
  let base = 0;
  for (const segment of text.split('\n')) {
    for (const line of wrapSegment(segment, maxWidth, measure)) {
      lines.push({ start: base + line.start, end: base + line.end });
    }
    base += segment.length + 1;
  }
  return lines;
}
