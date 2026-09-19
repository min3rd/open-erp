import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PlatformTopbarComponent } from './platform-topbar/platform-topbar.component';

@Component({
  selector: 'app-platform-layout',
  standalone: true,
  imports: [RouterOutlet, PlatformTopbarComponent],
  templateUrl: './platform-layout.component.html'
})
export class PlatformLayoutComponent {}
