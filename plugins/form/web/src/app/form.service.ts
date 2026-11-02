import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL, ApiResponse, ApiService, ListData } from '@shared';
import { FormDefinition, FormResponse, FormSummary } from './form.model';

@Injectable({ providedIn: 'root' })
export class FormService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private staticBase = inject(API_BASE_URL);
  private runtimeOrigin = signal('');

  setRuntimeOrigin(origin: string): void {
    this.runtimeOrigin.set((origin ?? '').replace(/\/$/, ''));
  }

  private url(path: string): string {
    const prefix = this.staticBase || (this.runtimeOrigin() + '/api/v1/plugins/runtime/form');
    return `${prefix}${path}`;
  }

  list(): Observable<ApiResponse<ListData<FormDefinition>>> {
    return this.api.get<ListData<FormDefinition>>(this.url('/api/v1/form/forms'));
  }

  get(id: string): Observable<ApiResponse<FormDefinition>> {
    return this.api.get<FormDefinition>(this.url(`/api/v1/form/forms/${id}`));
  }

  create(payload: Record<string, unknown>): Observable<ApiResponse<FormDefinition>> {
    return this.api.post<FormDefinition>(this.url('/api/v1/form/forms'), payload);
  }

  update(id: string, payload: Record<string, unknown>): Observable<ApiResponse<FormDefinition>> {
    return this.api.put<FormDefinition>(this.url(`/api/v1/form/forms/${id}`), payload);
  }

  publish(
    id: string,
    options: { captcha?: string; close_at?: string; response_limit?: number } = {},
  ): Observable<ApiResponse<FormDefinition>> {
    const params = new URLSearchParams();
    if (options.captcha) params.set('captcha', options.captcha);
    if (options.close_at) params.set('close_at', options.close_at);
    if (options.response_limit != null) {
      params.set('response_limit', String(options.response_limit));
    }
    const query = params.toString();
    return this.api.post<FormDefinition>(
      this.url(`/api/v1/form/forms/${id}/publish${query ? `?${query}` : ''}`),
      {},
    );
  }

  close(id: string): Observable<ApiResponse<FormDefinition>> {
    return this.api.post<FormDefinition>(this.url(`/api/v1/form/forms/${id}/close`), {});
  }

  responses(formId: string): Observable<ApiResponse<ListData<FormResponse>>> {
    return this.api.get<ListData<FormResponse>>(
      this.url(`/api/v1/form/forms/${formId}/responses`),
    );
  }

  summary(formId: string): Observable<ApiResponse<FormSummary>> {
    return this.api.get<FormSummary>(this.url(`/api/v1/form/forms/${formId}/summary`));
  }

  // ---- Public (anonymous) fill surface -----------------------------

  publicView(slug: string, token: string): Observable<ApiResponse<Record<string, unknown>>> {
    const base = this.runtimeOrigin() || this.staticBase || '';
    return this.http.get<ApiResponse<Record<string, unknown>>>(
      `${base}/api/v1/plugins/runtime/form/api/v1/form/public/forms/${slug}?plugin_token=${encodeURIComponent(token)}`,
    );
  }

  publicSubmit(
    slug: string,
    token: string,
    payload: { answers: Record<string, unknown>; responder_email?: string; idempotency_key: string },
  ): Observable<ApiResponse<FormResponse>> {
    const base = this.runtimeOrigin() || this.staticBase || '';
    return this.http.post<ApiResponse<FormResponse>>(
      `${base}/api/v1/plugins/runtime/form/api/v1/form/public/forms/${slug}/responses?plugin_token=${encodeURIComponent(token)}`,
      payload,
    );
  }
}
