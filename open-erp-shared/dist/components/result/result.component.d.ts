import { IconName } from '../icon/icon.component';
import { ResultStatus } from '../../enums/component.enum';
export declare class ResultComponent {
    status: ResultStatus | '403' | '404' | '500' | 'success' | 'error' | 'warning' | 'info';
    title?: string;
    subTitle?: string;
    icon?: IconName;
    get isHttpError(): boolean;
    get defaultTitle(): string;
    get defaultSubTitle(): string;
    get iconName(): IconName;
    get iconColorClass(): string;
}
