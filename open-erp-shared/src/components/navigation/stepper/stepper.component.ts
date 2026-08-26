import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class StepperComponent {
  readonly steps = input<(string | StepItem)[]>([]);
  readonly currentStep = model<number>(0);
  readonly orientation = input<StepperOrientation | 'horizontal' | 'vertical'>(StepperOrientation.HORIZONTAL);
  readonly clickable = input<boolean>(true);
  readonly loading = input<boolean>(false);

  readonly stepChange = output<number>();

  readonly normalizedSteps = computed<StepItem[]>(() => {
    return this.steps().map(s => typeof s === 'string' ? { title: s } : s);
  });

  getStepStatus(index: number): StepperStepStatus {
    const cur = this.currentStep();
    if (index < cur) return StepperStepStatus.COMPLETED;
    if (index === cur) return StepperStepStatus.CURRENT;
    return StepperStepStatus.PENDING;
  }

  onStepClick(index: number, step: StepItem): void {
    if (this.clickable() && !step.disabled) {
      this.currentStep.set(index);
      this.stepChange.emit(index);
    }
  }
}
