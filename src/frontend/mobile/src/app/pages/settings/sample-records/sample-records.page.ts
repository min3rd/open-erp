import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonMenuButton
} from '@ionic/angular/standalone';
import { SampleRecordService } from '../../../core/iam.service';
import {
  BadgeComponent,
  BadgeVariant,
  ButtonVariant,
  I18nService,
  SampleRecord,
  SharpButtonComponent,
  SharpInputComponent,
  TranslateDirective,
  TranslatePipe,
  apiMessage
} from '@shared';

@Component({
  selector: 'app-sample-records',
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
    SharpInputComponent,
    TranslateDirective,
    TranslatePipe
  ],
  templateUrl: './sample-records.page.html'
})
export class SampleRecordsPage implements OnInit {
  private sampleRecords = inject(SampleRecordService);
  private i18n = inject(I18nService);

  readonly badgeSuccess = BadgeVariant.SUCCESS;
  readonly badgeDefault = BadgeVariant.DEFAULT;
  readonly buttonSecondary = ButtonVariant.SECONDARY;

  records = signal<SampleRecord[]>([]);
  loading = signal<boolean>(true);
  loadingMore = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  showForm = signal<boolean>(false);
  creating = signal<boolean>(false);
  newTitle = '';
  newAmount = '';

  page = 0;
  private readonly size = 20;
  totalPages = signal<number>(1);
  ngOnInit() {
    this.load(true);
  }

  load(reset: boolean) {
    if (reset) {
      this.page = 0;
      this.loading.set(true);
    } else {
      if (this.page + 1 >= this.totalPages()) {
        return;
      }
      this.loadingMore.set(true);
    }
    this.error.set(null);

    const nextPage = reset ? 0 : this.page + 1;
    this.sampleRecords.getRecords(nextPage, this.size).subscribe({
      next: res => {
        const items = res.data?.items || [];
        this.records.set(reset ? items : [...this.records(), ...items]);
        this.totalPages.set(res.data?.total_pages || 1);
        this.page = nextPage;
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.loadingMore.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }

  toggleForm() {
    this.showForm.set(!this.showForm());
  }

  create() {
    const amount = Number(this.newAmount);
    if (!this.newTitle.trim() || Number.isNaN(amount) || amount < 0) {
      this.error.set(this.i18n.t('VALIDATION_REQUIRED'));
      return;
    }

    this.creating.set(true);
    this.error.set(null);
    this.success.set(null);
    this.sampleRecords.createRecord({ title: this.newTitle.trim(), amount }).subscribe({
      next: () => {
        this.creating.set(false);
        this.success.set(this.i18n.t('CORE_SAMPLE_RECORD_CREATED'));
        this.newTitle = '';
        this.newAmount = '';
        this.showForm.set(false);
        this.load(true);
      },
      error: err => {
        this.creating.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }
}
