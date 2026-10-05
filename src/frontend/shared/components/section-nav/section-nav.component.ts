import { Component, ElementRef, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IconNameValue } from '../../enums';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { IconComponent } from '../icon/icon.component';

export interface SectionNavItem {
  /** Router path; omitted for a group header (only meaningful with children). */
  path?: string;
  labelKey: string;
  /** Feather icon id; shown by every variant that has room for it. */
  icon?: IconNameValue;
  /** Second level — rendered as a dropdown by the `bar` variant. */
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
 */
@Component({
  selector: 'app-section-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe, IconComponent],
  templateUrl: './section-nav.component.html'
})
export class SectionNavComponent {
  private host = inject(ElementRef<HTMLElement>);

  items = input<ReadonlyArray<SectionNavItem>>([]);
  titleKey = input<string>('');
  variant = input<SectionNavVariant>('rail');

  /** Closes any open `bar` dropdown (called when a level-2 link is followed). */
  closeOpenMenus(): void {
    this.host.nativeElement
      .querySelectorAll('details[open]')
      .forEach((details: Element) => details.removeAttribute('open'));
  }
}
