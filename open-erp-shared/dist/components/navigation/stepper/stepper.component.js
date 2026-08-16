var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { StepperOrientation, StepperStepStatus } from '../../../enums/component.enum';
let StepperComponent = class StepperComponent {
    steps = [];
    currentStep = 0;
    orientation = StepperOrientation.HORIZONTAL;
    clickable = true;
    loading = false;
    stepChange = new EventEmitter();
    get normalizedSteps() {
        return this.steps.map(s => typeof s === 'string' ? { title: s } : s);
    }
    getStepStatus(index) {
        if (index < this.currentStep)
            return StepperStepStatus.COMPLETED;
        if (index === this.currentStep)
            return StepperStepStatus.CURRENT;
        return StepperStepStatus.PENDING;
    }
    onStepClick(index, step) {
        if (this.clickable && !step.disabled) {
            this.currentStep = index;
            this.stepChange.emit(index);
        }
    }
};
__decorate([
    Input(),
    __metadata("design:type", Array)
], StepperComponent.prototype, "steps", void 0);
__decorate([
    Input(),
    __metadata("design:type", Number)
], StepperComponent.prototype, "currentStep", void 0);
__decorate([
    Input(),
    __metadata("design:type", String)
], StepperComponent.prototype, "orientation", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], StepperComponent.prototype, "clickable", void 0);
__decorate([
    Input(),
    __metadata("design:type", Boolean)
], StepperComponent.prototype, "loading", void 0);
__decorate([
    Output(),
    __metadata("design:type", Object)
], StepperComponent.prototype, "stepChange", void 0);
StepperComponent = __decorate([
    Component({
        selector: 'erp-stepper',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './stepper.component.html',
        styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
    })
], StepperComponent);
export { StepperComponent };
//# sourceMappingURL=stepper.component.js.map