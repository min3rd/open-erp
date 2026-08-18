import { IconName } from '../icon/icon.component';
import { TimelinePosition } from '../../enums/component.enum';
export interface TimelineItem {
    id?: string;
    title: string;
    description?: string;
    timestamp: string;
    icon?: IconName;
    color?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral';
    tag?: string;
    active?: boolean;
}
export declare class TimelineComponent {
    items: TimelineItem[];
    position: TimelinePosition | 'left' | 'right' | 'alternate';
    reverse: boolean;
    loading: boolean;
    get normalizedItems(): TimelineItem[];
    getDotClasses(item: TimelineItem): string;
}
