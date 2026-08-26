var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { StepperOrientation, StepperStepStatus } from '../../../enums/component.enum';
let StepperComponent = class StepperComponent {
    steps = input([]);
    currentStep = model(0);
    orientation = input(StepperOrientation.HORIZONTAL);
    clickable = input(true);
    loading = input(false);
    stepChange = output();
    normalizedSteps = computed(() => {
        return this.steps().map(s => typeof s === 'string' ? { title: s } : s);
    });
    getStepStatus(index) {
        const cur = this.currentStep();
        if (index < cur)
            return StepperStepStatus.COMPLETED;
        if (index === cur)
            return StepperStepStatus.CURRENT;
        return StepperStepStatus.PENDING;
    }
    onStepClick(index, step) {
        if (this.clickable() && !step.disabled) {
            this.currentStep.set(index);
            this.stepChange.emit(index);
        }
    }
};
StepperComponent = __decorate([
    Component({
        selector: 'erp-stepper',
        standalone: true,
        imports: [CommonModule, IconComponent, SkeletonComponent],
        templateUrl: './stepper.component.html',
        changeDetection: ChangeDetectionStrategy.OnPush,
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