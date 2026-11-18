CREATE TABLE IF NOT EXISTS plg_office_document_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    document_id UUID NOT NULL,
    subject_type VARCHAR(16) NOT NULL,
    subject_id UUID NOT NULL,
    permission VARCHAR(8) NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_office_doc_permission UNIQUE (tenant_id, document_id, subject_type, subject_id),
    CONSTRAINT ck_office_permission_subject CHECK (subject_type IN ('USER', 'ROLE')),
    CONSTRAINT ck_office_permission_level CHECK (permission IN ('READ', 'WRITE'))
);

CREATE INDEX IF NOT EXISTS idx_office_permissions_subject
    ON plg_office_document_permissions (tenant_id, subject_type, subject_id);
