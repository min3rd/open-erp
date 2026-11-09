import { Injectable, inject, signal } from '@angular/core';
import { API_BASE_URL, ApiResponse, ApiService, ListData } from '@shared';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface WorkflowDefinition {
  id: string;
  key: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  document?: { nodes: Record<string, unknown>[] };
  created_at?: string;
  published_at?: string;
}

export interface WorkflowInstance {
  id: string;
  definition_id: string;
  definition_version: number;
  status: 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  outcome?: string;
  trigger_type: string;
  source_ref?: Record<string, unknown>;
  created_at?: string;
  completed_at?: string;
}

export interface WorkflowTask {
  id: string;
  instance_id: string;
  node_id: string;
  node_type: string;
  status: string;
  approval_mode: string;
  assignees: string[];
  candidates: string[];
  due_at?: string;
  overdue_at?: string;
}

export interface InstanceProgress {
  instance: WorkflowInstance;
  tasks: WorkflowTask[];
  events?: WorkflowEvent[];
}

export interface WorkflowEvent {
  id: string;
  instance_id: string;
  task_id?: string;
  event: string;
  actor_user_id?: string;
  payload?: Record<string, unknown>;
  created_at?: string;
}

export interface TenantUserOption {
  user_id?: string;
  id?: string;
  email: string;
  full_name?: string;
  name?: string;
  status?: string;
  roles?: string[];
}

export interface TenantRoleOption {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_system?: boolean;
}

export interface FormLookupItem {
  id: string;
  slug: string;
  title_text: string;
  document?: {
    items?: Array<{ ref?: string; label?: string; type?: string }>;
  };
}

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private staticBase = inject(API_BASE_URL);
  private runtimeOrigin = signal('');

  setRuntimeOrigin(origin: string): void {
    this.runtimeOrigin.set((origin ?? '').replace(/\/$/, ''));
  }

  private url(path: string): string {
    const prefix = this.staticBase || (this.runtimeOrigin() + '/api/v1/plugins/runtime/workflow');
    return `${prefix}${path}`;
  }

  private coreUrl(path: string): string {
    const base = this.runtimeOrigin() || this.staticBase || '';
    return `${base}${path}`;
  }

  definitions(): Observable<ApiResponse<ListData<WorkflowDefinition>>> {
    return this.api.get<ListData<WorkflowDefinition>>(this.url('/api/v1/workflow/definitions'));
  }

  getDefinition(id: string): Observable<ApiResponse<WorkflowDefinition>> {
    return this.api.get<WorkflowDefinition>(this.url(`/api/v1/workflow/definitions/${id}`));
  }

  createDefinition(
    key: string,
    document: Record<string, unknown>,
  ): Observable<ApiResponse<WorkflowDefinition>> {
    return this.api.post<WorkflowDefinition>(this.url('/api/v1/workflow/definitions'), {
      key,
      document,
    });
  }

  publishDefinition(id: string): Observable<ApiResponse<WorkflowDefinition>> {
    return this.api.post<WorkflowDefinition>(
      this.url(`/api/v1/workflow/definitions/${id}/publish`),
      {},
    );
  }

  instances(): Observable<ApiResponse<ListData<WorkflowInstance>>> {
    return this.api.get<ListData<WorkflowInstance>>(this.url('/api/v1/workflow/instances'));
  }

  inbox(scope: 'MINE' | 'ALL' = 'MINE'): Observable<ApiResponse<ListData<WorkflowTask>>> {
    return this.api.get<ListData<WorkflowTask>>(
      this.url(`/api/v1/workflow/tasks/inbox?scope=${scope}`),
    );
  }

  progress(instanceId: string): Observable<ApiResponse<InstanceProgress>> {
    return this.api.get<InstanceProgress>(
      this.url(`/api/v1/workflow/instances/${instanceId}`),
    );
  }

  act(
    taskId: string,
    actorUserId: string,
    action: string,
    comment: string,
    targetStepNodeId?: string,
    targetUserId?: string,
  ): Observable<ApiResponse<WorkflowTask>> {
    return this.api.post<WorkflowTask>(
      this.url(`/api/v1/workflow/tasks/${taskId}/actions`),
      {
        actor_user_id: actorUserId,
        action,
        comment,
        target_step_node_id: targetStepNodeId ?? '',
        target_user_id: targetUserId ?? '',
      },
    );
  }

  openInstance(
    definitionKey: string,
    context: Record<string, unknown>,
  ): Observable<ApiResponse<WorkflowInstance>> {
    const base = this.runtimeOrigin() || this.staticBase || '';
    return this.http.post<ApiResponse<WorkflowInstance>>(
      `${base}/api/v1/plugins/runtime/workflow/api/v1/workflow/internal/instances`,
      { definition_key: definitionKey, context },
    );
  }

  // ---- Directory & Cross-Plugin Lookup for Searchable Pickers (Zero Raw UUIDs) ----

  listTenantUsers(keyword = ''): Observable<ApiResponse<ListData<TenantUserOption>>> {
    const q = keyword ? `&keyword=${encodeURIComponent(keyword)}` : '';
    return this.api.get<ListData<TenantUserOption>>(
      this.coreUrl(`/api/v1/iam/users?page=0&size=100${q}`),
    );
  }

  listTenantRoles(): Observable<ApiResponse<ListData<TenantRoleOption>>> {
    return this.api.get<ListData<TenantRoleOption>>(
      this.coreUrl('/api/v1/iam/roles?page=0&size=100'),
    );
  }

  listForms(): Observable<ApiResponse<ListData<FormLookupItem>>> {
    return this.api.get<ListData<FormLookupItem>>(
      this.coreUrl('/api/v1/plugins/runtime/form/api/v1/form/forms'),
    );
  }
}
