import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import { addIcons } from 'ionicons';
import { briefcase } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    RouterLink,
    TranslocoModule
  ],
})
export class HomePage {
  constructor() {
    addIcons({ briefcase });
  }
}
