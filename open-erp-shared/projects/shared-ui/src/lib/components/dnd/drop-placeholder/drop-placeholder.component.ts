import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * oerp-drop-placeholder
 * Chỉ báo vị trí drop (placeholder) với hiệu ứng animation mượt và màu chủ đạo Rose Gold.
 */
@Component({
  selector: 'oerp-drop-placeholder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drop-placeholder.component.html',
  styles: [
    `
      .default-placeholder {
        border: 2px dashed #b76e79; /* Rose Gold */
        background-color: rgba(183, 110, 121, 0.06);
        border-radius: 0.5rem;
        width: 100%;
        min-height: 48px;
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.4;
        }
      }
    `,
  ],
})
export class DropPlaceholderComponent {
  placeholderClass = input<string>('default-placeholder');
  height = input<number | undefined>(undefined);
}
