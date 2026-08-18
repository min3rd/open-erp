import { EventEmitter } from '@angular/core';
export declare class CopyToClipboardDirective {
    textToCopy: string;
    copied: EventEmitter<string>;
    onClick(): void;
}
export declare class CopyButtonComponent {
    value: string;
    text: string;
    copiedText: string;
    copied: EventEmitter<string>;
    isCopied: boolean;
    copy(): void;
}
