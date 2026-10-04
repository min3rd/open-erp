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
  IonMenuButton,
} from '@ionic/angular/standalone';
import { SampleRecordService } from '../../../core/iam.service';
import { PagedList } from '../../../core/paged-list';
import {
  BadgeComponent,
  ColorVariant,
  I18nService,
  SampleRecord,
  SharpButtonComponent,
  SharpInputComponent,
  TranslateDirective,
  TranslatePipe,
  apiMessage,
  formatDateTime,
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
  private readonly size = 20;

  readonly badgeSuccess = ColorVariant.SUCCESS;
  readonly badgeDefault = ColorVariant.DEFAULT;
  readonly buttonSecondary = ColorVariant.SECONDARY;
  readonly formatDateTime = formatDateTime;

  error = signal<string | null>(null);
  success = signal<string | null>(null);

  showForm = signal<boolean>(false);
  creating = signal<boolean>(false);
  newTitle = '';
  newAmount = '';

  recordsList = new PagedList<SampleRecord>(
    (page) => this.sampleRecords.getRecords(page - 1, this.size),
    (err) => this.error.set(apiMessage(this.i18n, err))
  );

  ngOnInit() {
    this.recordsList.load(true);
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
        this.recordsList.load(true);
      },
      error: err => {
        this.creating.set(false);
        this.error.set(apiMessage(this.i18n, err));
      }
    });
  }
}
