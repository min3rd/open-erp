import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import {
  IonBackButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
} from '@ionic/angular/standalone';
import { API_BASE_URL, TranslatePipe } from '@shared';
import { openOfficeFile } from '@plugins/office-webapp/office/parser';
import { numberToColumn } from '@plugins/office-webapp/office/xlsx';
import type { ExcelSheet, OfficeApp, OfficeDocument, PptShape, WordBlock } from '@plugins/office-webapp/office/types';

interface Envelope<T> {
  success: boolean;
  code: string;
  data: T;
}

interface OfficeDocumentMeta {
  id: string;
  original_filename: string;
  mime_type: string;
  current_version: number;
}

@Component({
  selector: 'app-office-viewer',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, TranslatePipe],
  templateUrl: './office-viewer.page.html',
  styleUrl: './office-viewer.page.css',
})
export class OfficeViewerPage implements OnInit {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly apiBase = (inject(API_BASE_URL) ?? '').replace(/\/$/, '');

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;

  readonly doc = signal<OfficeDocument | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);
  readonly erpDocId = signal<string | null>(null);
  readonly erpVersion = signal<number | null>(null);
  readonly zoom = signal(100);
  readonly sheetIndex = signal(0);
  readonly slideIndex = signal(0);
  readonly pdfPage = signal(1);
  readonly pdfUrl = signal<SafeResourceUrl | null>(null);
  readonly sourceBytes = signal<ArrayBuffer | null>(null);
  private pdfObjectUrl: string | null = null;

  readonly app = computed<OfficeApp | null>(() => this.doc()?.app ?? null);
  readonly sheet = computed<ExcelSheet | null>(() => {
    const sheets = this.doc()?.excel?.sheets ?? [];
    return sheets[Math.min(this.sheetIndex(), Math.max(sheets.length - 1, 0))] ?? null;
  });
  readonly slide = computed(() => {
    const slides = this.doc()?.ppt?.slides ?? [];
    return slides[Math.min(this.slideIndex(), Math.max(slides.length - 1, 0))] ?? null;
  });
  readonly pdfPageUrl = computed(() => {
    const base = this.pdfBase;
    if (!base) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`${base}#page=${this.pdfPage()}&toolbar=0&navpanes=0`);
  });
  private pdfBase: string | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const docId = params.get('docId');
      if (!docId) return;
      const version = Number(params.get('version'));
      void this.openFromErp(docId, Number.isFinite(version) && version > 0 ? version : undefined);
    });
  }

  async openFromErp(docId: string, version?: number): Promise<void> {
    this.error.set(null);
    this.loading.set(true);
    try {
      const meta = await firstValueFrom(
        this.http.get<Envelope<OfficeDocumentMeta>>(`${this.apiBase}/api/v1/office/documents/${docId}`),
      );
      const url = `${this.apiBase}/api/v1/office/documents/${docId}/content${version ? `?version=${version}` : ''}`;
      const response = await firstValueFrom(this.http.get(url, {
        observe: 'response',
        responseType: 'arraybuffer',
      }));
      const buffer = response.body ?? new ArrayBuffer(0);
      const parsed = await openOfficeFile(meta.data.original_filename, buffer);
      this.applyBuffer(parsed, buffer, meta.data.original_filename);
      this.erpDocId.set(docId);
      this.erpVersion.set(Number(response.headers.get('x-document-version')) || meta.data.current_version);
    } catch (failure) {
      this.error.set(this.describeErpError(failure));
    } finally {
      this.loading.set(false);
    }
  }

  pickFile(): void {
    this.fileInput?.nativeElement.click();
  }

  async onFileInput(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) await this.open(file);
  }

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) await this.open(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  async open(file: File): Promise<void> {
    this.error.set(null);
    try {
      const buffer = await file.arrayBuffer();
      const parsed = await openOfficeFile(file.name, buffer);
      this.applyBuffer(parsed, buffer, file.name);
      this.erpDocId.set(null);
      this.erpVersion.set(null);
    } catch (failure) {
      this.error.set(this.describeError(failure));
    }
  }

  close(): void {
    this.revokePdf();
    this.doc.set(null);
    this.sourceBytes.set(null);
    this.error.set(null);
    this.erpDocId.set(null);
  }

  zoomBy(delta: number): void {
    this.zoom.update((value) => Math.min(200, Math.max(50, value + delta)));
  }

  nextSheet(): void {
    const count = this.doc()?.excel?.sheets.length ?? 0;
    this.sheetIndex.update((value) => Math.min(count - 1, value + 1));
  }

  prevSheet(): void {
    this.sheetIndex.update((value) => Math.max(0, value - 1));
  }

  nextSlide(): void {
    const count = this.doc()?.ppt?.slides.length ?? 0;
    this.slideIndex.update((value) => Math.min(count - 1, value + 1));
  }

  prevSlide(): void {
    this.slideIndex.update((value) => Math.max(0, value - 1));
  }

  nextPdfPage(): void {
    const count = this.doc()?.pdf?.pageCount ?? 1;
    this.pdfPage.update((value) => Math.min(count, value + 1));
  }

  prevPdfPage(): void {
    this.pdfPage.update((value) => Math.max(1, value - 1));
  }

  download(): void {
    const doc = this.doc();
    const buffer = this.sourceBytes();
    if (!doc || !buffer) return;
    const url = URL.createObjectURL(new Blob([buffer], { type: 'application/octet-stream' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = doc.fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  cellValue(ref: string): string {
    return this.sheet()?.cells.get(ref)?.value ?? '';
  }

  cellRef(row: number, col: number): string {
    return `${numberToColumn(col)}${row}`;
  }

  rowCount(): number[] {
    return Array.from({ length: 20 }, (_, index) => index + 1);
  }

  columnCount(): number[] {
    return Array.from({ length: 8 }, (_, index) => index + 1);
  }

  shapeStyle(shape: PptShape): Record<string, string> {
    const ppt = this.doc()?.ppt;
    if (!ppt || !ppt.width || !ppt.height) return {};
    return {
      left: `${(shape.x / ppt.width) * 100}%`,
      top: `${(shape.y / ppt.height) * 100}%`,
      width: `${Math.max(2, (shape.width / ppt.width) * 100)}%`,
      height: `${Math.max(2, (shape.height / ppt.height) * 100)}%`,
      'font-size': `${Math.max(9, (shape.fontSizePt ?? 18) * 0.75)}px`,
      color: shape.color ?? '#111827',
      'font-weight': shape.bold ? '700' : '400',
    };
  }

  blockClass(block: WordBlock): string {
    if (block.kind !== 'paragraph') return '';
    return block.paragraph.headingLevel ? `op-mv-h${block.paragraph.headingLevel}` : '';
  }

  private applyBuffer(parsed: OfficeDocument, buffer: ArrayBuffer, fileName: string): void {
    this.revokePdf();
    parsed.fileName = fileName;
    this.doc.set(parsed);
    this.sourceBytes.set(buffer);
    this.sheetIndex.set(0);
    this.slideIndex.set(0);
    this.zoom.set(100);
    if (parsed.app === 'pdf') {
      const url = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      this.pdfObjectUrl = url;
      this.pdfBase = url;
      this.pdfPage.set(1);
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
    }
  }

  private describeError(failure: unknown): string {
    if (failure && typeof failure === 'object' && 'code' in failure) return String((failure as { code: unknown }).code);
    return failure instanceof Error ? failure.message : 'OFFICE_OPEN_FAILED';
  }

  private describeErpError(failure: unknown): string {
    if (failure && typeof failure === 'object' && 'status' in failure) {
      const status = Number((failure as { status: unknown }).status);
      if (status === 401 || status === 403) return 'OFFICE_ERP_UNAUTHORIZED';
      if (status === 404) return 'OFFICE_ERP_NOT_FOUND';
    }
    return 'OFFICE_ERP_LOAD_FAILED';
  }

  private revokePdf(): void {
    if (this.pdfObjectUrl) {
      URL.revokeObjectURL(this.pdfObjectUrl);
      this.pdfObjectUrl = null;
      this.pdfBase = null;
      this.pdfUrl.set(null);
    }
  }
}

