import { Component, ElementRef, HostListener, computed, inject, input } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { IconNameValue, SizeVariant } from '../../enums';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { IconComponent } from '../icon/icon.component';

export interface SectionNavItem {
  /** Router path; omitted for a group header (only meaningful with children). */
  path?: string;
  labelKey: string;
  /** Feather icon id; shown by every variant that has room for it. */
  icon?: IconNameValue;
  /** Second level — an expandable group in the rail variants, a dropdown in `bar`. */
  children?: ReadonlyArray<SectionNavItem>;
}

/** How the section menu is laid out (mirrors the user's menu-layout choice). */
export type SectionNavVariant =
  /** Full-width vertical rail with icon + label (left/right sidebar, drawer). */
  | 'rail'
  /** Narrow rail with icon + label and tighter rows. */
  | 'compact'
  /** Icon-only rail; the label becomes the tooltip/accessible name. */
  | 'icons'
  /** Horizontal bar under the topbar; groups open a dropdown (multi-level). */
  | 'bar';

/**
 * Section navigation shared by the tenant settings area and the platform portal.
 * The variant is chosen by the user's menu-layout preference (see LayoutId).
 * Groups (items with `children`) expand in place on a rail and open a dropdown
 * on the bar; the group holding the current page starts expanded.
 */
@Component({
  selector: 'app-section-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, IconComponent],
  templateUrl: './section-nav.component.html'
})
export class SectionNavComponent {
  private host = inject(ElementRef<HTMLElement>);
  private router = inject(Router);

  /** Current URL, so the group holding the active page can start expanded. */
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  items = input<ReadonlyArray<SectionNavItem>>([]);
  titleKey = input<string>('');
  variant = input<SectionNavVariant>('rail');

  /** Row sizing for the vertical variants (rail is roomier than compact). */
  readonly railRow = computed(() => this.variant() === 'compact'
    ? { row: 'min-h-8 gap-1.5 px-2 py-1 text-[11px]', icon: SizeVariant.XS, indent: 'ps-4' }
    : { row: 'min-h-10 lg:min-h-8 gap-2 px-2.5 py-1.5 text-xs', icon: SizeVariant.SM, indent: 'ps-6' });

  /** True when one of the group's children is the page currently open. */
  groupActive(item: SectionNavItem): boolean {
    const url = this.currentUrl();
    return !!item.children?.some((child) => !!child.path && url.startsWith(child.path));
  }

  /** Keeps at most one dropdown open at a time (bar variant). */
  onToggle(target: EventTarget | null): void {
    const details = target as HTMLDetailsElement | null;
    if (!details?.open) {
      return;
    }
    this.host.nativeElement.querySelectorAll('details[open]').forEach((other: Element) => {
      if (other !== details) {
        other.removeAttribute('open');
      }
    });
  }

  /** Closes every expanded group/dropdown (navigation, outside click, Escape). */
  closeOpenMenus(): void {
    this.host.nativeElement
      .querySelectorAll('details[open]')
      .forEach((details: Element) => details.removeAttribute('open'));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Only the horizontal bar behaves like a dropdown; rail groups stay
    // expanded until the user collapses them.
    if (this.variant() !== 'bar') {
      return;
    }
    const target = event.target as Node | null;
    if (!target || !this.host.nativeElement.contains(target)) {
      this.closeOpenMenus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.variant() === 'bar') {
      this.closeOpenMenus();
    }
  }
}
