import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  WorkflowTemplateService,
  QueryWorkflowTemplateParams,
  WorkflowTemplateListResponse,
} from './workflow-template.service';

export const workflowTemplateListResolver: ResolveFn<WorkflowTemplateListResponse | null> = (
  route: ActivatedRouteSnapshot,
): Observable<WorkflowTemplateListResponse | null> => {
  const service = inject(WorkflowTemplateService);

  const search = route.paramMap.get('search') || '';
  const page = parseInt(route.paramMap.get('page') || '1', 10);
  const limit = parseInt(route.paramMap.get('limit') || '100', 10);

  const params: QueryWorkflowTemplateParams = {
    page,
    limit,
    sortField: 'createdAt',
    sortOrder: 'desc',
  };

  if (search && search !== '-') {
    params.q = search;
  }

  return service.getTemplates(params).pipe(
    map((response: { items: any[]; total: number; page: number; limit: number }) => ({
      items: response.items,
      page: response.page,
      limit: response.limit,
      total: response.total,
      totalPages: Math.ceil(response.total / response.limit),
    })),
    catchError((error: any) => {
      console.error('Failed to load workflow templates:', error);
      return of(null);
    }),
  );
};
