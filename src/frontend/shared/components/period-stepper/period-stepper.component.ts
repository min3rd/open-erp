import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n';

export interface StepItem {
  key: string;
  labelKey: string;
  order: number;
}

@Component({
  selector: 'app-period-stepper',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './period-stepper.component.html'
})
export class PeriodStepperComponent {
  currentStep = input<string>('S1_LOGS');
  locked = input<boolean>(false);
  stepChange = output<string>();

  readonly steps: StepItem[] = [
    { key: 'S1_LOGS', labelKey: 'attendance.timesheet.step.s1_logs', order: 1 },
    { key: 'S2_SCHEDULE', labelKey: 'attendance.timesheet.step.s2_schedule', order: 2 },
    { key: 'S3_CALCULATE', labelKey: 'attendance.timesheet.step.s3_calculate', order: 3 },
    { key: 'S4_ADJUST', labelKey: 'attendance.timesheet.step.s4_adjust', order: 4 },
    { key: 'DONE', labelKey: 'attendance.timesheet.step.done', order: 5 }
  ];

  readonly currentOrder = computed<number>(() => {
    const s = this.steps.find((item) => item.key === this.currentStep());
    return s ? s.order : 1;
  });

  onSelectStep(step: StepItem): void {
    if (this.locked()) {
      return;
    }
    this.stepChange.emit(step.key);
  }
}

