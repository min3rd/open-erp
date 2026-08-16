import { EventEmitter, ElementRef } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
export declare class RichTextEditorComponent implements ControlValueAccessor {
    label?: string;
    placeholder: string;
    minHeight: string;
    helperText?: string;
    errorMessage?: string;
    disabled: boolean;
    required: boolean;
    loading: boolean;
    contentChange: EventEmitter<string>;
    editorArea?: ElementRef<HTMLDivElement>;
    content: import("@angular/core").WritableSignal<string>;
    onChange: (val: string) => void;
    onTouched: () => void;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    executeCommand(command: string, value?: string): void;
    onEditorInput(): void;
}
