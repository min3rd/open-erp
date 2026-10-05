package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.vn9melody.openerp.core.api.ApiException;
import com.vn9melody.openerp.core.enums.PluginReleaseStatus;
import com.vn9melody.openerp.core.enums.TenantPluginStatus;
import com.vn9melody.openerp.modules.plugin.api.PluginErrorCode;
import com.vn9melody.openerp.modules.plugin.api.PluginResponseKey;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.model.TenantPlugin;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import com.vn9melody.openerp.modules.plugin.repository.TenantPluginRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Dependency and compatibility checks (TASK-305, BR-PLG-04/05/14):
 * install requires active dependencies satisfying min_version; uninstall is
 * blocked while dependents are active and returns an ordered removal plan.
 */
@ApplicationScoped
public class PluginDependencyResolver {

    @Inject
    TenantPluginRepository tenantPluginRepository;

    @Inject
    PluginVersionRepository versionRepository;

    public void validateDependencies(UUID tenantId, JsonNode dependencies) {
        if (dependencies == null || !dependencies.isArray() || dependencies.isEmpty()) {
            return;
        }
        List<String> missing = new ArrayList<>();
        for (JsonNode dependency : dependencies) {
            String key = dependency.isTextual() ? dependency.asText() : dependency.path("key").asText(null);
            String minVersion = dependency.isTextual() ? null : dependency.path("min_version").asText(null);
            if (key == null) {
                continue;
            }
            TenantPlugin installed = tenantPluginRepository.findByTenantAndKey(tenantId, key).orElse(null);
            if (installed == null || installed.status != TenantPluginStatus.ACTIVE
                    || installed.installedVersion == null) {
                missing.add(key);
                continue;
            }
            if (minVersion != null && !minVersion.isBlank()
                    && !PluginSemver.satisfies(installed.installedVersion, ">=" + minVersion)) {
                missing.add(key);
            }
        }
        if (!missing.isEmpty()) {
            Map<String, Object> params = new HashMap<>();
            params.put(PluginResponseKey.REMOVAL_PLAN.getKey(), missing);
            throw new ApiException(409, PluginErrorCode.PLUGIN_DEPENDENCY_MISSING,
                    "Missing active dependencies: " + missing, params);
        }
    }

    /**
     * TASK-305/346: rejects an install/upgrade that would introduce a dependency
     * cycle (A -> B -> A). The graph is the tenant's ACTIVE plugins plus the
     * prospective dependency list of {@code pluginKey}; the check is reachability
     * from each of {@code pluginKey}'s dependencies back to {@code pluginKey}.
     */
    public void assertNoCycles(UUID tenantId, String pluginKey, JsonNode dependencies) {
        Map<String, List<String>> graph = new HashMap<>();
        for (TenantPlugin installed : tenantPluginRepository.listActiveByTenant(tenantId)) {
            if (!installed.pluginKey.equals(pluginKey)) {
                graph.put(installed.pluginKey, dependencyKeysOf(installed));
            }
        }
        graph.put(pluginKey, dependencyKeysFromJson(dependencies));
        Set<String> visited = new HashSet<>();
        visited.add(pluginKey);
        if (reachesPlugin(graph, pluginKey, pluginKey, visited)) {
            Map<String, Object> params = new HashMap<>();
            params.put(PluginResponseKey.PLUGIN_KEY.getKey(), pluginKey);
            params.put(PluginResponseKey.REMOVAL_PLAN.getKey(), new ArrayList<>(visited));
            throw new ApiException(409, PluginErrorCode.PLUGIN_DEPENDENCY_CYCLE,
                    "Dependency cycle detected for " + pluginKey, params);
        }
    }

    public void assertNoDependents(UUID tenantId, String pluginKey) {
        List<String> dependents = findDependents(tenantId, pluginKey);
        if (dependents.isEmpty()) {
            return;
        }
        List<String> plan = new ArrayList<>(dependents);
        plan.add(pluginKey);
        Map<String, Object> params = new HashMap<>();
        params.put(PluginResponseKey.REMOVAL_PLAN.getKey(), plan);
        throw new ApiException(409, PluginErrorCode.PLUGIN_HAS_DEPENDENTS,
                "Active dependents must be removed first: " + dependents, params);
    }

    public List<String> findDependents(UUID tenantId, String pluginKey) {
        Set<String> dependents = new LinkedHashSet<>();
        List<TenantPlugin> active = tenantPluginRepository.listActiveByTenant(tenantId);
        for (TenantPlugin installed : active) {
            if (installed.installedVersion == null || installed.pluginKey.equals(pluginKey)) {
                continue;
            }
            PluginVersion version = versionRepository
                    .findByCatalogAndVersion(installed.catalogId, installed.installedVersion)
                    .orElse(null);
            if (version == null || version.releaseStatus == PluginReleaseStatus.BLOCKED) {
                continue;
            }
            JsonNode dependencies = version.dependencies;
            if (dependencies == null || !dependencies.isArray()) {
                continue;
            }
            for (JsonNode dependency : dependencies) {
                String key = dependency.isTextual() ? dependency.asText() : dependency.path("key").asText(null);
                if (pluginKey.equals(key)) {
                    dependents.add(installed.pluginKey);
                }
            }
        }
        return new ArrayList<>(dependents);
    }

    /** True when {@code target} is reachable from any dependency of {@code from}. */
    private boolean reachesPlugin(Map<String, List<String>> graph, String from, String target, Set<String> visited) {
        for (String dependency : graph.getOrDefault(from, List.of())) {
            if (dependency.equals(target)) {
                return true;
            }
            if (visited.add(dependency) && reachesPlugin(graph, dependency, target, visited)) {
                return true;
            }
        }
        return false;
    }

    private List<String> dependencyKeysOf(TenantPlugin installed) {
        if (installed.installedVersion == null) {
            return List.of();
        }
        PluginVersion version = versionRepository
                .findByCatalogAndVersion(installed.catalogId, installed.installedVersion)
                .orElse(null);
        return version == null ? List.of() : dependencyKeysFromJson(version.dependencies);
    }

    private List<String> dependencyKeysFromJson(JsonNode dependencies) {
        List<String> keys = new ArrayList<>();
        if (dependencies == null || !dependencies.isArray()) {
            return keys;
        }
        for (JsonNode dependency : dependencies) {
            String key = dependency.isTextual() ? dependency.asText() : dependency.path("key").asText(null);
            if (key != null && !key.isBlank()) {
                keys.add(key);
            }
        }
        return keys;
    }
}
