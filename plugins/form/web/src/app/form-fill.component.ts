import {
  Component,
  ElementRef,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { I18nService, TranslatePipe } from '@shared';
import { FormDocument, FormItem } from './form.model';
import { FormService } from './form.service';

/**
 * Public fill renderer (op-form-fill, route /public/forms/{tenant}/{slug} —
 * ADR-S08-003). Renders the published document snapshot, applies forward-only
 * skip logic client-side and submits idempotently.
 */
@Component({
  selector: 'app-form-fill',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
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
        },
        error: () => this.error.set('PLUGIN_FORM_FILL_UNAVAILABLE'),
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

  recomputeVisibility(): void {
    const answers = this.answers();
    const visible = new Set<string>();
    let forceSubmit = false;
    for (const item of this.items()) {
      if (item.type === 'SECTION') {
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

  readonly forceSubmit = signal(false);

  isVisible(item: FormItem): boolean {
    return !item.ref || this.visibleRefs().has(item.ref);
  }

  submit(): void {
    const answers: Record<string, unknown> = {};
    for (const item of this.items()) {
      if (item.type !== 'SECTION' && item.ref && this.isVisible(item)) {
        const value = this.answers()[item.ref];
        if (value !== undefined && value !== '') {
          answers[item.ref] = value;
        }
      }
    }
    this.busy.set(true);
    this.error.set('');
    const idempotencyKey =
      'fill:' + this.formSlug + ':' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    this.api
      .publicSubmit(this.formSlug, this.pluginToken, {
        answers,
        idempotency_key: idempotencyKey,
      })
      .subscribe({
        next: (result) => {
          this.busy.set(false);
          this.submitted.set(result.data?.id ?? '');
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(err?.error?.code ?? 'PLUGIN_FORM_FILL_SUBMIT_FAILED');
        },
      });
  }
}
