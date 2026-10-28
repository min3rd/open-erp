package com.vn9melody.openerp.modules.plugin.deployer;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

/** P5: the generated plugin Deployment must mount the mTLS secret when configured. */
public class PluginDeployerManifestTest {

    @Test
    void kubernetesManifestMountsTlsSecret() throws Exception {
        ProcessPluginRuntimeDeployer deployer = new ProcessPluginRuntimeDeployer();
        set(deployer, "tlsSecret", Optional.of("plugin-gateway-tls"));
        set(deployer, "defaultCpus", "0.5");
        set(deployer, "defaultMemoryMb", 512);
        String manifest = manifest(deployer);

        List<Object> documents = new ArrayList<>();
        new Yaml().loadAll(manifest).forEach(documents::add);
        assertTrue(documents.size() >= 2);
        Map<?, ?> deployment = (Map<?, ?>) documents.get(0);
        Map<?, ?> podSpec = (Map<?, ?>) ((Map<?, ?>) ((Map<?, ?>) deployment.get("spec"))
                .get("template")).get("spec");
        assertNotNull(podSpec.get("volumes"));

        Map<?, ?> container = (Map<?, ?>) ((List<?>) podSpec.get("containers")).get(0);
        assertNotNull(container.get("volumeMounts"));
        assertTrue(container.get("volumeMounts").toString().contains("/deploy/certs"));

        ProcessPluginRuntimeDeployer withoutTls = new ProcessPluginRuntimeDeployer();
        set(withoutTls, "tlsSecret", Optional.empty());
        set(withoutTls, "defaultCpus", "0.5");
        set(withoutTls, "defaultMemoryMb", 512);
        String plain = manifest(withoutTls);
        assertFalse(plain.contains("volumeMounts"));
    }

    private static String manifest(ProcessPluginRuntimeDeployer deployer) throws Exception {
        Method method = ProcessPluginRuntimeDeployer.class.getDeclaredMethod("kubernetesManifest",
                ProcessPluginRuntimeDeployer.DeployRequest.class, String.class);
        method.setAccessible(true);
        ProcessPluginRuntimeDeployer.DeployRequest request = new ProcessPluginRuntimeDeployer.DeployRequest(
                UUID.fromString("cd2729d8-aec0-423c-b2b0-2649a97d822f"), "catalog", "1.0.0",
                "open-erp/catalog:1.0.0", "tenant_cd2729d8_catalog",
                Map.of("PLUGIN_DATA_GATEWAY_URL", "https://backend:9090"));
        return (String) method.invoke(deployer, request, "openerp-plugin-catalog-cd2729d8");
    }

    private static void set(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
