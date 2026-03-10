/**
 * Receipt workflow constants
 * Shared across backend services and used for workflow step configuration
 */

/** Entity type identifier for approval-flow integration */
export const ENTITY_TYPE_RECEIPT = 'receipt';

/** Default workflow step definitions for a receipt */
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

/** All valid workflow step keys */
export const WORKFLOW_STEP_KEYS = DEFAULT_WORKFLOW_STEPS.map((s) => s.key);

/**
 * Maps a workflow transition action to the step key it completes.
 * advanceStep() marks the given key as completed and sets the NEXT step to in_progress.
 */
export const WORKFLOW_ACTION_STEP_MAP: Record<string, string> = {
  approve: 'pending_approval',
  reject: 'pending_approval',
  receive: 'approved',
  qc_perform: 'receiving',
  qc_approve: 'qc_check',
  store: 'qc_approved',
  complete: 'putaway',
};
