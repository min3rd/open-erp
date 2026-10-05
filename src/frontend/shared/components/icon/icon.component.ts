import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SizeVariant } from '../../enums';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { getIcon } from './icon-registry';

const SIZE_PX: Record<string, number> = {
  [SizeVariant.XS]: 12,
  [SizeVariant.SM]: 16,
  [SizeVariant.MD]: 20,
  [SizeVariant.LG]: 24,
  [SizeVariant.XL]: 32
};

/**
 * Shared Feather icon. Renders the path markup from the registry inside a
 * single `<svg>` shell so colour/size/stroke stay consistent everywhere.
 * Icon+text usages pass `[decorative]="true"`; icon-only usages pass a
 * `labelKey` so the icon becomes the accessible name.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './icon.component.html',
  host: { class: 'inline-flex shrink-0 items-center justify-center' }
})
export class IconComponent {
  private sanitizer = inject(DomSanitizer);

  /**
   * Directional icons mirror in RTL by default (the renderer is often generic,
   * e.g. context-menu items); pass `false` to opt out or `true` to force it.
   */
  private static readonly RTL_MIRRORED_ICONS = new Set([
    'chevron-left', 'chevron-right', 'chevrons-left', 'chevrons-right',
    'arrow-left', 'arrow-right', 'arrow-up-left', 'arrow-up-right',
    'arrow-down-left', 'arrow-down-right', 'external-link', 'log-out'
  ]);

  /**
   * Feather icon id (see `IconName` for the canonical set). Typed as `string`
   * on purpose: static template attributes (`name="x"`) are plain strings, and
   * the enum stays the source of truth for TS call sites.
   */
  name = input.required<string>();
  size = input<SizeVariant | `${SizeVariant}`>(SizeVariant.SM);
  decorative = input<boolean>(false);
  labelKey = input<string>('');
  rtlMirror = input<boolean | null>(null);

  readonly pixels = computed(() => SIZE_PX[this.size()] ?? SIZE_PX[SizeVariant.SM]);

  readonly mirrorClass = computed(() =>
    (this.rtlMirror() ?? IconComponent.RTL_MIRRORED_ICONS.has(this.name())) ? 'rtl:scale-x-[-1]' : ''
  );

  readonly markup = computed<SafeHtml>(() =>
    this.sanitizer.bypassSecurityTrustHtml(getIcon(this.name()).contents)
  );
}
