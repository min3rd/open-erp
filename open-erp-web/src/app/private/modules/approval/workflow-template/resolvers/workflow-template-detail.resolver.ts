import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  WorkflowTemplateService,
  WorkflowTemplate,
} from '../../../../../../core/services/workflow-template/workflow-template.service';

export const workflowTemplateDetailResolver: ResolveFn<WorkflowTemplate | null> = (
  route: ActivatedRouteSnapshot,
): Observable<WorkflowTemplate | null> => {
  const service = inject(WorkflowTemplateService);
  const id = route.paramMap.get('id');

  if (!id) {
    return of(null);
  }

  return service.getTemplateById(id).pipe(
    catchError((error: any) => {
      console.error('Failed to load workflow template:', error);
      return of(null);
    }),
  );
};
