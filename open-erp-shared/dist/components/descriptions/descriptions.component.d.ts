import { IconName } from '../icon/icon.component';
import { DescriptionsLayout } from '../../enums/component.enum';
export interface DescriptionItem {
    label: string;
    value?: any;
    span?: number;
    icon?: IconName;
    badge?: string;
    badgeColor?: string;
}
export declare class DescriptionsComponent {
    title?: string;
    items: DescriptionItem[];
    column: number;
    bordered: boolean;
    layout: DescriptionsLayout | 'horizontal' | 'vertical';
    size: 'sm' | 'md' | 'lg';
    getGridColsClasses(): string;
    getSizeClasses(): string;
}
