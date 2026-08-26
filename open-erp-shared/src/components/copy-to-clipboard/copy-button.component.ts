import { Component, Directive, input, output, HostListener, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Directive({
  selector: '[erpCopyToClipboard]',
  standalone: true
})
export class CopyToClipboardDirective {
  readonly textToCopy = input<string>('', { alias: 'erpCopyToClipboard' });
  readonly copied = output<string>();

  @HostListener('click')
  onClick(): void {
    const text = this.textToCopy();
    if (text && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        this.copied.emit(text);
      });
    }
  }
}

@Component({
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
export class CopyButtonComponent {
  readonly value = input.required<string>();
  readonly text = input<string>('Sao chép');
  readonly copiedText = input<string>('Đã sao chép!');

  readonly copied = output<string>();

  isCopied = signal<boolean>(false);

  copy(): void {
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
}
