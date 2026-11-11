import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '../../i18n';

export interface TimelineNode {
  title: string;
  status: string;
  actorName?: string | null;
  timestamp?: string | null;
  comment?: string | null;
  isDone?: boolean;
  isFailed?: boolean;
}

@Component({
  selector: 'app-request-timeline',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './request-timeline.component.html'
})
export class RequestTimelineComponent {
  nodes = input<TimelineNode[]>([]);
}

