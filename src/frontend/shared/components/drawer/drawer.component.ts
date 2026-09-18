import { Component, input, output, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './drawer.component.html'
})
export class DrawerComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');
  subtitle = input<string>('');
  width = input<string>('max-w-md');
  zIndex = input<number>(50);

  close = output<void>();

  onClose() {
    this.close.emit();
  }

  onBackdropClick() {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.isOpen()) {
      this.close.emit();
    }
  }
}
