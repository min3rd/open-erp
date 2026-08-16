import { EventEmitter } from '@angular/core';
import { IconName } from '../icon/icon.component';
import { ButtonVariant, ButtonSize } from '../../enums/component.enum';
export declare class ButtonComponent {
    variant: ButtonVariant | 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
    size: ButtonSize | 'sm' | 'md' | 'lg';
    type: 'button' | 'submit' | 'reset';
    disabled: boolean;
    loading: boolean;
    skeleton: boolean;
    iconLeft?: IconName;
    iconRight?: IconName;
    fullWidth: boolean;
    btnClick: EventEmitter<MouseEvent>;
    onClick(event: MouseEvent): void;
    getVariantClasses(): string;
    getSizeClasses(): string;
    getSkeletonHeight(): string;
}
