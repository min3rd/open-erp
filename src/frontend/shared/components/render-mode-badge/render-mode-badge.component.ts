import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { PluginRenderMode } from '../../enums';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { BadgeComponent } from '../badge/badge.component';

@Component({
  selector: 'app-render-mode-badge',
  standalone: true,
  imports: [CommonModule, TranslatePipe, BadgeComponent],
  templateUrl: './render-mode-badge.component.html',
})
export class RenderModeBadgeComponent {
  mode = input.required<PluginRenderMode | string>();

  labelKey(): string {
    switch (this.mode() as PluginRenderMode) {
      case PluginRenderMode.WEB_COMPONENT:
        return 'PLUGIN_RENDER_MODE_WC';
      case PluginRenderMode.MODULE_FEDERATION:
        return 'PLUGIN_RENDER_MODE_MF';
      case PluginRenderMode.IFRAME:
        return 'PLUGIN_RENDER_MODE_IFRAME';
      default:
        return 'PLUGIN_RENDER_MODE_UNKNOWN';
    }
  }

  titleKey(): string {
    switch (this.mode() as PluginRenderMode) {
      case PluginRenderMode.WEB_COMPONENT:
        return 'PLUGIN_RENDER_MODE_WC_FULL';
      case PluginRenderMode.MODULE_FEDERATION:
        return 'PLUGIN_RENDER_MODE_MF_FULL';
      case PluginRenderMode.IFRAME:
        return 'PLUGIN_RENDER_MODE_IFRAME_FULL';
      default:
        return 'PLUGIN_RENDER_MODE_UNKNOWN';
    }
  }
}
