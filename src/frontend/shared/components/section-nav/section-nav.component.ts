import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';

export interface SectionNavItem {
  path: string;
  labelKey: string;
}

/**
 * Section navigation shared by the tenant settings area and the platform portal.
 * Rendered as a vertical rail by default; a theme whose menu lives under the
 * topbar passes `orientation="horizontal"`.
 */
@Component({
  selector: 'app-section-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './section-nav.component.html'
})
export class SectionNavComponent {
  items = input<ReadonlyArray<SectionNavItem>>([]);
  titleKey = input<string>('');
  orientation = input<'vertical' | 'horizontal'>('vertical');
}
