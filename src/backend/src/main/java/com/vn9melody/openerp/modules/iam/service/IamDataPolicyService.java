package com.vn9melody.openerp.modules.iam.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ApiFieldError;
import com.vn9melody.openerp.core.enums.DataOperation;
import com.vn9melody.openerp.core.enums.DataScope;
import com.vn9melody.openerp.core.security.PermissionInvalidationService;
import com.vn9melody.openerp.core.security.events.RolePermissionChangedEvent;
import com.vn9melody.openerp.modules.iam.model.Role;
import com.vn9melody.openerp.modules.iam.model.RoleDataPolicy;
import com.vn9melody.openerp.modules.iam.model.UserRole;
import com.vn9melody.openerp.modules.iam.repository.RoleDataPolicyRepository;
import com.vn9melody.openerp.modules.iam.repository.UserRoleRepository;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.DataPolicyInput;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.DataPolicyItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.DataPolicyOperationInput;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.DataResourceItem;
import com.vn9melody.openerp.modules.iam.service.IamRbacDtos.RoleDataPoliciesUpdateResponse;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.jboss.logging.Logger;

/**
 * Data-resource catalog (Entity Registry) and role × resource data-scope matrix
 * (FEAT-15, TASK-282).
 */
@ApplicationScoped
public class IamDataPolicyService {

    private static final Logger LOG = Logger.getLogger(IamDataPolicyService.class);

    private static final List<String> SCOPE_FIELD_ORDER =
        List.of("branch_id", "department_id", "created_by", "assignee_id");

    @Inject
    EntityManager entityManager;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    RoleDataPolicyRepository roleDataPolicyRepository;

    @Inject
    UserRoleRepository userRoleRepository;

    @Inject
    IamRoleService roleService;

    @Inject
    PermissionInvalidationService permissionInvalidationService;

    // ------------------------------------------------------------------
    // Data resource catalog
    // ------------------------------------------------------------------

    public List<DataResourceItem> listDataResources() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery(
                "select plugin_id, entity_name, table_or_collection, schema_definition->'fields' "
                    + "from sys_entity_registry "
                    + "where storage_type = 'postgres' "
                    + "and jsonb_exists(schema_definition->'fields', 'tenant_id') "
                    + "and jsonb_exists(schema_definition->'fields', 'created_by') "
                    + "order by plugin_id asc, entity_name asc")
            .getResultList();

        List<DataResourceItem> items = new ArrayList<>();
        for (Object[] row : rows) {
            String pluginId = row[0] != null ? row[0].toString() : null;
            String entityName = row[1] != null ? row[1].toString() : null;
            String tableName = row[2] != null ? row[2].toString() : null;
            String fieldsJson = row[3] != null ? row[3].toString() : "[]";
            if (entityName == null) {
                continue;
            }
            Set<String> fields = parseFields(fieldsJson);
            List<String> scopeFields = SCOPE_FIELD_ORDER.stream().filter(fields::contains).toList();
            items.add(new DataResourceItem(
                toResourceCode(entityName),
                entityName,
                tableName,
                pluginId,
                fields.contains("assignee_id"),
                scopeFields
            ));
        }
        return items;
    }

    private Set<String> parseFields(String json) {
        try {
            String[] values = objectMapper.readValue(json, String[].class);
            return new LinkedHashSet<>(List.of(values));
        } catch (Exception e) {
            LOG.warnf("Unable to parse Entity Registry schema_definition fields: %s", e.getMessage());
            return Set.of();
        }
    }

    static String toResourceCode(String entityName) {
        return entityName.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toUpperCase();
    }

    // ------------------------------------------------------------------
    // Role × resource policy matrix
    // ------------------------------------------------------------------

    public List<DataPolicyItem> policies(UUID tenantId, UUID roleId) {
        roleService.requireRole(tenantId, roleId);
        Map<String, RoleDataPolicy> stored = storedPolicies(tenantId, roleId);
        Map<String, DataPolicyItem> items = new LinkedHashMap<>();
        for (DataResourceItem resource : listDataResources()) {
            RoleDataPolicy policy = stored.remove(resource.resource());
            items.put(resource.resource(), toItem(roleId, resource.resource(), policy));
        }
        for (Map.Entry<String, RoleDataPolicy> entry : stored.entrySet()) {
            items.put(entry.getKey(), toItem(roleId, entry.getKey(), entry.getValue()));
        }
        return new ArrayList<>(items.values());
    }

    @Transactional
    public RoleDataPoliciesUpdateResponse updatePolicies(UUID tenantId, UUID roleId, List<DataPolicyInput> inputs) {
        roleService.requireRole(tenantId, roleId);
        int updated = 0;
        if (inputs != null) {
            for (DataPolicyInput input : inputs) {
                updated += upsertPolicy(tenantId, roleId, input);
            }
        }
        publishPolicyInvalidation(tenantId, roleId);
        // TODO(wave-integration): emit tenant-scoped audit log for IAM_ROLE_DATA_POLICIES_UPDATED.
        return new RoleDataPoliciesUpdateResponse(roleId.toString(), updated);
    }

    /**
     * Flat upsert contract {@code {role_id, resource, operation, scope}} where each item updates a
     * single operation column (DES-02-API section 5.4 extended by TASK-282).
     */
    @Transactional
    public RoleDataPoliciesUpdateResponse updatePoliciesMatrix(UUID tenantId, List<DataPolicyOperationInput> items) {
        int updated = 0;
        if (items != null) {
            Set<UUID> touchedRoles = new LinkedHashSet<>();
            for (DataPolicyOperationInput item : items) {
                UUID roleId = parseUuid(item.roleId(), "role_id");
                roleService.requireRole(tenantId, roleId);
                DataOperation operation = parseOperation(item.operation());
                DataScope scope = parseScope(item.scope(), "scope", true);
                upsertOperation(tenantId, roleId, item.resource(), operation, scope);
                touchedRoles.add(roleId);
                updated++;
            }
            for (UUID roleId : touchedRoles) {
                publishPolicyInvalidation(tenantId, roleId);
            }
        }
        return new RoleDataPoliciesUpdateResponse(null, updated);
    }

    public List<DataPolicyItem> effectivePoliciesForUser(UUID tenantId, UUID userId) {
        List<UserRole> userRoles = userRoleRepository.listByUser(userId, tenantId);
        List<UUID> roleIds = userRoles.stream().map(userRole -> userRole.roleId).toList();
        Map<String, DataPolicyItem> merged = new LinkedHashMap<>();
        for (DataResourceItem resource : listDataResources()) {
            merged.put(resource.resource(), defaultItem(resource.resource()));
        }
        if (!roleIds.isEmpty()) {
            List<RoleDataPolicy> policies = roleDataPolicyRepository.find(
                "tenantId = ?1 and roleId in ?2", tenantId, roleIds).list();
            for (RoleDataPolicy policy : policies) {
                DataPolicyItem current = merged.getOrDefault(policy.resource, defaultItem(policy.resource));
                merged.put(policy.resource, merge(current, policy));
            }
        }
        return new ArrayList<>(merged.values());
    }

    private int upsertPolicy(UUID tenantId, UUID roleId, DataPolicyInput input) {
        RoleDataPolicy existing = findPolicy(tenantId, roleId, input.resource());
        RoleDataPolicy policy = existing;
        if (policy == null) {
            policy = new RoleDataPolicy();
            policy.tenantId = tenantId;
            policy.roleId = roleId;
            policy.resource = input.resource().trim().toUpperCase();
            policy.createdAt = Instant.now();
            policy.createScope = DataScope.NONE;
            policy.readScope = DataScope.NONE;
            policy.updateScope = DataScope.NONE;
            policy.deleteScope = DataScope.NONE;
            policy.exportScope = DataScope.NONE;
            policy.shareScope = DataScope.NONE;
        }
        policy.createScope = parseScopeOrDefault(input.createScope(), "create_scope", policy.createScope);
        policy.readScope = parseScopeOrDefault(input.readScope(), "read_scope", policy.readScope);
        policy.updateScope = parseScopeOrDefault(input.updateScope(), "update_scope", policy.updateScope);
        policy.deleteScope = parseScopeOrDefault(input.deleteScope(), "delete_scope", policy.deleteScope);
        policy.exportScope = parseScopeOrDefault(input.exportScope(), "export_scope", policy.exportScope);
        policy.shareScope = parseScopeOrDefault(input.shareScope(), "share_scope", policy.shareScope);
        policy.updatedAt = Instant.now();
        if (existing == null) {
            policy.persist();
        }
        return 1;
    }

    private void upsertOperation(UUID tenantId, UUID roleId, String resource, DataOperation operation, DataScope scope) {
        RoleDataPolicy existing = findPolicy(tenantId, roleId, resource);
        RoleDataPolicy policy = existing;
        if (policy == null) {
            policy = new RoleDataPolicy();
            policy.tenantId = tenantId;
            policy.roleId = roleId;
            policy.resource = resource.trim().toUpperCase();
            policy.createdAt = Instant.now();
            policy.createScope = DataScope.NONE;
            policy.readScope = DataScope.NONE;
            policy.updateScope = DataScope.NONE;
            policy.deleteScope = DataScope.NONE;
            policy.exportScope = DataScope.NONE;
            policy.shareScope = DataScope.NONE;
        }
        switch (operation) {
            case CREATE -> policy.createScope = scope;
            case READ -> policy.readScope = scope;
            case UPDATE -> policy.updateScope = scope;
            case DELETE -> policy.deleteScope = scope;
            case EXPORT -> policy.exportScope = scope;
            case SHARE -> policy.shareScope = scope;
        }
        policy.updatedAt = Instant.now();
        if (existing == null) {
            policy.persist();
        }
    }

    private RoleDataPolicy findPolicy(UUID tenantId, UUID roleId, String resource) {
        if (resource == null || resource.isBlank()) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "resource is required");
        }
        return roleDataPolicyRepository
            .find("tenantId = ?1 and roleId = ?2 and resource = ?3", tenantId, roleId, resource.trim().toUpperCase())
            .firstResult();
    }

    private Map<String, RoleDataPolicy> storedPolicies(UUID tenantId, UUID roleId) {
        Map<String, RoleDataPolicy> stored = new HashMap<>();
        for (RoleDataPolicy policy : roleDataPolicyRepository
            .find("tenantId = ?1 and roleId = ?2", tenantId, roleId).list()) {
            stored.put(policy.resource, policy);
        }
        return stored;
    }

    private void publishPolicyInvalidation(UUID tenantId, UUID roleId) {
        List<UUID> affected = userRoleRepository.listUserIdsByRole(tenantId, roleId);
        permissionInvalidationService.publish(
            new RolePermissionChangedEvent(tenantId, roleId, affected, "ROLE_DATA_POLICIES_UPDATED"));
    }

    private DataPolicyItem toItem(UUID roleId, String resource, RoleDataPolicy policy) {
        if (policy == null) {
            return new DataPolicyItem(
                roleId != null ? roleId.toString() : null,
                resource,
                DataScope.NONE.name(),
                DataScope.NONE.name(),
                DataScope.NONE.name(),
                DataScope.NONE.name(),
                DataScope.NONE.name(),
                DataScope.NONE.name()
            );
        }
        return new DataPolicyItem(
            roleId != null ? roleId.toString() : null,
            policy.resource,
            policy.createScope != null ? policy.createScope.name() : DataScope.NONE.name(),
            policy.readScope != null ? policy.readScope.name() : DataScope.NONE.name(),
            policy.updateScope != null ? policy.updateScope.name() : DataScope.NONE.name(),
            policy.deleteScope != null ? policy.deleteScope.name() : DataScope.NONE.name(),
            policy.exportScope != null ? policy.exportScope.name() : DataScope.NONE.name(),
            policy.shareScope != null ? policy.shareScope.name() : DataScope.NONE.name()
        );
    }

    private DataPolicyItem defaultItem(String resource) {
        return toItem(null, resource, null);
    }

    private DataPolicyItem merge(DataPolicyItem current, RoleDataPolicy policy) {
        return new DataPolicyItem(
            null,
            policy.resource,
            widest(current.createScope(), policy.createScope),
            widest(current.readScope(), policy.readScope),
            widest(current.updateScope(), policy.updateScope),
            widest(current.deleteScope(), policy.deleteScope),
            widest(current.exportScope(), policy.exportScope),
            widest(current.shareScope(), policy.shareScope)
        );
    }

    private String widest(String left, DataScope right) {
        DataScope leftScope = DataScope.fromString(left);
        DataScope rightScope = right != null ? right : DataScope.NONE;
        return leftScope.mostPermissive(rightScope).name();
    }

    private DataScope parseScopeOrDefault(String raw, String field, DataScope fallback) {
        DataScope parsed = parseScope(raw, field, false);
        return parsed != null ? parsed : fallback;
    }

    private DataScope parseScope(String raw, String field, boolean required) {
        if (raw == null || raw.isBlank()) {
            if (required) {
                throw invalidScope(field, raw);
            }
            return null;
        }
        for (DataScope scope : DataScope.values()) {
            if (scope.name().equalsIgnoreCase(raw.trim())) {
                return scope;
            }
        }
        throw invalidScope(field, raw);
    }

    private ApiException invalidScope(String field, String value) {
        return new ApiException(400, IamErrorCodes.VALIDATION_INVALID_DATA_SCOPE,
            "Invalid data scope value",
            Map.of("field", field, "value", value == null ? "" : value),
            List.of(new ApiFieldError(field, IamErrorCodes.VALIDATION_INVALID_DATA_SCOPE,
                Map.of("value", value == null ? "" : value))));
    }

    private DataOperation parseOperation(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ApiException(400, "VALIDATION_REQUIRED", "operation is required");
        }
        for (DataOperation operation : DataOperation.values()) {
            if (operation.name().equalsIgnoreCase(raw.trim())) {
                return operation;
            }
        }
        throw new ApiException(400, "VALIDATION_INVALID_FORMAT", "Invalid data operation: " + raw);
    }

    private UUID parseUuid(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new ApiException(400, "VALIDATION_REQUIRED", field + " is required");
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException e) {
            throw new ApiException(400, "VALIDATION_INVALID_FORMAT", "Invalid UUID value for " + field);
        }
    }
}
