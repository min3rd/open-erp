package com.vn9melody.openerp.modules.iam.service;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import com.vn9melody.openerp.core.enums.ResponseKey;

/**
 * Fixed response/request DTOs for the RBAC and data-policy APIs.
 * Strict response DTO pattern: no {@code Map<String,Object>} for business data.
 */
public final class IamRbacDtos {

    private IamRbacDtos() {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record PermissionItem(
        @JsonProperty(ResponseKey.Json.ID) String id,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(ResponseKey.Json.DOMAIN) String domain,
        @JsonProperty(ResponseKey.Json.RESOURCE) String resource,
        @JsonProperty(ResponseKey.Json.ACTION) String action,
        @JsonProperty(ResponseKey.Json.DESCRIPTION_KEY) String descriptionKey
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RoleItem(
        @JsonProperty(ResponseKey.Json.ID) String id,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(ResponseKey.Json.DESCRIPTION) String description,
        @JsonProperty(ResponseKey.Json.IS_SYSTEM) Boolean isSystem,
        @JsonProperty(ResponseKey.Json.ASSIGNED_USERS_COUNT) Long assignedUsersCount
    ) {
    }

    public record RoleRequest(
        @NotBlank @JsonProperty(ResponseKey.Json.CODE) String code,
        @NotBlank @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(ResponseKey.Json.DESCRIPTION) String description
    ) {
    }

    public record RolePermissionUpdateRequest(
        @JsonProperty(ResponseKey.Json.PERMISSION_IDS) List<String> permissionIds
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RolePermissionsUpdateResponse(
        @JsonProperty(ResponseKey.Json.ROLE_ID) String roleId,
        @JsonProperty(ResponseKey.Json.TOTAL_PERMISSIONS_GRANTED) Integer totalPermissionsGranted
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RoleDataPoliciesUpdateResponse(
        @JsonProperty(ResponseKey.Json.ROLE_ID) String roleId,
        @JsonProperty(ResponseKey.Json.UPDATED_COUNT) Integer updatedCount
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserRolesAssignedResponse(
        @JsonProperty(ResponseKey.Json.USER_ID) String userId,
        @JsonProperty(ResponseKey.Json.ASSIGNED_ROLES_COUNT) Integer assignedRolesCount
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RoleUsersAssignedResponse(
        @JsonProperty(ResponseKey.Json.ROLE_ID) String roleId,
        @JsonProperty(ResponseKey.Json.ASSIGNED_USERS_COUNT) Integer assignedUsersCount
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record RoleUserItem(
        @JsonProperty(ResponseKey.Json.USER_ID) String userId,
        @JsonProperty(ResponseKey.Json.EMAIL) String email,
        @JsonProperty(ResponseKey.Json.FULL_NAME) String fullName,
        @JsonProperty(ResponseKey.Json.STATUS) String status,
        @JsonProperty(ResponseKey.Json.ASSIGNED_AT) String assignedAt
    ) {
    }

    public record RoleUserAssignRequest(
        @JsonProperty(ResponseKey.Json.USER_IDS) List<String> userIds
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserRoleItem(
        @JsonProperty(ResponseKey.Json.ROLE_ID) String roleId,
        @JsonProperty(ResponseKey.Json.CODE) String code,
        @JsonProperty(ResponseKey.Json.NAME) String name,
        @JsonProperty(ResponseKey.Json.IS_SYSTEM) Boolean isSystem,
        @JsonProperty(ResponseKey.Json.ASSIGNED_AT) String assignedAt
    ) {
    }

    public record UserRoleAssignRequest(
        @JsonProperty(ResponseKey.Json.ROLE_IDS) List<String> roleIds
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record UserDirectoryItem(
        @JsonProperty(ResponseKey.Json.USER_ID) String userId,
        @JsonProperty(ResponseKey.Json.EMAIL) String email,
        @JsonProperty(ResponseKey.Json.FULL_NAME) String fullName,
        @JsonProperty(ResponseKey.Json.STATUS) String status
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DataResourceItem(
        @JsonProperty(ResponseKey.Json.RESOURCE) String resource,
        @JsonProperty(ResponseKey.Json.ENTITY_CLASS) String entityClass,
        @JsonProperty(ResponseKey.Json.TABLE_NAME) String tableName,
        @JsonProperty(ResponseKey.Json.PLUGIN) String plugin,
        @JsonProperty(ResponseKey.Json.SUPPORTS_ASSIGNEE) Boolean supportsAssignee,
        @JsonProperty(ResponseKey.Json.SCOPE_FIELDS) List<String> scopeFields
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DataPolicyItem(
        @JsonProperty(ResponseKey.Json.ROLE_ID) String roleId,
        @JsonProperty(ResponseKey.Json.RESOURCE) String resource,
        @JsonProperty(ResponseKey.Json.CREATE_SCOPE) String createScope,
        @JsonProperty(ResponseKey.Json.READ_SCOPE) String readScope,
        @JsonProperty(ResponseKey.Json.UPDATE_SCOPE) String updateScope,
        @JsonProperty(ResponseKey.Json.DELETE_SCOPE) String deleteScope,
        @JsonProperty(ResponseKey.Json.EXPORT_SCOPE) String exportScope,
        @JsonProperty(ResponseKey.Json.SHARE_SCOPE) String shareScope
    ) {
    }

    public record DataPolicyUpdateRequest(
        @Valid @JsonProperty(ResponseKey.Json.POLICIES) List<DataPolicyInput> policies
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DataPolicyInput(
        @JsonProperty(ResponseKey.Json.ROLE_ID) String roleId,
        @NotBlank @JsonProperty(ResponseKey.Json.RESOURCE) String resource,
        @JsonProperty(ResponseKey.Json.CREATE_SCOPE) String createScope,
        @JsonProperty(ResponseKey.Json.READ_SCOPE) String readScope,
        @JsonProperty(ResponseKey.Json.UPDATE_SCOPE) String updateScope,
        @JsonProperty(ResponseKey.Json.DELETE_SCOPE) String deleteScope,
        @JsonProperty(ResponseKey.Json.EXPORT_SCOPE) String exportScope,
        @JsonProperty(ResponseKey.Json.SHARE_SCOPE) String shareScope
    ) {
    }

    /**
     * Upsert contract {@code {role_id, resource, operation, scope}} (flat operation list).
     */
    public record DataPolicyMatrixUpdateRequest(
        @JsonProperty(ResponseKey.Json.ROLE_ID) String roleId,
        @Valid @JsonProperty(ResponseKey.Json.POLICIES) List<DataPolicyInput> policies,
        @Valid @JsonProperty(ResponseKey.Json.ITEMS) List<DataPolicyOperationInput> items
    ) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record DataPolicyOperationInput(
        @JsonProperty(ResponseKey.Json.ROLE_ID) String roleId,
        @NotBlank @JsonProperty(ResponseKey.Json.RESOURCE) String resource,
        @NotBlank @JsonProperty(ResponseKey.Json.OPERATION) String operation,
        @NotBlank @JsonProperty(ResponseKey.Json.SCOPE) String scope
    ) {
    }
}
