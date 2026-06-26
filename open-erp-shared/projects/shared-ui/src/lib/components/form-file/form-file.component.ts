import {
  Component,
  input,
  output,
  signal,
  inject,
} from '@angular/core';
import { NgClass, DecimalPipe } from '@angular/common';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { IconComponent } from '../icon/icon.component';

export interface UploadedFile {
  file: File;
  name: string;
  size: number;
  mimeType: string;
  /** Preview URL tạo từ URL.createObjectURL (chỉ cho ảnh) */
  previewUrl?: string;
}

/**
 * oerp-form-file
 * Vùng upload file với:
 *   - Drag-and-drop zone
 *   - Click để mở file dialog
 *   - Preview danh sách file đã chọn (tên, kích thước, nút xóa)
 *   - Giới hạn accept MIME types, maxSize, multiple
 *
 * Usage:
 *   <oerp-form-file label="Tài liệu đính kèm" [multiple]="true" accept=".pdf,.docx"
 *                   (filesSelected)="onFiles($event)" />
 */
@Component({
  selector: 'oerp-form-file',
  standalone: true,
  imports: [NgClass, DecimalPipe, IconComponent, TranslocoPipe],
  templateUrl: './form-file.component.html',
})
export class FormFileComponent {
  private readonly transloco = inject(TranslocoService);

  label = input<string>('');
  /** Ví dụ: ".pdf,.docx,image/*" */
  accept = input<string>('*');
  multiple = input<boolean>(false);
  /** Kích thước tối đa mỗi file (bytes). Mặc định 10MB */
  maxSizeBytes = input<number>(10 * 1024 * 1024);
  errorMessage = input<string>('');
  hasError = input<boolean>(false);

  /** Emit danh sách file đã chọn/drop */
  filesSelected = output<UploadedFile[]>();

  files = signal<UploadedFile[]>([]);
  isDragOver = signal(false);
  validationError = signal<string>('');

  get displayError(): string {
    return this.errorMessage() || this.validationError();
  }

  get showError(): boolean {
    return this.hasError() || !!this.validationError();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    const fileList = event.dataTransfer?.files;
    if (fileList) {
      this.processFiles(Array.from(fileList));
    }
  }

  onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
      // Reset input để cho phép chọn cùng file lần sau
      input.value = '';
    }
  }

  private processFiles(rawFiles: File[]): void {
    this.validationError.set('');
    const processed: UploadedFile[] = [];

    for (const file of rawFiles) {
      if (file.size > this.maxSizeBytes()) {
        const maxMb = (this.maxSizeBytes() / 1024 / 1024).toFixed(0);
        this.validationError.set(
          this.transloco.translate('form.error_file_too_large', { name: file.name, max: maxMb }),
        );
        continue;
      }

      const uploadedFile: UploadedFile = {
        file,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      };

      if (file.type.startsWith('image/')) {
        uploadedFile.previewUrl = URL.createObjectURL(file);
      }

      processed.push(uploadedFile);
    }

    if (this.multiple()) {
      this.files.update((prev) => [...prev, ...processed]);
    } else {
      // Revoke cũ trước khi thay thế
      this.files().forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
      this.files.set(processed.slice(0, 1));
    }

    this.filesSelected.emit(this.files());
  }

  removeFile(index: number): void {
    this.files.update((prev) => {
      const copy = [...prev];
      const removed = copy.splice(index, 1);
      removed.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
      return copy;
    });
    this.filesSelected.emit(this.files());
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
