import { Component, Directive, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Directive({
  selector: '[erpCopyToClipboard]',
  standalone: true
})
export class CopyToClipboardDirective {
  @Input('erpCopyToClipboard') textToCopy: string = '';
  @Output() copied = new EventEmitter<string>();

  @HostListener('click')
  onClick(): void {
    if (this.textToCopy && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(this.textToCopy).then(() => {
        this.copied.emit(this.textToCopy);
      });
    }
  }
}

@Component({
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
export class CopyButtonComponent {
  @Input({ required: true }) value: string = '';
  @Input() text: string = 'Sao chép';
  @Input() copiedText: string = 'Đã sao chép!';

  @Output() copied = new EventEmitter<string>();

  isCopied: boolean = false;

  copy(): void {
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
}
