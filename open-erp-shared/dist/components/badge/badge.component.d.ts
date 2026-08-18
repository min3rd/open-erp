import { BadgeVariant, BadgeColor, BadgeCorner } from '../../enums/component.enum';
export declare class BadgeComponent {
    value?: string | number;
    count?: number;
    maxCount: number;
    showZero: boolean;
    corner?: BadgeCorner | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    variant: BadgeVariant | 'solid' | 'subtle' | 'outline' | 'dot';
    color: BadgeColor | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    pill: boolean;
    loading: boolean;
    get displayCount(): string | number | undefined;
    get isHidden(): boolean;
    getCornerClasses(): string;
    getBadgeClasses(): string;
    getDotColor(): string;
}
