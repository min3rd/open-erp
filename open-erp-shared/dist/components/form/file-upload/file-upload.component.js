var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
let FileUploadComponent = class FileUploadComponent {
    label;
    accept = '*';
    multiple = false;
    maxFileSizeMb = 10;
    hint = 'Kéo và thả tệp tin vào đây, hoặc duyệt tệp';
    disabled = false;
    required = false;
    loading = false;
    helperText;
    errorMessage;
    filesChange = new EventEmitter();
    files = signal([]);
    isDragging = signal(false);
    onChange = () => { };
    onTouched = () => { };
    writeValue(val) {
        this.files.set(Array.isArray(val) ? val : []);
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
    onDragOver(event) {
        event.preventDefault();
        if (!this.disabled)
            this.isDragging.set(true);
    }
    onDragLeave() {
        this.isDragging.set(false);
    }
    onDrop(event) {
        event.preventDefault();
        this.isDragging.set(false);
        if (this.disabled)
            return;
        if (event.dataTransfer?.files) {
            this.handleFiles(event.dataTransfer.files);
        }
    }
    onFileInput(event) {
        const input = event.target;
        if (input.files) {
            this.handleFiles(input.files);
        }
    }
    handleFiles(fileList) {
        const newFiles = [];
        for (let i = 0; i < fileList.length; i++) {
            const f = fileList[i];
            if (f.size > this.maxFileSizeMb * 1024 * 1024)
                continue;
            newFiles.push({
                name: f.name,
                size: f.size,
                type: f.type,
                url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
                file: f
            });
            if (!this.multiple)
                break;
        }
        const next = this.multiple ? [...this.files(), ...newFiles] : newFiles;
        this.files.set(next);
        this.onChange(next);
        this.filesChange.emit(next);
    }
    removeFile(index, event) {
        event.stopPropagation();
        if (this.disabled)
            return;
        const next = this.files().filter((_, i) => i !== index);
        this.files.set(next);
        this.onChange(next);
        this.filesChange.emit(next);
    }
    formatFileSize(bytes) {
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
};
__decorate([
    Input(),
    __metadata("design:type", String)
], FileUploadComponent.prototype, "label", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], FileUploadComponent.prototype, "accept", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], FileUploadComponent.prototype, "multiple", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], FileUploadComponent.prototype, "maxFileSizeMb", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], FileUploadComponent.prototype, "hint", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], FileUploadComponent.prototype, "disabled", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], FileUploadComponent.prototype, "required", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], FileUploadComponent.prototype, "loading", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], FileUploadComponent.prototype, "helperText", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], FileUploadComponent.prototype, "errorMessage", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], FileUploadComponent.prototype, "filesChange", void 0);
FileUploadComponent = __decorate([
    Component({
        selector: 'erp-file-upload',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent, LabelComponent, HelperTextComponent],
        providers: [
            {
                provide: NG_VALUE_ACCESSOR,
                useExisting: forwardRef(() => FileUploadComponent),
                multi: true
            }
        ],
        templateUrl: './file-upload.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], FileUploadComponent);
export { FileUploadComponent };
//# sourceMappingURL=file-upload.component.js.map