package com.vn9melody.openerp.core.context;

import com.vn9melody.openerp.core.enums.DataScope;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Compiles a {@link DataScope} into the Hibernate filter definition name and
 * parameters applied to the reference entity {@code CoreSampleRecord}
 * (SOL-02 section 4, TASK-289/290).
 *
 * <p>Filter names map 1-1 to the {@code @FilterDef} declarations of
 * {@link com.vn9melody.openerp.modules.core.model.CoreSampleRecord}; conditions
 * never use a table alias because Hibernate injects them as raw SQL.</p>
 */
@ApplicationScoped
public class DataScopePredicate {

    public static final String FILTER_NONE = "coreSampleRecord_none";
    public static final String FILTER_ALL = "coreSampleRecord_all";
    public static final String FILTER_BRANCH = "coreSampleRecord_branch";
    public static final String FILTER_DEPARTMENT = "coreSampleRecord_department";
    public static final String FILTER_OWN = "coreSampleRecord_own";
    public static final String FILTER_OWNER_IDS = "coreSampleRecord_owner_ids";

    public record ScopeFilter(String filterName, Map<String, Object> parameters) {
        public ScopeFilter {
            parameters = parameters != null ? Map.copyOf(parameters) : Map.of();
        }
    }

    /** Builds the Hibernate filter for the requested scope; empty sets degrade to deny. */
    public ScopeFilter filterFor(UserSecurityContext context, DataScope scope) {
        if (context == null || scope == null) {
            return denyFilter();
        }
        return switch (scope) {
            case NONE -> denyFilter();
            case ALL -> new ScopeFilter(FILTER_ALL, tenant(context));
            case BRANCH -> {
                Set<UUID> branchIds = context.effectiveBranchIds();
                if (branchIds.isEmpty()) {
                    yield denyFilter();
                }
                Map<String, Object> params = tenant(context);
                params.put("branchIds", branchIds);
                yield new ScopeFilter(FILTER_BRANCH, params);
            }
            case DEPARTMENT -> {
                if (context.departmentIds().isEmpty()) {
                    yield denyFilter();
                }
                Map<String, Object> params = tenant(context);
                params.put("departmentIds", context.departmentIds());
                yield new ScopeFilter(FILTER_DEPARTMENT, params);
            }
            case DEPARTMENT_AND_CHILDREN -> {
                if (context.departmentAndChildIds().isEmpty()) {
                    yield denyFilter();
                }
                Map<String, Object> params = tenant(context);
                params.put("departmentIds", context.departmentAndChildIds());
                yield new ScopeFilter(FILTER_DEPARTMENT, params);
            }
            case OWN_ONLY -> {
                if (context.userId() == null) {
                    yield denyFilter();
                }
                Map<String, Object> params = tenant(context);
                params.put("ownerId", context.userId());
                yield new ScopeFilter(FILTER_OWN, params);
            }
            case OWN_AND_SUBORDINATES -> {
                Set<UUID> ownerIds = context.ownerIds();
                if (ownerIds.isEmpty()) {
                    yield denyFilter();
                }
                Map<String, Object> params = tenant(context);
                params.put("ownerIds", ownerIds);
                yield new ScopeFilter(FILTER_OWNER_IDS, params);
            }
        };
    }

    private ScopeFilter denyFilter() {
        return new ScopeFilter(FILTER_NONE, Map.of());
    }

    private Map<String, Object> tenant(UserSecurityContext context) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("tenantId", context.tenantId());
        return params;
    }
}
