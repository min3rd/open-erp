import { BadgeStatus } from '../../enums/component.enum';
export declare class StatusBadgeComponent {
    status: BadgeStatus | string;
    label: string;
    showDot: boolean;
    loading: boolean;
    get normalizedStatus(): string;
    getBadgeClasses(): string;
    getDotClasses(): string;
}
