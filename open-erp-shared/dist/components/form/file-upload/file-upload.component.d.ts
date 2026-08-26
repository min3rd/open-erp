import { ControlValueAccessor } from '@angular/forms';
export interface UploadedFile {
    name: string;
    size: number;
    type: string;
    url?: string;
    file?: File;
}
export declare class FileUploadComponent implements ControlValueAccessor {
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly accept: import("@angular/core").InputSignal<string>;
    readonly multiple: import("@angular/core").InputSignal<boolean>;
    readonly maxFileSizeMb: import("@angular/core").InputSignal<number>;
    readonly hint: import("@angular/core").InputSignal<string>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly required: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly helperText: import("@angular/core").InputSignal<string | undefined>;
    readonly errorMessage: import("@angular/core").InputSignal<string | undefined>;
    readonly filesChange: import("@angular/core").OutputEmitterRef<UploadedFile[]>;
    files: import("@angular/core").WritableSignal<UploadedFile[]>;
    isDragging: import("@angular/core").WritableSignal<boolean>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: UploadedFile[]) => void;
    onTouched: () => void;
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
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
