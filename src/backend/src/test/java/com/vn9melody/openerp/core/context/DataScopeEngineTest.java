package com.vn9melody.openerp.core.context;

import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.api.ErrorCode;
import com.vn9melody.openerp.core.enums.DataOperation;
import com.vn9melody.openerp.core.enums.DataScope;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Scope matrix of the Data Permission Engine (TASK-289/290): OWN_ONLY,
 * OWN_AND_SUBORDINATES, BRANCH union, DEPARTMENT_AND_CHILDREN, NONE, ALL and
 * EXPORT guard. Pure unit test - no PostgreSQL needed.
 */
public class DataScopeEngineTest {

    private static final String RESOURCE = "CORE_SAMPLE_RECORD";

    private final DataScopeResolver resolver = new DataScopeResolver();
    private final DataScopePredicate predicate = new DataScopePredicate();

    private DataScopeEngine engine() {
        DataScopeFilterEnabler enabler = new DataScopeFilterEnabler() {
            @Override
            public DataScope enable(UserSecurityContext context, String resource, DataOperation operation) {
                return resolver.resolve(context, resource, operation);
            }

            @Override
            public void enableScope(UserSecurityContext context, DataScope scope) {
            }

            @Override
            public void disableAll() {
            }
        };
        return new DataScopeEngine(resolver, enabler);
    }

    @Test
    @DisplayName("DataScopeResolver: union most-permissive giữa nhiều role")
    public void resolverUnionsMostPermissive() {
        UserSecurityContext context = context(UUID.randomUUID(), UUID.randomUUID(),
            policies(DataOperation.READ, DataScope.OWN_ONLY.mostPermissive(DataScope.BRANCH),
                DataOperation.DELETE, DataScope.NONE))
            .build();
        Assertions.assertEquals(DataScope.BRANCH, resolver.resolve(context, RESOURCE, DataOperation.READ));
        Assertions.assertEquals(DataScope.NONE, resolver.resolve(context, RESOURCE, DataOperation.DELETE));
        Assertions.assertEquals(DataScope.DEPARTMENT, new DataScopeResolver()
            .mostPermissive(DataScope.DEPARTMENT, DataScope.OWN_AND_SUBORDINATES));
    }

    @Test
    @DisplayName("OWN_ONLY: chỉ đọc bản ghi của chính mình")
    public void ownOnlyDeniesOtherRecords() {
        UUID userId = UUID.randomUUID();
        UUID tenantId = UUID.randomUUID();
        UserSecurityContext context = context(userId, tenantId,
            policies(DataOperation.READ, DataScope.OWN_ONLY))
            .build();
        DataScopeEngine engine = engine();

        Assertions.assertTrue(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(null, null, userId, null)));
        Assertions.assertTrue(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(null, null, null, userId)));
        Assertions.assertFalse(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(null, null, UUID.randomUUID(), null)));
    }

    @Test
    @DisplayName("OWN_AND_SUBORDINATES: cho phép bản ghi của cấp dưới, chặn người ngoài")
    public void ownAndSubordinatesAllowsSubordinateRecords() {
        UUID userId = UUID.randomUUID();
        UUID subordinateId = UUID.randomUUID();
        UserSecurityContext context = context(userId, UUID.randomUUID(),
            policies(DataOperation.READ, DataScope.OWN_AND_SUBORDINATES))
            .subordinateUserIds(Set.of(subordinateId))
            .build();
        DataScopeEngine engine = engine();

        Assertions.assertTrue(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(null, null, subordinateId, null)));
        Assertions.assertTrue(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(null, null, UUID.randomUUID(), userId)));
        Assertions.assertFalse(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(null, null, UUID.randomUUID(), null)));
    }

    @Test
    @DisplayName("BRANCH: hợp nhất member ∪ managed, chặn chi nhánh ngoài phạm vi")
    public void branchScopeUnionsMemberAndManaged() {
        UUID memberBranch = UUID.randomUUID();
        UUID managedBranch = UUID.randomUUID();
        UUID foreignBranch = UUID.randomUUID();
        UserSecurityContext context = context(UUID.randomUUID(), UUID.randomUUID(),
            policies(DataOperation.READ, DataScope.BRANCH))
            .memberBranchIds(Set.of(memberBranch))
            .managedBranchIds(Set.of(managedBranch))
            .build();
        DataScopeEngine engine = engine();

        Assertions.assertEquals(Set.of(memberBranch, managedBranch), context.effectiveBranchIds());
        Assertions.assertTrue(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(memberBranch, null, null, null)));
        Assertions.assertTrue(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(managedBranch, null, null, null)));
        Assertions.assertFalse(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(foreignBranch, null, null, null)));

        DataScopePredicate.ScopeFilter filter = predicate.filterFor(context, DataScope.BRANCH);
        Assertions.assertEquals(DataScopePredicate.FILTER_BRANCH, filter.filterName());
        Assertions.assertEquals(Set.of(memberBranch, managedBranch), filter.parameters().get("branchIds"));
    }

    @Test
    @DisplayName("DEPARTMENT_AND_CHILDREN: bao gồm phòng ban con, loại phòng ban anh em")
    public void departmentAndChildrenIncludesChildDepartments() {
        UUID root = UUID.randomUUID();
        UUID child = UUID.randomUUID();
        UUID sibling = UUID.randomUUID();
        UserSecurityContext context = context(UUID.randomUUID(), UUID.randomUUID(),
            policies(DataOperation.READ, DataScope.DEPARTMENT_AND_CHILDREN))
            .departmentId(root)
            .departmentIds(Set.of(root))
            .departmentAndChildIds(Set.of(root, child))
            .build();
        DataScopeEngine engine = engine();

        Assertions.assertTrue(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(null, child, null, null)));
        Assertions.assertFalse(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(null, sibling, null, null)));
    }

    @Test
    @DisplayName("NONE: từ chối mọi thao tác; filter Hibernate deny-all")
    public void noneScopeDeniesEverything() {
        UserSecurityContext context = context(UUID.randomUUID(), UUID.randomUUID(),
            policies(DataOperation.READ, DataScope.NONE, DataOperation.UPDATE, DataScope.NONE))
            .build();
        DataScopeEngine engine = engine();

        Assertions.assertFalse(engine.canMutate(context, RESOURCE, DataOperation.READ,
            new DataScopeTarget(null, null, context.userId(), context.userId())));
        Assertions.assertEquals(DataScopePredicate.FILTER_NONE,
            predicate.filterFor(context, DataScope.NONE).filterName());
        ApiException denied = Assertions.assertThrows(ApiException.class,
            () -> engine.assertCanMutate(context, RESOURCE, DataOperation.UPDATE,
                new DataScopeTarget(null, null, context.userId(), null)));
        Assertions.assertEquals(ErrorCode.IAM_PERMISSION_DENIED_DATA_SCOPE, denied.getErrorCode());
    }

    @Test
    @DisplayName("ALL: cho phép toàn tenant")
    public void allScopeAllowsEverything() {
        UserSecurityContext context = context(UUID.randomUUID(), UUID.randomUUID(),
            policies(DataOperation.READ, DataScope.ALL, DataOperation.UPDATE, DataScope.ALL))
            .build();
        DataScopeEngine engine = engine();

        Assertions.assertTrue(engine.canMutate(context, RESOURCE, DataOperation.UPDATE,
            new DataScopeTarget(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), null)));
    }

    @Test
    @DisplayName("EXPORT: NONE bị chặn IAM_PERMISSION_DENIED_EXPORT, còn scope thì cho phép")
    public void exportScopeGuard() {
        DataScopeEngine engine = engine();
        UserSecurityContext denied = context(UUID.randomUUID(), UUID.randomUUID(),
            policies(DataOperation.EXPORT, DataScope.NONE)).memberBranchIds(Set.of(UUID.randomUUID())).build();
        ApiException exception = Assertions.assertThrows(ApiException.class,
            () -> engine.assertExportAllowed(denied, RESOURCE));
        Assertions.assertEquals(ErrorCode.IAM_PERMISSION_DENIED_EXPORT, exception.getErrorCode());
        Assertions.assertEquals(403, exception.getStatusCode());

        UserSecurityContext allowed = context(UUID.randomUUID(), UUID.randomUUID(),
            policies(DataOperation.EXPORT, DataScope.BRANCH)).memberBranchIds(Set.of(UUID.randomUUID())).build();
        Assertions.assertEquals(DataScope.BRANCH, engine.assertExportAllowed(allowed, RESOURCE));
    }

    @Test
    @DisplayName("CREATE BRANCH: mặc định primary branch, chặn branch ngoài effective")
    public void createBranchRules() {
        UUID primary = UUID.randomUUID();
        UUID managed = UUID.randomUUID();
        UUID foreign = UUID.randomUUID();
        UserSecurityContext context = context(UUID.randomUUID(), UUID.randomUUID(),
            policies(DataOperation.CREATE, DataScope.BRANCH))
            .primaryBranchId(primary)
            .memberBranchIds(Set.of(primary))
            .managedBranchIds(Set.of(managed))
            .build();
        DataScopeEngine engine = engine();

        DataScopeTarget defaulted = engine.resolveCreateTarget(context, RESOURCE, null, null);
        Assertions.assertEquals(primary, defaulted.branchId());
        Assertions.assertEquals(context.userId(), defaulted.createdBy());

        DataScopeTarget managedTarget = engine.resolveCreateTarget(context, RESOURCE, managed, null);
        Assertions.assertEquals(managed, managedTarget.branchId());

        ApiException denied = Assertions.assertThrows(ApiException.class,
            () -> engine.resolveCreateTarget(context, RESOURCE, foreign, null));
        Assertions.assertEquals(ErrorCode.IAM_PERMISSION_DENIED_DATA_SCOPE, denied.getErrorCode());
    }

    @Test
    @DisplayName("CREATE OWN_ONLY: gán owner hiện tại, chi nhánh/phòng ban theo membership chính")
    public void createOwnOnlyUsesPrimaryMembership() {
        UUID primaryBranch = UUID.randomUUID();
        UUID primaryDepartment = UUID.randomUUID();
        UserSecurityContext context = context(UUID.randomUUID(), UUID.randomUUID(),
            policies(DataOperation.CREATE, DataScope.OWN_ONLY))
            .primaryBranchId(primaryBranch)
            .departmentId(primaryDepartment)
            .build();

        DataScopeTarget target = engine().resolveCreateTarget(context, RESOURCE, null, null);
        Assertions.assertEquals(primaryBranch, target.branchId());
        Assertions.assertEquals(primaryDepartment, target.departmentId());
        Assertions.assertEquals(context.userId(), target.createdBy());
    }

    private UserSecurityContext.Builder context(UUID userId, UUID tenantId,
                                                Map<String, Map<DataOperation, DataScope>> policies) {
        return UserSecurityContext.builder()
            .userId(userId)
            .tenantId(tenantId)
            .roleIds(Set.of())
            .roleCodes(Set.of("STAFF"))
            .functionalPermissions(Set.of("core:sample-record:read"))
            .dataPolicies(policies);
    }

    private Map<String, Map<DataOperation, DataScope>> policies(Object... operationScopePairs) {
        Map<DataOperation, DataScope> byOperation = new EnumMap<>(DataOperation.class);
        for (int i = 0; i < operationScopePairs.length; i += 2) {
            byOperation.put((DataOperation) operationScopePairs[i], (DataScope) operationScopePairs[i + 1]);
        }
        Map<String, Map<DataOperation, DataScope>> policies = new LinkedHashMap<>();
        policies.put(RESOURCE, byOperation);
        return policies;
    }
}
