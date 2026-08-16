import { IconName } from '../icon/icon.component';
import { EmptyStateType } from '../../enums/component.enum';
export declare class EmptyStateComponent {
    title: string;
    description: string;
    type: EmptyStateType | 'no-data' | 'not-found' | 'error' | 'maintenance';
    customIcon?: IconName;
    loading: boolean;
    getIconName(): IconName;
}
