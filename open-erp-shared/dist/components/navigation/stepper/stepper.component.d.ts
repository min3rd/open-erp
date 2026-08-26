import { IconName } from '../../icon/icon.component';
import { StepperOrientation, StepperStepStatus } from '../../../enums/component.enum';
export interface StepItem {
    title: string;
    description?: string;
    icon?: IconName;
    disabled?: boolean;
}
export declare class StepperComponent {
    readonly steps: import("@angular/core").InputSignal<(string | StepItem)[]>;
    readonly currentStep: import("@angular/core").ModelSignal<number>;
    readonly orientation: import("@angular/core").InputSignal<"horizontal" | "vertical" | StepperOrientation>;
    readonly clickable: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly stepChange: import("@angular/core").OutputEmitterRef<number>;
    readonly normalizedSteps: import("@angular/core").Signal<StepItem[]>;
    getStepStatus(index: number): StepperStepStatus;
    onStepClick(index: number, step: StepItem): void;
}
