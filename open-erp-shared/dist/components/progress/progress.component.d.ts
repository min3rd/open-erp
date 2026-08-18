import { ProgressVariant, ProgressStatus } from '../../enums/component.enum';
export declare class ProgressComponent {
    percent: number;
    variant: ProgressVariant | 'bar' | 'circle' | 'dashboard';
    status: ProgressStatus | 'normal' | 'success' | 'warning' | 'error' | 'active';
    showInfo: boolean;
    strokeWidth: number;
    circleSize: number;
    indeterminate: boolean;
    striped: boolean;
    color?: string;
    trackColor?: string;
    get normalizedPercent(): number;
    get isCircle(): boolean;
    get circleRadius(): number;
    get circleCircumference(): number;
    get circleDashOffset(): number;
    get barColorClass(): string;
    get circleStrokeColor(): string;
}
