import { TransitionType } from '../../enums/component.enum';
export declare class TransitionComponent {
    show: boolean;
    type: TransitionType | 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'collapse';
    duration: number;
    get transitionClasses(): string;
}
