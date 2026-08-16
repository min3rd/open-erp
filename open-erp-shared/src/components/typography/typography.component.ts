import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { TypographyVariant } from '../../enums/component.enum';

@Component({
  selector: 'erp-typography, erp-heading, erp-text',
  standalone: true,
  imports: [CommonModule, SkeletonComponent],
  templateUrl: './typography.component.html'
})
export class TypographyComponent {
  @Input() variant: TypographyVariant | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'lead' | 'body' | 'small' | 'muted' | 'code' = TypographyVariant.BODY;
  @Input() weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  @Input() align?: 'left' | 'center' | 'right' | 'justify';
  @Input() gradient: boolean = false;
  @Input() truncate: boolean = false;
  @Input() loading: boolean = false;
  @Input() skeletonWidth: string = '100%';

  getTypographyClasses(): string {
    const v = String(this.variant);
    const classes: string[] = [];

    // Variant Styles
    switch (v) {
      case TypographyVariant.H1:
      case 'h1':
        classes.push('text-3xl sm:text-4xl tracking-tight font-black');
        break;
      case TypographyVariant.H2:
      case 'h2':
        classes.push('text-2xl sm:text-3xl tracking-tight font-extrabold');
        break;
      case TypographyVariant.H3:
      case 'h3':
        classes.push('text-xl sm:text-2xl tracking-tight font-bold');
        break;
      case TypographyVariant.H4:
      case 'h4':
        classes.push('text-lg sm:text-xl font-bold');
        break;
      case TypographyVariant.H5:
      case 'h5':
        classes.push('text-base font-bold');
        break;
      case TypographyVariant.H6:
      case 'h6':
        classes.push('text-sm font-bold uppercase tracking-wider');
        break;
      case TypographyVariant.LEAD:
      case 'lead':
        classes.push('text-base sm:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed');
        break;
      case TypographyVariant.SMALL:
      case 'small':
        classes.push('text-xs text-slate-500 dark:text-slate-400 font-medium');
        break;
      case TypographyVariant.MUTED:
      case 'muted':
        classes.push('text-xs text-slate-400 dark:text-slate-500 font-normal');
        break;
      case TypographyVariant.CODE:
      case 'code':
        classes.push('font-mono text-xs px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700');
        break;
      case TypographyVariant.BODY:
      case 'body':
      default:
        classes.push('text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal');
        break;
    }

    // Weight Overrides
    if (this.weight) {
      switch (this.weight) {
        case 'light': classes.push('font-light'); break;
        case 'normal': classes.push('font-normal'); break;
        case 'medium': classes.push('font-medium'); break;
        case 'semibold': classes.push('font-semibold'); break;
        case 'bold': classes.push('font-bold'); break;
        case 'black': classes.push('font-black'); break;
      }
    }

    // Alignment
    if (this.align) {
      classes.push(`text-${this.align}`);
    }

    // Gradient Text
    if (this.gradient) {
      classes.push('bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-400 bg-clip-text text-transparent');
    }

    // Truncate
    if (this.truncate) {
      classes.push('truncate');
    }

    return classes.join(' ');
  }

  getSkeletonHeight(): string {
    const v = String(this.variant);
    switch (v) {
      case 'h1': return '2.5rem';
      case 'h2': return '2rem';
      case 'h3': return '1.75rem';
      case 'h4': return '1.5rem';
      case 'lead': return '1.25rem';
      default: return '1rem';
    }
  }
}
