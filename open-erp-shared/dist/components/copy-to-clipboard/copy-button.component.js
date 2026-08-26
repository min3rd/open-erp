var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Directive, input, output, HostListener, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
let CopyToClipboardDirective = class CopyToClipboardDirective {
    textToCopy = input('', { alias: 'erpCopyToClipboard' });
    copied = output();
    onClick() {
        const text = this.textToCopy();
        if (text && typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.copied.emit(text);
            });
        }
    }
};
__decorate([
    HostListener('click'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CopyToClipboardDirective.prototype, "onClick", null);
CopyToClipboardDirective = __decorate([
    Directive({
        selector: '[erpCopyToClipboard]',
        standalone: true
    })
], CopyToClipboardDirective);
export { CopyToClipboardDirective };
let CopyButtonComponent = class CopyButtonComponent {
    value = input.required();
    text = input('Sao chép');
    copiedText = input('Đã sao chép!');
    copied = output();
    isCopied = signal(false);
    copy() {
        const val = this.value();
        if (val && typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(val).then(() => {
                this.isCopied.set(true);
                this.copied.emit(val);
                setTimeout(() => {
                    this.isCopied.set(false);
                }, 2000);
            });
        }
    }
};
CopyButtonComponent = __decorate([
    Component({
        selector: 'erp-copy-button',
        standalone: true,
        imports: [CommonModule, IconComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `
    <button (click)="copy()"
            type="button"
            [class.bg-emerald-50]="isCopied()"
            [class.dark:bg-emerald-950/60]="isCopied()"
            [class.text-emerald-600]="isCopied()"
            [class.dark:text-emerald-400]="isCopied()"
            [class.border-emerald-200]="isCopied()"
            [class.dark:border-emerald-800]="isCopied()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer select-none">
      <erp-icon [name]="isCopied() ? 'check' : 'plus'" [size]="14"></erp-icon>
      <span>{{ isCopied() ? copiedText() : text() }}</span>
    </button>
  `,
        styles: [`
    :host {
      display: inline-block;
    }
  `]
    })
], CopyButtonComponent);
export { CopyButtonComponent };
//# sourceMappingURL=copy-button.component.js.map