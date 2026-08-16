import { EventEmitter } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
export interface UploadedFile {
    name: string;
    size: number;
    type: string;
    url?: string;
    file?: File;
}
export declare class FileUploadComponent implements ControlValueAccessor {
    label?: string;
    accept: string;
    multiple: boolean;
    maxFileSizeMb: number;
    hint: string;
    disabled: boolean;
    required: boolean;
    loading: boolean;
    helperText?: string;
    errorMessage?: string;
    filesChange: EventEmitter<UploadedFile[]>;
    files: import("@angular/core").WritableSignal<UploadedFile[]>;
    isDragging: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: UploadedFile[]) => void;
    onTouched: () => void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    onDragOver(event: DragEvent): void;
    onDragLeave(): void;
    onDrop(event: DragEvent): void;
    onFileInput(event: Event): void;
    private handleFiles;
    removeFile(index: number, event: MouseEvent): void;
    formatFileSize(bytes: number): string;
}
