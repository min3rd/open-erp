import { ColorVariant, SizeVariant } from './theme.enum';

export type ButtonVariant = ColorVariant;
export const ButtonVariant = ColorVariant;

export type ButtonSize = SizeVariant;
export const ButtonSize = SizeVariant;

export enum ButtonType {
  BUTTON = 'button',
  SUBMIT = 'submit',
  RESET = 'reset'
}
