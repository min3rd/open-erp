import { findChild, parseXml, serializeXml } from '../binary/xml';
import { parseWordBlocks } from './docx';
import { parseSections } from './word-section';
import { parseEquations } from './word-equation';
import type { WordDocument } from './types';

export interface WordSnapshot {
  xml: string;
  entries: Map<string, Uint8Array>;
  wordCount: number;
}

export function snapshotWord(document: WordDocument): WordSnapshot | null {
  if (!document.xmlRoot) return null;
  return {
    xml: serializeXml(document.xmlRoot),
    entries: new Map(document.packageEntries ?? []),
    wordCount: document.wordCount,
  };
}

export function restoreWord(document: WordDocument, snapshot: WordSnapshot): void {
  const parsed = parseXml(snapshot.xml);
  document.xmlRoot = findChild(parsed, 'w:document') ?? parsed;
  document.packageEntries = new Map(snapshot.entries);
  document.blocks = parseWordBlocks(document.xmlRoot, document.packageEntries);
  document.wordCount = snapshot.wordCount;
  document.sections = parseSections(document, document.packageEntries);
  document.equations = parseEquations(document);
}
