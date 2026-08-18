var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Directive, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
let CopyToClipboardDirective = class CopyToClipboardDirective {
    textToCopy = '';
    copied = new EventEmitter();
    onClick() {
        if (this.textToCopy && typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(this.textToCopy).then(() => {
                this.copied.emit(this.textToCopy);
            });
        }
    }
};
__decorate([
    Input('erpCopyToClipboard'),
    __metadata("design:type", String)
], CopyToClipboardDirective.prototype, "textToCopy", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], CopyToClipboardDirective.prototype, "copied", void 0);
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
    value = '';
    text = 'Sao chép';
    copiedText = 'Đã sao chép!';
    copied = new EventEmitter();
    isCopied = false;
    copy() {
        if (this.value && typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(this.value).then(() => {
                this.isCopied = true;
                this.copied.emit(this.value);
                setTimeout(() => {
                    this.isCopied = false;
                }, 2000);
            });
        }
    }
};
__decorate([
    Input({ required: true }),
    __metadata("design:type", String)
], CopyButtonComponent.prototype, "value", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], CopyButtonComponent.prototype, "text", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], CopyButtonComponent.prototype, "copiedText", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], CopyButtonComponent.prototype, "copied", void 0);
CopyButtonComponent = __decorate([
    Component({
        selector: 'erp-copy-button',
        standalone: true,
        imports: [CommonModule, IconComponent],
        template: `
    <button (click)="copy()"
            type="button"
            [class.bg-emerald-50]="isCopied"
            [class.dark:bg-emerald-950/60]="isCopied"
            [class.text-emerald-600]="isCopied"
            [class.dark:text-emerald-400]="isCopied"
            [class.border-emerald-200]="isCopied"
            [class.dark:border-emerald-800]="isCopied"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer select-none">
      <erp-icon [name]="isCopied ? 'check' : 'plus'" [size]="14"></erp-icon>
      <span>{{ isCopied ? copiedText : text }}</span>
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