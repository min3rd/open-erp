import { WorkflowStepStatus } from '../services/wms/wms.types';

/**
 * Receipt Workflow Constants
 * Shared UI helpers and default configuration for receipt workflow management
 */

/** Default workflow step definitions */
export const DEFAULT_WORKFLOW_STEPS: ReadonlyArray<{
  key: string;
  label: string;
}> = [
  { key: 'created', label: 'Created' },
  { key: 'pending_approval', label: 'Pending Approval' },
  { key: 'approved', label: 'Approved' },
  { key: 'receiving', label: 'Receiving' },
  { key: 'qc_check', label: 'QC Check' },
  { key: 'qc_approved', label: 'QC Approved' },
  { key: 'putaway', label: 'Putaway' },
  { key: 'completed', label: 'Completed' },
];

/** Map workflow step status to PrimeNG p-tag severity */
export function getWorkflowStepSeverity(
  status: string,
): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
  switch (status) {
    case WorkflowStepStatus.COMPLETED:
      return 'success';
    case WorkflowStepStatus.IN_PROGRESS:
      return 'info';
    case WorkflowStepStatus.REJECTED:
      return 'danger';
    default:
      return 'secondary';
  }
}

/** Map workflow step status to PrimeNG icon class */
export function getWorkflowStepIcon(status: string): string {
  switch (status) {
    case WorkflowStepStatus.COMPLETED:
      return 'pi pi-check-circle';
    case WorkflowStepStatus.IN_PROGRESS:
      return 'pi pi-spin pi-spinner';
    case WorkflowStepStatus.REJECTED:
      return 'pi pi-times-circle';
    case WorkflowStepStatus.SKIPPED:
      return 'pi pi-forward';
    default:
      return 'pi pi-circle';
  }
}

/** Map workflow step status to CSS color variable */
export function getWorkflowStepColor(status: string): string {
  switch (status) {
    case WorkflowStepStatus.COMPLETED:
      return 'var(--p-green-500)';
    case WorkflowStepStatus.IN_PROGRESS:
      return 'var(--p-blue-500)';
    case WorkflowStepStatus.REJECTED:
      return 'var(--p-red-500)';
    default:
      return 'var(--p-surface-400)';
  }
}

/** Map QC status to PrimeNG p-tag severity */
export function getQcStatusSeverity(
  status: string,
): 'success' | 'warn' | 'danger' | 'info' | 'secondary' {
  switch (status) {
    case 'passed':
      return 'success';
    case 'failed':
      return 'danger';
    case 'partial':
      return 'warn';
    default:
      return 'secondary';
  }
}
