import {
  Component,
  ElementRef,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { JsonPipe } from '@angular/common';
import { TranslatePipe } from '@shared';
import { FormDefinition, FormItem, FormOption } from './form.model';
import { FormService } from './form.service';

interface PluginContext {
  theme?: string;
  language?: string;
  permissions?: string[];
  navigate?: (path: string) => void;
  notify?: (message: string) => void;
}

/**
 * Form builder + response admin (route /apps/form). Tabs follow DES-UI-S08-001
 * §2: forms list, builder (split view), responses, summary — high density,
 * sharp edges, drawers for edit, no modals.
 */
@Component({
  selector: 'app-form-screen',
  standalone: true,
  imports: [FormsModule, JsonPipe, TranslatePipe],
  templateUrl: './form-screen.component.html',
})
export class FormScreenComponent implements OnInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private api = inject(FormService);

  @Input() context: PluginContext | null = null;
  @Input() route = '';

  readonly tab = signal<'forms' | 'builder' | 'responses' | 'summary'>('forms');
  readonly forms = signal<FormDefinition[]>([]);
  readonly selected = signal<FormDefinition | null>(null);
  readonly builderDocument = signal<string>('');
  readonly responses = signal<Record<string, unknown>[]>([]);
  readonly summary = signal<Record<string, unknown> | null>(null);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly slugInput = signal('');
  readonly titleInput = signal('');

  ngOnInit(): void {
    const origin = this.host.nativeElement.getAttribute('runtime-origin');
    if (origin) {
      this.api.setRuntimeOrigin(origin);
    }
    this.reload();
  }

  setTab(tab: 'forms' | 'builder' | 'responses' | 'summary'): void {
    this.tab.set(tab);
    const form = this.selected();
    if (!form) {
      return;
    }
    if (tab === 'responses') {
      this.api.responses(form.id).subscribe((result) => {
        this.responses.set((result.data?.items ?? []) as unknown as Record<string, unknown>[]);
      });
    }
    if (tab === 'summary') {
      this.api.summary(form.id).subscribe((result) => {
        this.summary.set((result.data ?? null) as unknown as Record<string, unknown>);
      });
    }
  }

  reload(): void {
    this.api.list().subscribe({
      next: (result) => this.forms.set(result.data?.items ?? []),
      error: () => this.error.set('PLUGIN_FORM_ERROR_LOAD'),
    });
  }

  openBuilder(form: FormDefinition | null): void {
    if (!form) {
      this.selected.set(null);
      this.slugInput.set('');
      this.titleInput.set('');
      this.builderDocument.set(JSON.stringify({ items: [blankSection()] }, null, 2));
      this.setTab('builder');
      return;
    }
    // The list payload omits the document — fetch the full definition so the
    // builder never shows (or worse, saves over) an empty items array.
    this.api.get(form.id).subscribe({
      next: (result) => {
        const full = result.data ?? form;
        this.selected.set(full);
        this.slugInput.set(full.slug);
        this.titleInput.set(full.title_text ?? '');
        this.builderDocument.set(JSON.stringify(full.document ?? { items: [] }, null, 2));
        this.setTab('builder');
      },
      error: () => this.error.set('PLUGIN_FORM_ERROR_LOAD'),
    });
  }

  save(): void {
    const existing = this.selected();
    let document: Record<string, unknown>;
    try {
      document = JSON.parse(this.builderDocument()) as Record<string, unknown>;
    } catch {
      this.error.set('PLUGIN_FORM_ERROR_JSON');
      return;
    }
    const payload = {
      slug: this.slugInput(),
      title: this.titleInput(),
      description: '',
      document,
    };
    this.busy.set(true);
    this.error.set('');
    const request$ = existing
      ? this.api.update(existing.id, payload)
      : this.api.create(payload);
    request$.subscribe({
      next: (result) => {
        this.busy.set(false);
        this.selected.set(result.data ?? null);
        this.context?.notify?.('PLUGIN_FORM_SAVED');
        this.reload();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.code ?? 'PLUGIN_FORM_ERROR_SAVE');
      },
    });
  }

  publish(): void {
    const form = this.selected();
    if (!form) {
      return;
    }
    this.api.publish(form.id, { captcha: form.captcha ?? 'none' }).subscribe({
      next: (result) => {
        this.selected.set(result.data ?? form);
        this.context?.notify?.('PLUGIN_FORM_PUBLISHED');
        this.reload();
      },
      error: (err) => this.error.set(err?.error?.code ?? 'PLUGIN_FORM_ERROR_SAVE'),
    });
  }

  close(): void {
    const form = this.selected();
    if (!form) {
      return;
    }
    this.api.close(form.id).subscribe({
      next: (result) => {
        this.selected.set(result.data ?? form);
        this.reload();
      },
    });
  }

  summaryEntries(): [string, unknown][] {
    const summary = this.summary();
    if (!summary) {
      return [];
    }
    const entries: [string, unknown][] = [];
    const counts = (summary['choice_counts'] ?? {}) as Record<string, number>;
    for (const [key, value] of Object.entries(counts)) {
      entries.push([key, value]);
    }
    const averages = (summary['numeric_averages'] ?? {}) as Record<string, number>;
    for (const [key, value] of Object.entries(averages)) {
      entries.push([key, value]);
    }
    return entries;
  }

  canManage(): boolean {
    return (this.context?.permissions ?? []).includes('form:definition:manage');
  }
}

function blankSection(): { items: FormItem[] } {
  return {
    items: [
      {
        type: 'SECTION',
        title: 'PLUGIN_FORM_DEFAULT_SECTION',
      },
      {
        type: 'SHORT_TEXT',
        ref: 'question_1',
        label: 'PLUGIN_FORM_DEFAULT_QUESTION',
        required: true,
      },
    ],
  };
}

// Re-export for template typing convenience.
export type { FormOption };
