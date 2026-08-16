import { IconName } from '../icon/icon.component';
import { KpiTrendDirection } from '../../enums/component.enum';
export declare class KpiCardComponent {
    title: string;
    value: string | number;
    subText: string;
    trend: KpiTrendDirection | 'up' | 'down' | 'neutral';
    iconName?: IconName;
    iconBg: string;
    loading: boolean;
    getTrendClasses(): string;
    getTrendIcon(): IconName;
}
