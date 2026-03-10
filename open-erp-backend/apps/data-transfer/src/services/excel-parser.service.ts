import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ParsedRow {
  rowIndex: number;
  data: Record<string, any>;
}

export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: ParsedRow[];
}

export interface ParseResult {
  sheets: ParsedSheet[];
  format: 'xlsx' | 'csv';
}

export interface ExportData {
  entity: string;
  headers: string[];
  rows: Record<string, any>[];
}

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  async parseBuffer(buffer: Buffer, fileName: string): Promise<ParseResult> {
    const isCSV = fileName.toLowerCase().endsWith('.csv');

    if (isCSV) {
      return this.parseCSV(buffer);
    }
    return this.parseXLSX(buffer);
  }

  private async parseXLSX(buffer: Buffer): Promise<ParseResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);

    const sheets: ParsedSheet[] = [];

    workbook.eachSheet((worksheet) => {
      const headers: string[] = [];
      const rows: ParsedRow[] = [];

      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) {
          // Headers
          row.eachCell((cell) => {
            headers.push(String(cell.value || '').trim());
          });
        } else {
          const data: Record<string, any> = {};
          row.eachCell({ includeEmpty: true }, (cell, colIndex) => {
            const header = headers[colIndex - 1];
            if (header) {
              data[header] = cell.value;
            }
          });
          if (Object.keys(data).length > 0) {
            rows.push({ rowIndex, data });
          }
        }
      });

      if (headers.length > 0) {
        sheets.push({ name: worksheet.name, headers, rows });
      }
    });

    return { sheets, format: 'xlsx' };
  }

  private parseCSV(buffer: Buffer): ParseResult {
    const content = buffer.toString('utf-8');
    // Normalize line endings
    const lines = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .split('\n')
      .filter((line) => line.trim());

    if (lines.length === 0) {
      return {
        sheets: [{ name: 'Sheet1', headers: [], rows: [] }],
        format: 'csv',
      };
    }

    // RFC 4180 compliant CSV parser
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      let i = 0;

      while (i < line.length) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Escaped double quote inside quoted field
            current += '"';
            i += 2;
            continue;
          }
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
        i++;
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseCSVLine(lines[0]);
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const data: Record<string, any> = {};
      headers.forEach((header, idx) => {
        data[header] = values[idx] || '';
      });
      rows.push({ rowIndex: i + 1, data });
    }

    return { sheets: [{ name: 'Sheet1', headers, rows }], format: 'csv' };
  }

  async generateXLSX(data: ExportData[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Open ERP';
    workbook.created = new Date();

    for (const sheet of data) {
      const worksheet = workbook.addWorksheet(sheet.entity);

      // Add headers with styling
      const headerRow = worksheet.addRow(sheet.headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0E0E0' },
        };
      });

      // Add data rows
      for (const row of sheet.rows) {
        worksheet.addRow(sheet.headers.map((h) => row[h] ?? ''));
      }

      // Auto-fit columns
      worksheet.columns.forEach((column) => {
        if (column && column.values && column.values.length > 0) {
          const maxLength = Math.max(
            ...column.values
              .filter((v) => v != null)
              .map((v) => String(v).length),
            10,
          );
          column.width = Math.min(maxLength + 2, 50);
        }
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  generateCSV(data: ExportData): string {
    const lines: string[] = [];
    lines.push(data.headers.map((h) => `"${h}"`).join(','));

    for (const row of data.rows) {
      lines.push(
        data.headers
          .map((h) => {
            const val = row[h] ?? '';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(','),
      );
    }

    return lines.join('\n');
  }
}
