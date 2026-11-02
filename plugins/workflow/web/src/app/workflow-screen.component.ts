import {
  Component,
  ElementRef,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@shared';
import {
  InstanceProgress,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowService,
  WorkflowTask,
} from './workflow.service';

interface PluginContext {
  theme?: string;
  language?: string;
  permissions?: string[];
  userId?: string;
  notify?: (message: string) => void;
}

/**
 * Workflow screen (route /apps/workflow): inbox ("Việc của tôi") with claim and
 * approve/reject/return actions in drawers, flows list + builder, runs with
 * event-log timeline (DES-UI-S08-001 §4).
 */
@Component({
  selector: 'app-workflow-screen',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './workflow-screen.component.html',
})
export class WorkflowScreenComponent implements OnInit {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private api = inject(WorkflowService);

  @Input() context: PluginContext | null = null;
  @Input() route = '';

  readonly tab = signal<'inbox' | 'flows' | 'runs'>('inbox');
  readonly tasks = signal<WorkflowTask[]>([]);
  readonly definitions = signal<WorkflowDefinition[]>([]);
  readonly instances = signal<WorkflowInstance[]>([]);
  readonly selectedRun = signal<InstanceProgress | null>(null);
  readonly selectedTask = signal<WorkflowTask | null>(null);
  readonly comment = signal('');
  readonly documentDraft = signal('');
  readonly definitionKey = signal('');
  readonly busy = signal(false);
  readonly error = signal('');

  ngOnInit(): void {
    const origin = this.host.nativeElement.getAttribute('runtime-origin');
    if (origin) {
      this.api.setRuntimeOrigin(origin);
    }
    this.loadInbox();
  }

  setTab(tab: 'inbox' | 'flows' | 'runs'): void {
    this.tab.set(tab);
    if (tab === 'inbox') {
      this.loadInbox();
    } else if (tab === 'flows') {
      this.loadFlows();
    } else {
      this.loadRuns();
    }
  }

  loadInbox(): void {
    this.api.inbox('MINE').subscribe({
      next: (result) => this.tasks.set(result.data?.items ?? []),
      error: () => this.error.set('PLUGIN_WORKFLOW_ERROR_INBOX'),
    });
  }

  loadFlows(): void {
    this.api.definitions().subscribe({
      next: (result) => this.definitions.set(result.data?.items ?? []),
    });
  }

  loadRuns(): void {
    this.api.instances().subscribe({
      next: (result) => this.instances.set(result.data?.items ?? []),
    });
  }

  openTask(task: WorkflowTask): void {
    this.selectedTask.set(task);
    this.comment.set('');
  }

  act(action: 'APPROVE' | 'REJECT' | 'CLAIM'): void {
    const task = this.selectedTask();
    const userId = this.context?.userId;
    if (!task || !userId) {
      this.error.set('PLUGIN_WORKFLOW_ERROR_NO_USER');
      return;
    }
    if (action === 'REJECT' && !this.comment().trim()) {
      this.error.set('PLUGIN_WORKFLOW_REASON_REQUIRED');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.api
      .act(task.id, userId, action, this.comment())
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.selectedTask.set(null);
          this.context?.notify?.('PLUGIN_WORKFLOW_ACTION_DONE');
          this.loadInbox();
        },
        error: (err) => {
          this.busy.set(false);
          this.error.set(err?.error?.code ?? 'PLUGIN_WORKFLOW_ERROR_ACTION');
        },
      });
  }

  openRun(instance: WorkflowInstance): void {
    this.api.progress(instance.id).subscribe({
      next: (result) => this.selectedRun.set(result.data ?? null),
    });
  }

  saveFlow(): void {
    let document: Record<string, unknown>;
    try {
      document = JSON.parse(this.documentDraft()) as Record<string, unknown>;
    } catch {
      this.error.set('PLUGIN_WORKFLOW_ERROR_JSON');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    this.api.createDefinition(this.definitionKey(), document).subscribe({
      next: () => {
        this.busy.set(false);
        this.loadFlows();
        this.context?.notify?.('PLUGIN_WORKFLOW_FLOW_SAVED');
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.code ?? 'PLUGIN_WORKFLOW_ERROR_SAVE');
      },
    });
  }

  publishFlow(definition: WorkflowDefinition): void {
    this.api.publishDefinition(definition.id).subscribe(() => this.loadFlows());
  }

  editFlow(definition: WorkflowDefinition): void {
    this.definitionKey.set(definition.key);
    this.documentDraft.set(JSON.stringify(definition.document ?? { nodes: [] }, null, 2));
  }

  eventsOf(run: InstanceProgress | null): [string, Record<string, unknown>][] {
    const events = (run?.events ?? []) as Record<string, unknown>[];
    return events.map((event, index) => [
      `${event['created_at'] ?? index} · ${event['event'] ?? ''}`,
      event,
    ]);
  }
}
