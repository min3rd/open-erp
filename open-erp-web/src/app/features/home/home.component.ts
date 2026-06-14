import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { GuideTourComponent, TourStep, IconComponent } from '@open-erp/shared';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule, GuideTourComponent, IconComponent],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  showGuide = signal<boolean>(false);

  steps: TourStep[] = [
    {
      title: 'guide.home_title',
      description: 'guide.home_desc',
      selector: '#welcome-heading'
    },
    {
      title: 'guide.home_org_title',
      description: 'guide.home_org_desc',
      selector: '#org-card'
    }
  ];

  ngOnInit() {
    const seen = localStorage.getItem('guide_seen_home');
    if (seen !== 'true') {
      // Small timeout to allow page layout to stabilize
      setTimeout(() => {
        this.showGuide.set(true);
      }, 500);
    }
  }

  triggerGuide() {
    this.showGuide.set(true);
  }
}
