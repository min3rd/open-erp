import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';

@Component({
  selector: 'erp-rich-text-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditorComponent),
      multi: true
    }
  ],
  templateUrl: './rich-text-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class RichTextEditorComponent implements ControlValueAccessor {
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input<string>('Nhập nội dung định dạng...');
  readonly minHeight = input<string>('140px');
  readonly helperText = input<string | undefined>(undefined);
  readonly errorMessage = input<string | undefined>(undefined);
  readonly disabled = input<boolean>(false);
  readonly required = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly contentChange = output<string>();

  @ViewChild('editorArea') editorArea?: ElementRef<HTMLDivElement>;

  content = signal<string>('');
  isDisabled = signal<boolean>(false);

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  readonly effectiveDisabled = computed(() => this.disabled() || this.isDisabled());

  writeValue(val: any): void {
    const html = val || '';
    this.content.set(html);
    if (this.editorArea) {
      this.editorArea.nativeElement.innerHTML = html;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  executeCommand(command: string, value: string = ''): void {
    if (this.effectiveDisabled() || typeof document === 'undefined') return;
    document.execCommand(command, false, value);
    this.onEditorInput();
  }

  onEditorInput(): void {
    if (!this.editorArea) return;
    const html = this.editorArea.nativeElement.innerHTML;
    this.content.set(html);
    this.onChange(html);
    this.contentChange.emit(html);
  }
}
