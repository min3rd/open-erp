var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { LabelComponent } from '../label/label.component';
import { HelperTextComponent } from '../helper-text/helper-text.component';
let FileUploadComponent = class FileUploadComponent {
    label = input(undefined);
    accept = input('*');
    multiple = input(false);
    maxFileSizeMb = input(10);
    hint = input('Kéo và thả tệp tin vào đây, hoặc duyệt tệp');
    disabled = input(false);
    required = input(false);
    loading = input(false);
    helperText = input(undefined);
    errorMessage = input(undefined);
    filesChange = output();
    files = signal([]);
    isDragging = signal(false);
    isDisabled = signal(false);
    onChange = () => { };
    onTouched = () => { };
    effectiveDisabled = computed(() => this.disabled() || this.isDisabled());
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
        this.isDisabled.set(isDisabled);
    }
    onDragOver(event) {
        event.preventDefault();
        if (!this.effectiveDisabled())
            this.isDragging.set(true);
    }
    onDragLeave() {
        this.isDragging.set(false);
    }
    onDrop(event) {
        event.preventDefault();
        this.isDragging.set(false);
        if (this.effectiveDisabled())
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
        const maxMb = this.maxFileSizeMb();
        const isMult = this.multiple();
        for (let i = 0; i < fileList.length; i++) {
            const f = fileList[i];
            if (f.size > maxMb * 1024 * 1024)
                continue;
            newFiles.push({
                name: f.name,
                size: f.size,
                type: f.type,
                url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
                file: f
            });
            if (!isMult)
                break;
        }
        const next = isMult ? [...this.files(), ...newFiles] : newFiles;
        this.files.set(next);
        this.onChange(next);
        this.filesChange.emit(next);
    }
    removeFile(index, event) {
        event.stopPropagation();
        if (this.effectiveDisabled())
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
        changeDetection: ChangeDetectionStrategy.OnPush,
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