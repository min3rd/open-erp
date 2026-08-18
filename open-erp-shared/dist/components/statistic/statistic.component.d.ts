import { IconName } from '../icon/icon.component';
import { KpiTrendDirection } from '../../enums/component.enum';
export declare class StatisticComponent {
    title: string;
    value: string | number;
    prefix?: string;
    suffix?: string;
    subText?: string;
    icon?: IconName;
    iconColor?: string;
    iconBg?: string;
    trend?: KpiTrendDirection | 'up' | 'down' | 'neutral';
    trendValue?: string;
    trendLabel?: string;
    loading: boolean;
    bordered: boolean;
    get isTrendUp(): boolean;
    get isTrendDown(): boolean;
}
