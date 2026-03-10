import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  input,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

@Component({
  selector: 'mp-toolbar',
  imports: [NgTemplateOutlet],
  templateUrl: './toolbar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MpToolbar {
  id = input<string>('');

  @ContentChild('start') startTemplate?: TemplateRef<unknown>;
  @ContentChild('center') centerTemplate?: TemplateRef<unknown>;
  @ContentChild('end') endTemplate?: TemplateRef<unknown>;
}
