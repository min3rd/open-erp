import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../../icon/icon.component';
import { SkeletonComponent } from '../../skeleton/skeleton.component';
import { StepperOrientation, StepperStepStatus } from '../../../enums/component.enum';

export interface StepItem {
  title: string;
  description?: string;
  icon?: IconName;
  disabled?: boolean;
}

@Component({
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
export class StepperComponent {
  @Input() steps: (string | StepItem)[] = [];
  @Input() currentStep: number = 0;
  @Input() orientation: StepperOrientation | 'horizontal' | 'vertical' = StepperOrientation.HORIZONTAL;
  @Input() clickable: boolean = true;
  @Input() loading: boolean = false;

  @Output() stepChange = new EventEmitter<number>();

  get normalizedSteps(): StepItem[] {
    return this.steps.map(s => typeof s === 'string' ? { title: s } : s);
  }

  getStepStatus(index: number): StepperStepStatus {
    if (index < this.currentStep) return StepperStepStatus.COMPLETED;
    if (index === this.currentStep) return StepperStepStatus.CURRENT;
    return StepperStepStatus.PENDING;
  }

  onStepClick(index: number, step: StepItem): void {
    if (this.clickable && !step.disabled) {
      this.currentStep = index;
      this.stepChange.emit(index);
    }
  }
}
