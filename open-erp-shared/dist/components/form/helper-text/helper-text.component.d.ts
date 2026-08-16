import { ValidationStatus } from '../../../enums/component.enum';
export declare class HelperTextComponent {
    text: string;
    status: ValidationStatus | 'none' | 'valid' | 'invalid' | 'warning';
    getTextClasses(): string;
    getIconName(): string;
}
