import { acceptedText } from './word-markup';
import type { WordBlock } from './types';

export interface WordFindMatch {
  blockIndex: number;
  start: number;
  end: number;
  before: string;
  match: string;
  after: string;
}

export interface WordFindOptions {
  matchCase?: boolean;
  wholeWord?: boolean;
}

export function paragraphVisibleText(block: WordBlock): string {
  return block.kind === 'paragraph' ? acceptedText(block.paragraph) : '';
}

export function findWordMatches(blocks: WordBlock[], query: string, options: WordFindOptions = {}): WordFindMatch[] {
  const needle = query.trim();
  if (!needle) return [];
  const matches: WordFindMatch[] = [];
  blocks.forEach((block, blockIndex) => {
    if (block.kind !== 'paragraph') return;
    const text = acceptedText(block.paragraph);
    if (!text) return;
    const haystack = options.matchCase ? text : text.toLowerCase();
    const target = options.matchCase ? needle : needle.toLowerCase();
    let from = 0;
    while (from <= haystack.length) {
      const at = haystack.indexOf(target, from);
      if (at < 0) break;
      const end = at + target.length;
      if (!options.wholeWord || (isBoundary(text[at - 1]) && isBoundary(text[end]))) {
        matches.push({
          blockIndex,
          start: at,
          end,
          before: text.slice(Math.max(0, at - 28), at),
          match: text.slice(at, end),
          after: text.slice(end, Math.min(text.length, end + 28)),
        });
      }
      from = at + Math.max(1, target.length);
    }
  });
  return matches;
}

export function replaceWordText(text: string, query: string, replacement: string, options: WordFindOptions = {}): string {
  const needle = query.trim();
  if (!needle) return text;
  const haystack = options.matchCase ? text : text.toLowerCase();
  const target = options.matchCase ? needle : needle.toLowerCase();
  let result = '';
  let from = 0;
  while (from <= haystack.length) {
    const at = haystack.indexOf(target, from);
    if (at < 0) break;
    const end = at + target.length;
    if (!options.wholeWord || (isBoundary(text[at - 1]) && isBoundary(text[end]))) {
      result += text.slice(from, at) + replacement;
      from = end;
    } else {
      result += text.slice(from, end);
      from = end;
    }
  }
  return result + text.slice(from);
}

function isBoundary(value: string | undefined): boolean {
  return value === undefined || !/[\p{L}\p{N}_]/u.test(value);
}
