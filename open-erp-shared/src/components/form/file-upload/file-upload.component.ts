import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
}

@Component({
  selector: 'erp-file-upload',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileUploadComponent),
      multi: true
    }
  ],
  templateUrl: './file-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class FileUploadComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly accept = input<string>('*');
  readonly multiple = input<boolean>(false);
  readonly maxFileSizeMb = input<number>(10);
  readonly hint = input<string>('Kéo và thả tệp tin vào đây, hoặc duyệt tệp');
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly helperText = input<string | undefined>(undefined);
  readonly errorMessage = input<string | undefined>(undefined);

  readonly filesChange = output<UploadedFile[]>();

  files = signal<UploadedFile[]>([]);
  isDragging = signal<boolean>(false);
  isDisabled = signal<boolean>(false);

  onChange: (val: UploadedFile[]) => void = () => {};
  onTouched: () => void = () => {};

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  writeValue(val: any): void {
    this.files.set(Array.isArray(val) ? val : []);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.effectiveDisabled()) this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (this.effectiveDisabled()) return;
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(input.files);
    }
  }

  private handleFiles(fileList: FileList): void {
    const newFiles: UploadedFile[] = [];
    const maxMb = this.maxFileSizeMb();
    const isMult = this.multiple();

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (f.size > maxMb * 1024 * 1024) continue;
      newFiles.push({
        name: f.name,
        size: f.size,
        type: f.type,
        url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
        file: f
      });
      if (!isMult) break;
    }

    const next = isMult ? [...this.files(), ...newFiles] : newFiles;
    this.files.set(next);
    this.onChange(next);
    this.filesChange.emit(next);
  }

  removeFile(index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (this.effectiveDisabled()) return;
    const next = this.files().filter((_, i) => i !== index);
    this.files.set(next);
    this.onChange(next);
    this.filesChange.emit(next);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
