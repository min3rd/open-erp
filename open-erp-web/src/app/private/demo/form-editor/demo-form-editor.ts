import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormEditor } from '../../../../core/components/form-editor/form-editor';

@Component({
  selector: 'demo-form-editor',
  imports: [FormEditor],
  template: `
    <div id="demo-form-editor-container" class="h-screen">
      <core-form-editor />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoFormEditor {}
