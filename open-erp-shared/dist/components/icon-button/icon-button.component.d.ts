import { EventEmitter } from '@angular/core';
import { IconName } from '../icon/icon.component';
import { ButtonVariant, ButtonSize } from '../../enums/component.enum';
export declare class IconButtonComponent {
    icon: IconName;
    variant: ButtonVariant | 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success';
    size: ButtonSize | 'sm' | 'md' | 'lg';
    shape: 'circle' | 'rounded' | 'square';
    tooltip?: string;
    badge?: number | string;
    badgeColor: string;
    disabled: boolean;
    loading: boolean;
    skeleton: boolean;
    ariaLabel?: string;
    btnClick: EventEmitter<MouseEvent>;
    onClick(event: MouseEvent): void;
    getVariantClasses(): string;
    getSizeClasses(): string;
    getIconSize(): number;
    getShapeClasses(): string;
}
