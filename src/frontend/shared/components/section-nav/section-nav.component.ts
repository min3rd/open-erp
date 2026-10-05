import { Component, ElementRef, HostListener, computed, inject, input, output, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { IconName, IconNameValue, SizeVariant } from '../../enums';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { IconComponent } from '../icon/icon.component';

export interface SectionNavItem {
  /** Router path; omitted for a group header (only meaningful with children). */
  path?: string;
  labelKey: string;
  /** Feather icon id; shown by every variant that has room for it. */
  icon?: IconNameValue;
  /** Second level — an expandable group in the rail, a dropdown in `bar`. */
  children?: ReadonlyArray<SectionNavItem>;
}

/**
 * Menu placement only: a vertical rail (`rail`) or a horizontal bar (`bar`).
 * How the rail is *displayed* (expanded vs icon-only) is not a layout — it is the
 * collapse action inside the menu itself.
 */
export type SectionNavVariant = 'rail' | 'bar';

/**
 * Section navigation shared by the tenant settings area and the platform portal.
 * Groups (items with `children`) are expanded by default and can be collapsed
 * one by one; the group holding the current page is always shown expanded.
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

  /** Current URL, so the group holding the active page can stay expanded. */
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
  /** Icon-only rail (controlled by the collapse action in the menu header). */
  collapsed = input<boolean>(false);
  /**
   * Which way the rail's flyouts/tooltips open: `start` when the rail sits at
   * the inline start (left rail), `end` for a right-hand rail.
   */
  flyoutAlign = input<'start' | 'end'>('start');

  /** Emitted by the collapse action in the menu header. */
  toggleCollapse = output<void>();

  /** Groups the user collapsed by hand (everything else stays expanded). */
  private readonly closedGroups = signal<ReadonlySet<string>>(new Set());

  /** Group whose flyout is pinned open on the icon rail (click, not hover). */
  private readonly openFlyoutKey = signal<string | null>(null);

  readonly chevronsLeft = IconName.CHEVRONS_LEFT;
  readonly chevronsRight = IconName.CHEVRONS_RIGHT;

  /** Row sizing; the collapsed rail centres a single icon per row. */
  readonly rowClass = computed(() => this.collapsed()
    ? 'min-h-9 justify-center px-1 py-1.5 text-xs'
    : 'min-h-10 lg:min-h-8 gap-2 px-2.5 py-1.5 text-xs');

  readonly iconSize = computed(() => this.collapsed() ? SizeVariant.MD : SizeVariant.SM);

  /** A group stays open unless the user closed it (active group never hides). */
  isGroupOpen(item: SectionNavItem): boolean {
    return this.groupActive(item) || !this.closedGroups().has(item.labelKey);
  }

  /** True when one of the group's children is the page currently open. */
  groupActive(item: SectionNavItem): boolean {
    const url = this.currentUrl();
    return !!item.children?.some((child) => !!child.path && url.startsWith(child.path));
  }

  /** Remembers the open/closed state of a group (rail variant). */
  onGroupToggle(item: SectionNavItem, target: EventTarget | null): void {
    const open = (target as HTMLDetailsElement | null)?.open ?? true;
    const next = new Set(this.closedGroups());
    if (open) {
      next.delete(item.labelKey);
    } else {
      next.add(item.labelKey);
    }
    this.closedGroups.set(next);
  }

  /** Keeps at most one dropdown open at a time (bar variant). */
  onBarToggle(target: EventTarget | null): void {
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

  /** Icon rail: click pins a group's flyout open (hover works without JS). */
  isFlyoutOpen(item: SectionNavItem): boolean {
    return this.openFlyoutKey() === item.labelKey;
  }

  toggleFlyout(item: SectionNavItem): void {
    this.openFlyoutKey.set(this.isFlyoutOpen(item) ? null : item.labelKey);
  }

  /** Closes every bar dropdown, flyout and expanded group. */
  closeOpenMenus(): void {
    this.openFlyoutKey.set(null);
    this.host.nativeElement
      .querySelectorAll('details[open]')
      .forEach((details: Element) => details.removeAttribute('open'));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Dropdowns/flyouts close on an outside click; the expanded rail is an
    // accordion and keeps its groups open.
    if (this.variant() !== 'bar' && !this.collapsed()) {
      return;
    }
    const target = event.target as Node | null;
    if (!target || !this.host.nativeElement.contains(target)) {
      this.closeOpenMenus();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.variant() === 'bar' || this.collapsed()) {
      this.closeOpenMenus();
    }
  }
}
