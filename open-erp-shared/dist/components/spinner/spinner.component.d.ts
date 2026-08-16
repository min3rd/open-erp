import { SpinnerSize, SpinnerVariant } from '../../enums/component.enum';
export declare class SpinnerComponent {
    size: SpinnerSize | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    variant: SpinnerVariant | 'spin' | 'dots' | 'pulse';
    color: string;
    label?: string;
    getSizeClasses(): string;
    getDotSizeClasses(): string;
}
