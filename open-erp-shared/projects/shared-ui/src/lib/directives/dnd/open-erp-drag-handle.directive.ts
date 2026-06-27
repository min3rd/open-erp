import { Directive } from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';

/**
 * OpenErpDragHandleDirective
 * Chỉ định khu vực làm handle để kéo thả phần tử.
 */
@Directive({
  selector: '[open-erp-drag-handle]',
  standalone: true,
  hostDirectives: [CdkDragHandle],
})
export class OpenErpDragHandleDirective {}
