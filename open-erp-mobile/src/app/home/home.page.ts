import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonButtons
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { addIcons } from 'ionicons';
import { briefcase } from 'ionicons/icons';
import { GuideTourComponent, TourStep, IconComponent } from '@open-erp/shared';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonButtons,
    RouterLink,
    TranslocoModule,
    GuideTourComponent,
    IconComponent
  ],
})
export class HomePage implements OnInit {
  showGuide = signal<boolean>(false);

  steps: TourStep[] = [
    {
      title: 'guide.home_mobile_title',
      description: 'guide.home_mobile_desc',
      selector: '#welcome-heading-mobile'
    },
    {
      title: 'guide.home_mobile_org_title',
      description: 'guide.home_mobile_org_desc',
      selector: '#org-card-mobile'
    }
  ];

  constructor() {
    addIcons({ briefcase });
  }

  ngOnInit() {
    const seen = localStorage.getItem('guide_seen_home-mobile');
    if (seen !== 'true') {
      setTimeout(() => {
        this.showGuide.set(true);
      }, 500);
    }
  }

  triggerGuide() {
    this.showGuide.set(true);
  }
}
