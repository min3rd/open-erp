import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n';

@Component({
  selector: 'app-gps-indicator',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './gps-indicator.component.html'
})
export class GpsIndicatorComponent {
  lat = input<number | null>(null);
  lng = input<number | null>(null);
  accuracy = input<number | null>(null);
  distanceMeters = input<number | null>(null);
  allowedRadiusMeters = input<number>(200);
  isInside = input<boolean | null>(null);
  loading = input<boolean>(false);

  readonly formattedCoords = computed<string>(() => {
    if (this.lat() == null || this.lng() == null) {
      return '';
    }
    return `${this.lat()!.toFixed(5)}, ${this.lng()!.toFixed(5)}`;
  });

  readonly formattedDistance = computed<string>(() => {
    if (this.distanceMeters() == null) {
      return '';
    }
    if (this.distanceMeters()! >= 1000) {
      return `${(this.distanceMeters()! / 1000).toFixed(2)} km`;
    }
    return `${Math.round(this.distanceMeters()!)} m`;
  });
}

