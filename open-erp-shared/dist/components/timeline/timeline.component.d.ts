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
    readonly items: import("@angular/core").InputSignal<TimelineItem[]>;
    readonly position: import("@angular/core").InputSignal<"left" | "right" | "alternate" | TimelinePosition>;
    readonly reverse: import("@angular/core").InputSignal<boolean>;
    readonly loading: import("@angular/core").InputSignal<boolean>;
    readonly normalizedItems: import("@angular/core").Signal<TimelineItem[]>;
    getDotClasses(item: TimelineItem): string;
}
