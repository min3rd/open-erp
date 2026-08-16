import { EventEmitter } from '@angular/core';
import { IconName } from '../../icon/icon.component';
import { ButtonSize } from '../../../enums/component.enum';
export declare class SubmitButtonComponent {
    text: string;
    size: ButtonSize | 'sm' | 'md' | 'lg';
    submitting: boolean;
    disabled: boolean;
    icon: IconName;
    fullWidth: boolean;
    skeleton: boolean;
    submitClick: EventEmitter<MouseEvent>;
}
