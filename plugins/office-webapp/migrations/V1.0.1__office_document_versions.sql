CREATE TABLE IF NOT EXISTS plg_office_document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    document_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    storage_key VARCHAR(512) NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    change_note VARCHAR(255),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_office_doc_version UNIQUE (tenant_id, document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_office_doc_versions_doc
    ON plg_office_document_versions (tenant_id, document_id, version_number DESC);
