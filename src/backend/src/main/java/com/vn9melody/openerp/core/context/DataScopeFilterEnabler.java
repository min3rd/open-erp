package com.vn9melody.openerp.core.context;

import com.vn9melody.openerp.core.enums.DataOperation;
import com.vn9melody.openerp.core.enums.DataScope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.ArrayDeque;
import java.util.Deque;
import org.hibernate.Filter;
import org.hibernate.Session;
import org.jboss.logging.Logger;

/**
 * Enables/disables the Hibernate {@code @Filter} of the reference entity for the
 * current request and persistence context (SOL-02 section 4, TASK-289).
 *
 * <p>Only one scope filter may be active at a time; enabling a new scope first
 * clears the previous one. Callers in {@code @Transactional} boundaries are
 * responsible for calling {@link #disableAll()} in a finally block (the filter
 * also disappears with the session when the transaction ends).</p>
 */
@ApplicationScoped
public class DataScopeFilterEnabler {

    private static final Logger LOG = Logger.getLogger(DataScopeFilterEnabler.class);

    @Inject
    EntityManager entityManager;

    @Inject
    DataScopeResolver resolver;

    @Inject
    DataScopePredicate predicate;

    private final ThreadLocal<Deque<String>> activeFilters = ThreadLocal.withInitial(ArrayDeque::new);

    /** Resolves the scope and activates the matching Hibernate filter. */
    public DataScope enable(UserSecurityContext context, String resource, DataOperation operation) {
        DataScope scope = resolver.resolve(context, resource, operation);
        enableScope(context, scope);
        return scope;
    }

    public void enableScope(UserSecurityContext context, DataScope scope) {
        disableAll();
        DataScopePredicate.ScopeFilter filter = predicate.filterFor(context, scope);
        Session session = entityManager.unwrap(Session.class);
        Filter hibernateFilter = session.enableFilter(filter.filterName());
        filter.parameters().forEach((name, value) -> {
            if (value instanceof java.util.Collection<?> collection) {
                hibernateFilter.setParameterList(name, collection);
            } else {
                hibernateFilter.setParameter(name, value);
            }
        });
        activeFilters.get().push(filter.filterName());
        LOG.debugf("Data scope filter enabled: %s (scope=%s)", filter.filterName(), scope);
    }

    public void disableAll() {
        Deque<String> filters = activeFilters.get();
        if (filters.isEmpty()) {
            activeFilters.remove();
            return;
        }
        Session session = entityManager.unwrap(Session.class);
        while (!filters.isEmpty()) {
            String name = filters.pop();
            try {
                session.disableFilter(name);
            } catch (Exception e) {
                LOG.debugf("Unable to disable Hibernate filter %s: %s", name, e.getMessage());
            }
        }
        activeFilters.remove();
    }
}
