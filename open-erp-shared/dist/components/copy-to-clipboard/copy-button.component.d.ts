export declare class CopyToClipboardDirective {
    readonly textToCopy: import("@angular/core").InputSignal<string>;
    readonly copied: import("@angular/core").OutputEmitterRef<string>;
    onClick(): void;
}
export declare class CopyButtonComponent {
    readonly value: import("@angular/core").InputSignal<string>;
    readonly text: import("@angular/core").InputSignal<string>;
    readonly copiedText: import("@angular/core").InputSignal<string>;
    readonly copied: import("@angular/core").OutputEmitterRef<string>;
    isCopied: import("@angular/core").WritableSignal<boolean>;
    copy(): void;
}
