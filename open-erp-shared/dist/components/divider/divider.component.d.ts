import { DividerOrientation } from '../../enums/component.enum';
export declare class DividerComponent {
    orientation: DividerOrientation | 'horizontal' | 'vertical';
    dashed: boolean;
    label?: string;
    align: 'left' | 'center' | 'right';
    loading: boolean;
}
