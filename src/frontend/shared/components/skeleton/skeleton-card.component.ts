import { Component } from '@angular/core';
import { SkeletonComponent } from '../skeleton/skeleton.component';

/**
 * Card-shaped skeleton matching plugin cards / dashboard stat cards: bordered
 * surface, header row and two body lines.
 */
@Component({
  selector: 'app-skeleton-card',
  standalone: true,
  imports: [SkeletonComponent],
  templateUrl: './skeleton-card.component.html'
})
export class SkeletonCardComponent {}
