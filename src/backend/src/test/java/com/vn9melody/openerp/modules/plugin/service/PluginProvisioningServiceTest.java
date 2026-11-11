package com.vn9melody.openerp.modules.plugin.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.vn9melody.openerp.core.enums.PluginCatalogStatus;
import com.vn9melody.openerp.core.enums.PluginReleaseStatus;
import com.vn9melody.openerp.core.enums.PluginVisibility;
import com.vn9melody.openerp.modules.plugin.model.PluginCatalog;
import com.vn9melody.openerp.modules.plugin.model.PluginVersion;
import com.vn9melody.openerp.modules.plugin.repository.PluginCatalogRepository;
import com.vn9melody.openerp.modules.plugin.repository.PluginVersionRepository;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.junit.mockito.InjectMock;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

@QuarkusTest
public class PluginProvisioningServiceTest {

    @Inject
    PluginProvisioningService provisioningService;

    @InjectMock
    PluginVersionRepository versionRepository;

    @InjectMock
    PluginCatalogRepository catalogRepository;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    @DisplayName("sortInDependencyOrder correctly sorts plugins into topological order")
    public void sortsPluginsInTopologicalDependencyOrder() {
        PluginCatalog catalog = createCatalog("catalog");
        PluginCatalog orgStructure = createCatalog("org-structure");
        PluginCatalog form = createCatalog("form");
        PluginCatalog workflow = createCatalog("workflow");
        PluginCatalog employee = createCatalog("employee");

        mockVersion(catalog.id, List.of());
        mockVersion(orgStructure.id, List.of());
        mockVersion(form.id, List.of("catalog"));
        mockVersion(workflow.id, List.of("org-structure"));
        mockVersion(employee.id, List.of("catalog", "org-structure", "workflow"));

        // Pass in arbitrary/reverse order: employee, form, workflow, org-structure, catalog
        List<PluginCatalog> shuffled = List.of(employee, form, workflow, orgStructure, catalog);
        List<PluginCatalog> sorted = provisioningService.sortInDependencyOrder(shuffled);

        List<String> sortedKeys = sorted.stream().map(c -> c.pluginKey).toList();

        // catalog and org-structure must be before form, workflow, employee
        int idxCatalog = sortedKeys.indexOf("catalog");
        int idxOrg = sortedKeys.indexOf("org-structure");
        int idxForm = sortedKeys.indexOf("form");
        int idxWorkflow = sortedKeys.indexOf("workflow");
        int idxEmployee = sortedKeys.indexOf("employee");

        Assertions.assertTrue(idxCatalog < idxForm, "catalog must precede form");
        Assertions.assertTrue(idxOrg < idxWorkflow, "org-structure must precede workflow");
        Assertions.assertTrue(idxCatalog < idxEmployee, "catalog must precede employee");
        Assertions.assertTrue(idxOrg < idxEmployee, "org-structure must precede employee");
        Assertions.assertTrue(idxWorkflow < idxEmployee, "workflow must precede employee");
    }

    @Test
    @DisplayName("provisionDefaults returns 0 for null or system tenant")
    public void skipsSystemTenant() {
        Assertions.assertEquals(0, provisioningService.provisionDefaults(null));
        Assertions.assertEquals(0, provisioningService.provisionDefaults(UUID.fromString("00000000-0000-0000-0000-000000000001")));
    }

    private PluginCatalog createCatalog(String key) {
        PluginCatalog cat = new PluginCatalog();
        cat.id = UUID.randomUUID();
        cat.pluginKey = key;
        cat.catalogStatus = PluginCatalogStatus.ACTIVE;
        cat.defaultInstall = true;
        cat.locked = true;
        cat.visibility = PluginVisibility.PLATFORM;
        return cat;
    }

    private void mockVersion(UUID catalogId, List<String> deps) {
        PluginVersion ver = new PluginVersion();
        ver.id = UUID.randomUUID();
        ver.catalogId = catalogId;
        ver.version = "1.0.0";
        ver.releaseStatus = PluginReleaseStatus.PUBLISHED;
        ArrayNode arr = mapper.createArrayNode();
        for (String dep : deps) {
            arr.addObject().put("key", dep).put("min_version", "1.0.0");
        }
        ver.dependencies = arr;
        Mockito.when(versionRepository.listInstallable(catalogId)).thenReturn(List.of(ver));
    }
}

