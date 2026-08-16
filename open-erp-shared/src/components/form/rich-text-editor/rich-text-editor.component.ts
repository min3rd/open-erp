import { Component, Input, Output, EventEmitter, forwardRef, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent, IconName } from '../../icon/icon.component';
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
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class RichTextEditorComponent implements ControlValueAccessor {
  @Input() label?: string;
  @Input() placeholder: string = 'Nhập nội dung định dạng...';
  @Input() minHeight: string = '140px';
  @Input() helperText?: string;
  @Input() errorMessage?: string;
  @Input() disabled: boolean = false;
  @Input() required: boolean = false;
  @Input() loading: boolean = false;

  @Output() contentChange = new EventEmitter<string>();

  @ViewChild('editorArea') editorArea?: ElementRef<HTMLDivElement>;

  content = signal<string>('');

  onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

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
    this.disabled = isDisabled;
  }

  executeCommand(command: string, value: string = ''): void {
    if (this.disabled || typeof document === 'undefined') return;
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
