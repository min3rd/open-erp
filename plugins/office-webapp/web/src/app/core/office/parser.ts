import { assertExtensionMatches, detectFileKind, OfficeBinaryError } from '../binary/magic-bytes';
import { parseCsv } from './csv';
import { parseDoc } from './doc';
import { parseDocx } from './docx';
import { parseOdt } from './odt';
import { parsePdfInfo } from './pdf';
import { parsePptx } from './pptx';
import { parseRtf } from './rtf';
import type { OfficeApp, OfficeDocument } from './types';
import { parseWordXml } from './word-xml';
import { parseXlsx } from './xlsx';

export async function openOfficeFile(fileName: string, buffer: ArrayBuffer): Promise<OfficeDocument> {
  const extension = (fileName.split('.').pop() ?? '').toLowerCase();
  const kind = detectFileKind(new Uint8Array(buffer));
  assertExtensionMatches(extension, kind);

  if (extension === 'docx' || extension === 'dotx') {
    const word = await parseDocx(buffer);
    if (extension === 'dotx') {
      word.sourceFormat = 'dotx';
      const warnings = [...(word.warnings ?? [])];
      if (!warnings.includes('OFFICE_TEMPLATE_OPENED_AS_DOCX')) {
        warnings.unshift('OFFICE_TEMPLATE_OPENED_AS_DOCX');
      }
      word.warnings = warnings;
    }
    return { app: 'word', fileName, word, warnings: word.warnings };
  }
  if (extension === 'doc') {
    const word = await parseDoc(buffer);
    return { app: 'word', fileName, word, warnings: word.warnings };
  }
  if (extension === 'rtf') {
    const word = await parseRtf(buffer);
    return { app: 'word', fileName, word, warnings: word.warnings };
  }
  if (extension === 'odt') {
    const word = await parseOdt(buffer);
    return { app: 'word', fileName, word, warnings: word.warnings };
  }
  if (extension === 'xml') {
    const word = await parseWordXml(buffer);
    return { app: 'word', fileName, word, warnings: word.warnings };
  }
  if (extension === 'xlsx' || extension === 'csv') {
    const excel = extension === 'csv' ? parseCsv(buffer) : await parseXlsx(buffer);
    return { app: 'excel', fileName, excel, warnings: excel.warnings };
  }
  if (extension === 'pptx') {
    const ppt = await parsePptx(buffer);
    return { app: 'ppt', fileName, ppt, warnings: ppt.warnings };
  }
  if (extension === 'pdf') {
    const pdf = parsePdfInfo(buffer);
    return { app: 'pdf', fileName, pdf, warnings: [] };
  }
  throw new OfficeBinaryError('OFFICE_UNSUPPORTED_EXTENSION', { extension });
}

export function appFromExtension(fileName: string): OfficeApp | null {
  const extension = (fileName.split('.').pop() ?? '').toLowerCase();
  if (
    extension === 'docx'
    || extension === 'dotx'
    || extension === 'doc'
    || extension === 'rtf'
    || extension === 'odt'
    || extension === 'xml'
  ) {
    return 'word';
  }
  if (extension === 'xlsx' || extension === 'csv') return 'excel';
  if (extension === 'pptx') return 'ppt';
  if (extension === 'pdf') return 'pdf';
  return null;
}
