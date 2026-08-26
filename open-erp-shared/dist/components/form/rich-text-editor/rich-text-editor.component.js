var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
let RichTextEditorComponent = class RichTextEditorComponent {
    label = input(undefined);
    placeholder = input('Nhập nội dung định dạng...');
    minHeight = input('140px');
    helperText = input(undefined);
    errorMessage = input(undefined);
    disabled = input(false);
    required = input(false);
    loading = input(false);
    contentChange = output();
    editorArea;
    content = signal('');
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
    writeValue(val) {
        const html = val || '';
        this.content.set(html);
        if (this.editorArea) {
            this.editorArea.nativeElement.innerHTML = html;
        }
    }
    registerOnChange(fn) {
        this.onChange = fn;
    }
    registerOnTouched(fn) {
        this.onTouched = fn;
    }
    setDisabledState(isDisabled) {
        this.isDisabled.set(isDisabled);
    }
    executeCommand(command, value = '') {
        if (this.effectiveDisabled() || typeof document === 'undefined')
            return;
        document.execCommand(command, false, value);
        this.onEditorInput();
    }
    onEditorInput() {
        if (!this.editorArea)
            return;
        const html = this.editorArea.nativeElement.innerHTML;
        this.content.set(html);
        this.onChange(html);
        this.contentChange.emit(html);
    }
};
__decorate([
    ViewChild('editorArea'),
    __metadata("design:type", ElementRef)
], RichTextEditorComponent.prototype, "editorArea", void 0);
RichTextEditorComponent = __decorate([
    Component({
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
], RichTextEditorComponent);
export { RichTextEditorComponent };
//# sourceMappingURL=rich-text-editor.component.js.map