import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'oerp-modal',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './modal.component.html'
})
export class ModalComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');

  onClose = output<void>();

  closeModal(): void {
    this.onClose.emit();
  }
}
