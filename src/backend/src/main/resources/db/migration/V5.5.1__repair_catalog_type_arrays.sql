-- V5.5.1: repair catalog type arrays written by the old fan-out (String[] was
-- stored as a single "[Ljava.lang.String;@..." element) and re-run the
-- allowed_parent_types -> catalog_type_relations backfill.
DO $$
DECLARE
    reference_schema text;
    target_schema text;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'tenant_00000000_catalog' AND table_name = 'catalog_types'
    ) THEN
        reference_schema := 'tenant_00000000_catalog';
    ELSE
        SELECT table_schema INTO reference_schema
        FROM information_schema.tables
        WHERE table_name = 'catalog_types'
          AND table_schema LIKE 'tenant\_%\_catalog'
        ORDER BY table_schema
        LIMIT 1;
    END IF;

    IF reference_schema IS NULL THEN
        RETURN;
    END IF;

    EXECUTE format(
        'CREATE TEMP TABLE catalog_ref_types ON COMMIT DROP AS
         SELECT code, allowed_relations, allowed_parent_types
         FROM %I.catalog_types WHERE tenant_id IS NULL', reference_schema);

    FOR target_schema IN
        SELECT table_schema FROM information_schema.tables
        WHERE table_name = 'catalog_types'
          AND table_schema LIKE 'tenant\_%\_catalog'
    LOOP
        EXECUTE format(
            'UPDATE %I.catalog_types t
             SET allowed_relations = r.allowed_relations,
                 allowed_parent_types = r.allowed_parent_types
             FROM catalog_ref_types r
             WHERE t.tenant_id IS NULL AND t.code = r.code
               AND (t.allowed_relations::text LIKE ''%%[Ljava.lang.String;%%''
                    OR t.allowed_parent_types::text LIKE ''%%[Ljava.lang.String;%%'')',
            target_schema);
        EXECUTE format(
            'INSERT INTO %I.catalog_type_relations (tenant_id, parent_type_id, child_type_id, relation_type)
             SELECT DISTINCT ON (c.tenant_id, c.id, p.code)
                    c.tenant_id, p.id, c.id, COALESCE(c.allowed_relations[1], ''HIERARCHY'')
             FROM %I.catalog_types c
             JOIN %I.catalog_types p ON p.code = ANY (c.allowed_parent_types)
             WHERE p.tenant_id IS NULL OR p.tenant_id = c.tenant_id
             ORDER BY c.tenant_id, c.id, p.code, (p.tenant_id IS NULL) ASC
             ON CONFLICT DO NOTHING',
            target_schema, target_schema, target_schema);
    END LOOP;
END $$;
