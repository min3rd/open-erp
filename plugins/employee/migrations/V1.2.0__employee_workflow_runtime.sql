-- Sprint 08 / ADR-S08-004 (phương án C): employee change-request runtime moves
-- to the shared workflow engine. The header keeps its employee identity and
-- mirrors engine progress; the legacy approval_config / change_request_steps
-- tables stay in place (deprecated, dropped in a later release after verify).

ALTER TABLE plg_employee_change_requests
    ADD COLUMN IF NOT EXISTS workflow_instance_id UUID;

CREATE INDEX IF NOT EXISTS idx_employee_change_requests_workflow
    ON plg_employee_change_requests (workflow_instance_id)
    WHERE workflow_instance_id IS NOT NULL;
