import { CommonModule } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ColorVariant, PluginReleaseStatus } from '../../enums';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { PluginVersionItem } from '../../models/plugin.model';
import { BadgeComponent } from '../badge/badge.component';
import { SharpButtonComponent } from '../sharp-button/sharp-button.component';

@Component({
  selector: 'app-version-timeline',
  standalone: true,
  imports: [CommonModule, TranslatePipe, BadgeComponent, SharpButtonComponent],
  templateUrl: './version-timeline.component.html',
})
export class VersionTimelineComponent {
  versions = input<PluginVersionItem[]>([]);
  currentVersion = input<string | null>(null);
  editable = input<boolean>(false);

  publish = output<string>();
  deprecate = output<string>();
  remove = output<string>();

  statusVariant(status: PluginReleaseStatus | string): ColorVariant {
    switch (status as PluginReleaseStatus) {
      case PluginReleaseStatus.PUBLISHED:
        return ColorVariant.SUCCESS;
      case PluginReleaseStatus.DEPRECATED:
        return ColorVariant.WARNING;
      case PluginReleaseStatus.BLOCKED:
        return ColorVariant.DANGER;
      default:
        return ColorVariant.DEFAULT;
    }
  }

  isCurrent(version: string): boolean {
    return this.currentVersion() === version;
  }
}
