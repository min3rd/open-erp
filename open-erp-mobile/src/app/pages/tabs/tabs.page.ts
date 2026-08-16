import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonTabs, IonTabBar, IonTabButton, IonLabel } from '@ionic/angular/standalone';
import { TranslocoModule } from '@jsverse/transloco';

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, IonTabs, IonTabBar, IonTabButton, IonLabel, TranslocoModule],
  templateUrl: './tabs.page.html'
})
export class TabsPage {}
