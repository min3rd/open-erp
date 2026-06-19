import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  effect,
} from '@angular/core';
import { AuthService } from '../services/auth.service';

@Directive({
  selector: '[appHasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);
  private authService = inject(AuthService);

  private requiredPermission = '';
  private hasView = false;

  @Input()
  set appHasPermission(permission: string) {
    this.requiredPermission = permission;
    this.updateView();
  }

  constructor() {
    // Re-evaluate when permissions signal changes
    effect(() => {
      // Access permissions signal to establish dependency
      this.authService.permissions();
      this.updateView();
    });
  }

  private updateView() {
    if (!this.requiredPermission) {
      if (!this.hasView) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.hasView = true;
      }
      return;
    }

    const hasPermission = this.authService.hasPermission(this.requiredPermission);

    if (hasPermission && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!hasPermission && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}
