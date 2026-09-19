package com.vn9melody.openerp.modules.iam.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

/**
 * Fixed response/request DTOs for the RBAC and data-policy APIs.
 * Strict response DTO pattern: no {@code Map<String,Object>} for business data.
 */
public final class IamRbacDtos {

    private IamRbacDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record PermissionItem(
        @JsonProperty("id") String id,
        @JsonProperty("code") String code,
        @JsonProperty("domain") String domain,
        @JsonProperty("resource") String resource,
        @JsonProperty("action") String action,
        @JsonProperty("description_key") String descriptionKey
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RoleItem(
        @JsonProperty("id") String id,
        @JsonProperty("code") String code,
        @JsonProperty("name") String name,
        @JsonProperty("description") String description,
        @JsonProperty("is_system") Boolean isSystem,
        @JsonProperty("assigned_users_count") Long assignedUsersCount
    ) {
    }

    public record RoleRequest(
        @NotBlank @JsonProperty("code") String code,
        @NotBlank @JsonProperty("name") String name,
        @JsonProperty("description") String description
    ) {
    }

    public record RolePermissionUpdateRequest(
        @JsonProperty("permission_ids") List<String> permissionIds
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RolePermissionsUpdateResponse(
        @JsonProperty("role_id") String roleId,
        @JsonProperty("total_permissions_granted") Integer totalPermissionsGranted
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RoleDataPoliciesUpdateResponse(
        @JsonProperty("role_id") String roleId,
        @JsonProperty("updated_count") Integer updatedCount
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserRolesAssignedResponse(
        @JsonProperty("user_id") String userId,
        @JsonProperty("assigned_roles_count") Integer assignedRolesCount
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RoleUsersAssignedResponse(
        @JsonProperty("role_id") String roleId,
        @JsonProperty("assigned_users_count") Integer assignedUsersCount
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RoleUserItem(
        @JsonProperty("user_id") String userId,
        @JsonProperty("email") String email,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("status") String status,
        @JsonProperty("assigned_at") String assignedAt
    ) {
    }

    public record RoleUserAssignRequest(
        @JsonProperty("user_ids") List<String> userIds
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserRoleItem(
        @JsonProperty("role_id") String roleId,
        @JsonProperty("code") String code,
        @JsonProperty("name") String name,
        @JsonProperty("is_system") Boolean isSystem,
        @JsonProperty("assigned_at") String assignedAt
    ) {
    }

    public record UserRoleAssignRequest(
        @JsonProperty("role_ids") List<String> roleIds
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserDirectoryItem(
        @JsonProperty("user_id") String userId,
        @JsonProperty("email") String email,
        @JsonProperty("full_name") String fullName,
        @JsonProperty("status") String status
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DataResourceItem(
        @JsonProperty("resource") String resource,
        @JsonProperty("entity_class") String entityClass,
        @JsonProperty("table_name") String tableName,
        @JsonProperty("plugin") String plugin,
        @JsonProperty("supports_assignee") Boolean supportsAssignee,
        @JsonProperty("scope_fields") List<String> scopeFields
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DataPolicyItem(
        @JsonProperty("role_id") String roleId,
        @JsonProperty("resource") String resource,
        @JsonProperty("create_scope") String createScope,
        @JsonProperty("read_scope") String readScope,
        @JsonProperty("update_scope") String updateScope,
        @JsonProperty("delete_scope") String deleteScope,
        @JsonProperty("export_scope") String exportScope,
        @JsonProperty("share_scope") String shareScope
    ) {
    }

    public record DataPolicyUpdateRequest(
        @Valid @JsonProperty("policies") List<DataPolicyInput> policies
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DataPolicyInput(
        @JsonProperty("role_id") String roleId,
        @NotBlank @JsonProperty("resource") String resource,
        @JsonProperty("create_scope") String createScope,
        @JsonProperty("read_scope") String readScope,
        @JsonProperty("update_scope") String updateScope,
        @JsonProperty("delete_scope") String deleteScope,
        @JsonProperty("export_scope") String exportScope,
        @JsonProperty("share_scope") String shareScope
    ) {
    }

    /**
     * Upsert contract {@code {role_id, resource, operation, scope}} (flat operation list).
     */
    public record DataPolicyMatrixUpdateRequest(
        @JsonProperty("role_id") String roleId,
        @Valid @JsonProperty("policies") List<DataPolicyInput> policies,
        @Valid @JsonProperty("items") List<DataPolicyOperationInput> items
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DataPolicyOperationInput(
        @JsonProperty("role_id") String roleId,
        @NotBlank @JsonProperty("resource") String resource,
        @NotBlank @JsonProperty("operation") String operation,
        @NotBlank @JsonProperty("scope") String scope
    ) {
    }
}
