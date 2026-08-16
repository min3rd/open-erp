import { EventEmitter } from '@angular/core';
import { IconName } from '../../icon/icon.component';
import { ButtonSize } from '../../../enums/component.enum';
export declare class ResetButtonComponent {
    text: string;
    size: ButtonSize | 'sm' | 'md' | 'lg';
    disabled: boolean;
    icon: IconName;
    fullWidth: boolean;
    skeleton: boolean;
    resetClick: EventEmitter<MouseEvent>;
}
