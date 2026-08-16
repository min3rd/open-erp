import { EventEmitter } from '@angular/core';
import { IconName } from '../../icon/icon.component';
import { StepperOrientation, StepperStepStatus } from '../../../enums/component.enum';
export interface StepItem {
    title: string;
    description?: string;
    icon?: IconName;
    disabled?: boolean;
}
export declare class StepperComponent {
    steps: (string | StepItem)[];
    currentStep: number;
    orientation: StepperOrientation | 'horizontal' | 'vertical';
    clickable: boolean;
    loading: boolean;
    stepChange: EventEmitter<number>;
    get normalizedSteps(): StepItem[];
    getStepStatus(index: number): StepperStepStatus;
    onStepClick(index: number, step: StepItem): void;
}
