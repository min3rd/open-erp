import { BadgeVariant, BadgeColor } from '../../enums/component.enum';
export declare class BadgeComponent {
    value?: string | number;
    variant: BadgeVariant | 'solid' | 'subtle' | 'outline' | 'dot';
    color: BadgeColor | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
    pill: boolean;
    loading: boolean;
    getBadgeClasses(): string;
    getDotColor(): string;
}
