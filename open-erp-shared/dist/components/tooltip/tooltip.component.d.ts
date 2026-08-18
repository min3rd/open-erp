import { TooltipPlacement } from '../../enums/component.enum';
export declare class TooltipContainerComponent {
    content: string;
    placement: TooltipPlacement | 'top' | 'bottom' | 'left' | 'right';
    getPlacementClasses(): string;
    getArrowClasses(): string;
}
export declare class TooltipComponent {
    content: string;
    placement: TooltipPlacement | 'top' | 'bottom' | 'left' | 'right';
    visible: boolean;
    show(): void;
    hide(): void;
}
