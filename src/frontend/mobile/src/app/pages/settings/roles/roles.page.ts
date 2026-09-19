import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonMenuButton,
  NavController
} from '@ionic/angular/standalone';
import { IamService } from '../../../core/iam.service';
import {
  BadgeComponent,
  BadgeVariant,
  ButtonVariant,
  I18nService,
  Role,
  SharpButtonComponent,
  TranslateDirective,
  TranslatePipe,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonMenuButton,
    BadgeComponent,
    SharpButtonComponent,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './roles.page.html'
})
export class RolesPage implements OnInit {
  private iam = inject(IamService);
  private navCtrl = inject(NavController);
  private i18n = inject(I18nService);

  readonly badgeSystem = BadgeVariant.DEFAULT;
  readonly badgeCustom = BadgeVariant.INFO;
  readonly buttonSecondary = ButtonVariant.SECONDARY;

  roles = signal<Role[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  keyword = '';

  filteredRoles = computed<Role[]>(() => {
    const term = this.keyword.trim().toLowerCase();
    if (!term) {
      return this.roles();
    }
    return this.roles().filter(role =>
      role.name.toLowerCase().includes(term) || role.code.toLowerCase().includes(term)
    );
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set(null);
    this.iam.getRoles().subscribe({
      next: res => {
        this.roles.set(res.data?.items || []);
        this.loading.set(false);
      },
      error: err => {
        this.roles.set([]);
        this.loading.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  openRole(role: Role) {
    this.navCtrl.navigateForward(['/settings/roles', role.id]);
  }
}
