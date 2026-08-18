import { IconName } from '../icon/icon.component';
import { CardVariant } from '../../enums/component.enum';
export declare class CardComponent {
    title?: string;
    subtitle?: string;
    icon?: IconName;
    coverImage?: string;
    variant: CardVariant | 'elevated' | 'outlined' | 'filled' | 'ghost';
    hoverable: boolean;
    loading: boolean;
    padded: boolean;
    getVariantClasses(): string;
}
