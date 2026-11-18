CREATE TABLE IF NOT EXISTS plg_office_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_extension VARCHAR(16) NOT NULL,
    doc_type VARCHAR(24) NOT NULL,
    mime_type VARCHAR(128) NOT NULL DEFAULT 'application/octet-stream',
    size_bytes BIGINT NOT NULL DEFAULT 0,
    storage_key VARCHAR(512) NOT NULL DEFAULT '',
    checksum_sha256 VARCHAR(64) NOT NULL DEFAULT '',
    current_version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(24) NOT NULL DEFAULT 'ACTIVE',
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT ck_office_doc_type CHECK (doc_type IN ('WORD', 'EXCEL', 'POWERPOINT', 'CSV', 'PDF')),
    CONSTRAINT ck_office_doc_status CHECK (status IN ('ACTIVE', 'ARCHIVED', 'DELETED'))
);

CREATE INDEX IF NOT EXISTS idx_office_docs_tenant_status_updated
    ON plg_office_documents (tenant_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_office_docs_tenant_type
    ON plg_office_documents (tenant_id, doc_type, status);

CREATE INDEX IF NOT EXISTS idx_office_docs_tenant_title
    ON plg_office_documents (tenant_id, LOWER(title));
