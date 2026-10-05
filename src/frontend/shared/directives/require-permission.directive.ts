import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { PLUGIN_PERMISSION_CHECKER } from '../plugin-host/plugin-host.tokens';

/**
 * Structural directive: renders its content only when the user holds the
 * permission. Actions the user cannot perform are hidden up-front instead of
 * staying enabled and failing with a 403 that disables them afterwards.
 *
 *   <button *appRequirePermission="'core:sample-record:export'">Export</button>
 */
@Directive({ selector: '[appRequirePermission]', standalone: true })
export class RequirePermissionDirective {
  private templateRef = inject(TemplateRef<unknown>);
  private viewContainer = inject(ViewContainerRef);
  private checker = inject(PLUGIN_PERMISSION_CHECKER);

  readonly appRequirePermission = input.required<string>();

  constructor() {
    effect(() => {
      const permission = this.appRequirePermission();
      this.viewContainer.clear();
      if (this.checker(permission)) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
