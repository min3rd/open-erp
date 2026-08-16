import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'erp-theme-toggle',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './theme-toggle.component.html'
})
export class ThemeToggleComponent {
  themeService = inject(ThemeService);
}
