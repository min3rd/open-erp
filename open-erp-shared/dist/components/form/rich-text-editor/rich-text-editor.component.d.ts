import { ElementRef } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
export declare class RichTextEditorComponent implements ControlValueAccessor {
    readonly label: import("@angular/core").InputSignal<string | undefined>;
    readonly placeholder: import("@angular/core").InputSignal<string>;
    readonly minHeight: import("@angular/core").InputSignal<string>;
    readonly helperText: import("@angular/core").InputSignal<string | undefined>;
    readonly errorMessage: import("@angular/core").InputSignal<string | undefined>;
    readonly disabled: import("@angular/core").InputSignal<boolean>;
    readonly required: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly contentChange: import("@angular/core").OutputEmitterRef<string>;
    editorArea?: ElementRef<HTMLDivElement>;
    content: import("@angular/core").WritableSignal<string>;
    isDisabled: import("@angular/core").WritableSignal<boolean>;
    onChange: (val: string) => void;
    onTouched: () => void;
    readonly effectiveDisabled: import("@angular/core").Signal<boolean>;
    writeValue(val: any): void;
    registerOnChange(fn: any): void;
    registerOnTouched(fn: any): void;
    setDisabledState(isDisabled: boolean): void;
    executeCommand(command: string, value?: string): void;
    onEditorInput(): void;
}
