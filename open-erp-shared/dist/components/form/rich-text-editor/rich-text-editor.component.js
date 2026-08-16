var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, forwardRef, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
let RichTextEditorComponent = class RichTextEditorComponent {
    label;
    placeholder = 'Nhập nội dung định dạng...';
    minHeight = '140px';
    helperText;
    errorMessage;
    disabled = false;
    required = false;
    loading = false;
    contentChange = new EventEmitter();
    editorArea;
    content = signal('');
    onChange = () => { };
    onTouched = () => { };
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
        this.disabled = isDisabled;
    }
    executeCommand(command, value = '') {
        if (this.disabled || typeof document === 'undefined')
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
    Input(),
    __metadata("design:type", String)
], RichTextEditorComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], RichTextEditorComponent.prototype, "placeholder", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], RichTextEditorComponent.prototype, "minHeight", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], RichTextEditorComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], RichTextEditorComponent.prototype, "errorMessage", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RichTextEditorComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RichTextEditorComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], RichTextEditorComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], RichTextEditorComponent.prototype, "contentChange", void 0);
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