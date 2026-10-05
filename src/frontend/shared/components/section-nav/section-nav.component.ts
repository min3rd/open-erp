import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe } from '../../i18n/translate.pipe';

export interface SectionNavItem {
  path: string;
  labelKey: string;
}

/**
 * Vertical section navigation (left rail) shared by the tenant settings area and
 * the platform portal. Replaces the horizontal tab strips that overflowed and
 * clipped their last item at desktop widths.
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
}
