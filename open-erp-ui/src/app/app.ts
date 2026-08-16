import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MaintenanceBannerComponent } from './shared/components/maintenance-banner/maintenance-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MaintenanceBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('open-erp-ui');
}
