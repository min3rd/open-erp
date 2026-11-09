import {
  Component,
  ElementRef,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  I18nService,
  IconComponent,
  SharpButtonComponent,
  TranslatePipe,
} from '@shared';
import { FormDocument, FormItem } from './form.model';
import { FormService } from './form.service';

interface UploadedFile {
  file_id: string;
  url: string;
  original_name: string;
}

/**
 * Public fill renderer (op-form-fill, route /public/forms/{tenant}/{slug} —
 * ADR-S08-003). Renders the published document snapshot, applies forward-only
 * skip logic client-side and submits idempotently.
 */
@Component({
  selector: 'app-form-fill',
  standalone: true,
  imports: [FormsModule, TranslatePipe, IconComponent, SharpButtonComponent],
  templateUrl: './form-fill.component.html',
})
export class FormFillComponent implements OnInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private api = inject(FormService);
  private i18n = inject(I18nService);

  @Input() formSlug = '';
  @Input() tenantSlug = '';
  @Input() pluginToken = '';

  readonly title = signal('');
  readonly description = signal('');
  readonly items = signal<FormItem[]>([]);
  readonly answers = signal<Record<string, unknown>>({});
  readonly visibleRefs = signal<Set<string>>(new Set());
  readonly submitted = signal<string>('');
  readonly error = signal('');
  readonly busy = signal(false);
  readonly loading = signal(true);
  readonly forceSubmit = signal(false);
  readonly email = signal('');
  readonly invalidRefs = signal<Set<string>>(new Set());
  readonly uploadingRef = signal('');
  readonly fileError = signal('');

  ngOnInit(): void {
    if (!this.formSlug) {
      this.formSlug = this.host.nativeElement.getAttribute('form-slug') ?? '';
    }
    if (!this.pluginToken) {
      this.pluginToken = this.host.nativeElement.getAttribute('plugin-token') ?? '';
    }
    // BUG-177 fix: the public page has no plugin-host i18n bootstrap — load the
    // dictionary from the plugin runtime path and register it with the shared
    // service before rendering translated labels.
    void this.loadDictionary().then(() => {
      this.api.publicView(this.formSlug, this.pluginToken).subscribe({
        next: (result) => {
          const data = (result.data ?? {}) as Record<string, unknown>;
          this.title.set(String(data['title'] ?? ''));
          this.description.set(String(data['description'] ?? ''));
          const document = (data['document'] ?? { items: [] }) as FormDocument;
          this.items.set(document.items ?? []);
          this.recomputeVisibility();
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.code ?? 'PLUGIN_FORM_FILL_UNAVAILABLE');
        },
      });
    });
  }

  private async loadDictionary(): Promise<void> {
    const lang = (navigator.language || 'vi').startsWith('vi') ? 'vi' : 'en';
    try {
      // The public page is served from the core origin, so a root-relative
      // runtime path reaches the plugin bundle's dictionaries.
      const response = await fetch(
        `/api/v1/plugins/runtime/form/i18n/${lang}.json?plugin_token=${encodeURIComponent(this.pluginToken)}`,
      );
      if (response.ok) {
        this.i18n.setDictionary(lang as never, await response.json());
        this.i18n.setLanguage(lang as never);
      }
    } catch {
      // Labels fall back to keys; the form stays functional.
    }
  }

  isContainer(item: FormItem): boolean {
    return item.type === 'SECTION' || item.type === 'PAGE' || item.type === 'STEP';
  }

  readonly visibleQuestions = computed(() =>
    this.items().filter((item) => !this.isContainer(item) && this.isVisible(item)),
  );

  readonly answeredCount = computed(
    () => this.visibleQuestions().filter((item) => this.hasAnswer(item)).length,
  );

  readonly progressPercent = computed(() => {
    const total = this.visibleQuestions().length;
    return total === 0 ? 0 : Math.round((this.answeredCount() / total) * 100);
  });

  recomputeVisibility(): void {
    const answers = this.answers();
    const visible = new Set<string>();
    let forceSubmit = false;
    for (const item of this.items()) {
      if (this.isContainer(item)) {
        continue;
      }
      const ref = item.ref ?? '';
      visible.add(ref);
      const chosen = item.options?.find((option) => option.value === answers[ref]);
      if (chosen?.logic) {
        if (chosen.logic.action === 'SUBMIT_FORM') {
          forceSubmit = true;
        }
        // GOTO_REF: hide everything strictly between this item and the target
        // (forward-only by validation); the target itself stays visible.
        const targetIndex = this.items().findIndex(
          (candidate) => candidate.ref === chosen.logic?.goto_ref,
        );
        const currentIndex = this.items().indexOf(item);
        if (targetIndex > currentIndex) {
          for (let between = currentIndex + 1; between < targetIndex; between++) {
            const skipped = this.items()[between];
            if (skipped.ref) {
              visible.delete(skipped.ref);
            }
          }
        }
      }
    }
    this.visibleRefs.set(visible);
    this.forceSubmit.set(forceSubmit);
  }

  isVisible(item: FormItem): boolean {
    return !item.ref || this.visibleRefs().has(item.ref);
  }

  setAnswer(ref: string, value: unknown): void {
    this.answers.set({ ...this.answers(), [ref]: value });
    this.recomputeVisibility();
  }

  answerOf(item: FormItem): unknown {
    return item.ref ? this.answers()[item.ref] : undefined;
  }

  textAnswer(item: FormItem): string {
    const value = this.answerOf(item);
    return value == null ? '' : String(value);
  }

  isSelected(item: FormItem, optionValue: string): boolean {
    return this.answerOf(item) === optionValue;
  }

  isMultiSelected(item: FormItem, optionValue: string): boolean {
    const value = this.answerOf(item);
    return Array.isArray(value) && value.includes(optionValue);
  }

  toggleMulti(item: FormItem, optionValue: string, checked: boolean): void {
    if (!item.ref) {
      return;
    }
    const current = this.answerOf(item);
    const values = Array.isArray(current) ? [...(current as string[])] : [];
    const next = checked
      ? [...new Set([...values, optionValue])]
      : values.filter((entry) => entry !== optionValue);
    this.setAnswer(item.ref, next);
  }

  matrixValue(item: FormItem, row: string): string {
    const value = this.answerOf(item);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return '';
    }
    return String((value as Record<string, unknown>)[row] ?? '');
  }

  setMatrix(item: FormItem, row: string, column: string): void {
    if (!item.ref) {
      return;
    }
    const current = this.answerOf(item);
    const matrix =
      current && typeof current === 'object' && !Array.isArray(current)
        ? { ...(current as Record<string, string>) }
        : {};
    matrix[row] = column;
    this.setAnswer(item.ref, matrix);
  }

  ratingMax(item: FormItem): number {
    const points = Number(item.grading?.points ?? 5);
    return Number.isFinite(points) && points > 0 ? Math.min(Math.round(points), 10) : 5;
  }

  ratingStars(item: FormItem): number[] {
    return Array.from({ length: this.ratingMax(item) }, (_, index) => index + 1);
  }

  ratingValue(item: FormItem): number {
    const value = Number(this.answerOf(item));
    return Number.isFinite(value) ? value : 0;
  }

  setRating(item: FormItem, value: number): void {
    if (item.ref) {
      this.setAnswer(item.ref, value);
    }
  }

  uploadedFiles(item: FormItem): UploadedFile[] {
    const value = this.answerOf(item);
    return Array.isArray(value) ? (value as UploadedFile[]) : [];
  }

  onFilesSelected(item: FormItem, event: Event): void {
    if (!item.ref) {
      return;
    }
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    if (files.length === 0) {
      return;
    }
    const maxFiles = Number(item.file_limits?.max_files ?? 3);
    const maxBytes = Number(item.file_limits?.max_size_mb ?? 10) * 1024 * 1024;
    const current = this.uploadedFiles(item);
    this.fileError.set('');
    if (current.length + files.length > maxFiles) {
      this.fileError.set('PLUGIN_FORM_FILE_TOO_MANY');
      return;
    }
    const oversized = files.find((file) => file.size > maxBytes);
    if (oversized) {
      this.fileError.set('PLUGIN_FORM_FILE_TOO_LARGE');
      return;
    }
    this.uploadingRef.set(item.ref);
    forkJoin(files.map((file) => this.api.publicUpload(this.formSlug, this.pluginToken, file))).subscribe({
      next: (results) => {
        const uploaded = results
          .map((result) => result.data)
          .filter((entry): entry is UploadedFile => !!entry);
        this.setAnswer(item.ref as string, [...current, ...uploaded]);
        this.uploadingRef.set('');
      },
      error: () => {
        this.uploadingRef.set('');
        this.fileError.set('PLUGIN_FORM_FILL_SUBMIT_FAILED');
      },
    });
  }

  removeFile(item: FormItem, index: number): void {
    if (!item.ref) {
      return;
    }
    const next = this.uploadedFiles(item).filter((_, position) => position !== index);
    this.setAnswer(item.ref, next);
  }

  hasAnswer(item: FormItem): boolean {
    const value = this.answerOf(item);
    if (value == null || value === '') {
      return false;
    }
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length > 0;
    }
    return true;
  }

  isInvalid(item: FormItem): boolean {
    return !!item.ref && this.invalidRefs().has(item.ref);
  }

  submit(): void {
    const missing = this.visibleQuestions().filter((item) => item.required && !this.hasAnswer(item));
    if (missing.length > 0) {
      const missingRefs = new Set(missing.map((item) => item.ref as string));
      this.invalidRefs.set(missingRefs);
      this.error.set('PLUGIN_FORM_FILL_REQUIRED');
      const first = missing[0].ref;
      if (first) {
        document.getElementById(`fill-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    this.invalidRefs.set(new Set());
    const answers: Record<string, unknown> = {};
    for (const item of this.visibleQuestions()) {
      if (item.ref && this.hasAnswer(item)) {
        answers[item.ref] = this.answerOf(item);
      }
    }
    this.busy.set(true);
    this.error.set('');
    const idempotencyKey =
      'fill:' + this.formSlug + ':' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    const email = this.email().trim();
    this.api
      .publicSubmit(this.formSlug, this.pluginToken, {
        answers,
        responder_email: email || undefined,
        idempotency_key: idempotencyKey,
      })
      .subscribe({
        next: (result) => {
          this.busy.set(false);
          this.submitted.set(result.data?.id ?? '');
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(err?.error?.code ?? err?.code ?? 'PLUGIN_FORM_FILL_SUBMIT_FAILED');
        },
      });
  }
}
