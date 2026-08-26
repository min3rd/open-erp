import { Component, ChangeDetectionStrategy, input, model, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent, IconName } from '../icon/icon.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { TagColor, TagVariant } from '../../enums/component.enum';

@Component({
  selector: 'erp-tag, erp-chip',
  standalone: true,
  imports: [CommonModule, IconComponent, SkeletonComponent],
  templateUrl: './tag.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TagComponent {
  readonly label = input<string>('');
  readonly icon = input<IconName | undefined>(undefined);
  readonly color = input<TagColor | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'pink'>(TagColor.PRIMARY);
  readonly variant = input<TagVariant | 'solid' | 'subtle' | 'outline'>(TagVariant.SUBTLE);
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly removable = input<boolean>(false);
  readonly clickable = input<boolean>(false);
  readonly selectable = input<boolean>(false);
  readonly selected = model<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly remove = output<MouseEvent | KeyboardEvent>();
  readonly tagClick = output<MouseEvent | KeyboardEvent>();

  readonly isInteractive = computed(() => this.clickable() || this.selectable() || this.removable());

  readonly iconSize = computed(() => {
    const s = this.size();
    return s === 'sm' ? 10 : (s === 'lg' ? 14 : 12);
  });

  readonly removeIconSize = computed(() => {
    return this.size() === 'sm' ? 10 : 12;
  });

  readonly tagClasses = computed(() => {
    const v = String(this.variant());
    const c = String(this.color());
    const s = String(this.size());
    const interactive = this.isInteractive();

    const classes: string[] = [
      'inline-flex items-center gap-1.5 font-bold tracking-tight rounded-xl select-none transition-all outline-none',
      interactive ? 'cursor-pointer hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:ring-indigo-500/40' : 'cursor-default'
    ];

    // Sizes
    switch (s) {
      case 'sm': classes.push('px-2 py-0.5 text-[10px]'); break;
      case 'lg': classes.push('px-3.5 py-1.5 text-xs'); break;
      case 'md':
      default: classes.push('px-2.5 py-1 text-[11px]'); break;
    }

    if (v === 'solid') {
      switch (c) {
        case 'success': classes.push('bg-emerald-600 text-white shadow-xs'); break;
        case 'warning': classes.push('bg-amber-500 text-white shadow-xs'); break;
        case 'danger': classes.push('bg-rose-600 text-white shadow-xs'); break;
        case 'info': classes.push('bg-cyan-600 text-white shadow-xs'); break;
        case 'purple': classes.push('bg-purple-600 text-white shadow-xs'); break;
        case 'pink': classes.push('bg-pink-600 text-white shadow-xs'); break;
        case 'neutral': classes.push('bg-slate-700 text-white shadow-xs'); break;
        case 'primary':
        default: classes.push('bg-indigo-600 text-white shadow-xs'); break;
      }
    } else if (v === 'outline') {
      switch (c) {
        case 'success': classes.push('border border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'); break;
        case 'warning': classes.push('border border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-950/20'); break;
        case 'danger': classes.push('border border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/40 dark:bg-rose-950/20'); break;
        case 'info': classes.push('border border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-cyan-50/40 dark:bg-cyan-950/20'); break;
        case 'purple': classes.push('border border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/40 dark:bg-purple-950/20'); break;
        case 'pink': classes.push('border border-pink-500 text-pink-600 dark:text-pink-400 bg-pink-50/40 dark:bg-pink-950/20'); break;
        case 'neutral': classes.push('border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900'); break;
        case 'primary':
        default: classes.push('border border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'); break;
      }
    } else { // subtle
      switch (c) {
        case 'success': classes.push('bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60'); break;
        case 'warning': classes.push('bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'); break;
        case 'danger': classes.push('bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60'); break;
        case 'info': classes.push('bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60'); break;
        case 'purple': classes.push('bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'); break;
        case 'pink': classes.push('bg-pink-50 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border border-pink-200/60 dark:border-pink-800/60'); break;
        case 'neutral': classes.push('bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'); break;
        case 'primary':
        default: classes.push('bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'); break;
      }
    }

    if (this.disabled()) {
      classes.push('opacity-50');
    }

    return classes.join(' ');
  });

  onTagClick(event: MouseEvent | KeyboardEvent): void {
    if (this.disabled() || this.loading()) return;
    if (this.selectable()) {
      this.selected.update(val => !val);
    }
    if (this.clickable() || this.selectable()) {
      this.tagClick.emit(event);
    }
  }

  onRemove(event: MouseEvent | KeyboardEvent): void {
    event.stopPropagation();
    if (!this.disabled() && !this.loading()) {
      this.remove.emit(event);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (this.disabled() || this.loading()) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.onTagClick(event);
    } else if ((event.key === 'Backspace' || event.key === 'Delete') && this.removable()) {
      event.preventDefault();
      this.onRemove(event);
    }
  }
}
