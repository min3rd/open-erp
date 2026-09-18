package com.vn9melody.openerp.core.registry;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.Map;
import org.jboss.jandex.AnnotationInstance;
import org.jboss.jandex.AnnotationTarget;
import org.jboss.jandex.AnnotationValue;
import org.jboss.jandex.ClassInfo;
import org.jboss.jandex.DotName;
import org.jboss.jandex.IndexView;
import org.jboss.logging.Logger;

@ApplicationScoped
public class EntityRegistryService {

    private static final Logger LOG = Logger.getLogger(EntityRegistryService.class);

    @Inject
    IndexView index;

    @Inject
    EntityManager entityManager;

    @Inject
    ObjectMapper objectMapper;

    void onStart(@Observes StartupEvent event) {
        registerAnnotatedEntities();
    }

    public void registerAnnotatedEntities() {
        var annotations = index.getAnnotations(DotName.createSimple(RegisterEntity.class.getName()));
        if (annotations.isEmpty()) {
            LOG.info("Entity Registry: no @RegisterEntity annotation found");
            return;
        }

        QuarkusTransaction.requiringNew().run(() -> {
            for (AnnotationInstance instance : annotations) {
                if (instance.target() == null || instance.target().kind() != AnnotationTarget.Kind.CLASS) {
                    continue;
                }
                upsert(instance, instance.target().asClass());
            }
        });
    }

    private void upsert(AnnotationInstance instance, ClassInfo classInfo) {
        AnnotationValue entityNameValue = instance.value("entityName");
        AnnotationValue tableValue = instance.value("table");
        if (entityNameValue == null || tableValue == null) {
            LOG.warnf("Entity Registry: skipping %s because entityName/table is missing", classInfo.name());
            return;
        }

        String entityName = entityNameValue.asString();
        String pluginId = stringValue(instance, "pluginId", "core-iam");
        String storage = stringValue(instance, "storage", "postgres");
        String table = tableValue.asString();
        String[] publicFields = stringArray(instance, "publicFields");
        String[] relations = stringArray(instance, "relations");

        entityManager.createNativeQuery(
                "INSERT INTO sys_entity_registry "
                    + "(id, plugin_id, entity_name, storage_type, table_or_collection, schema_definition, exported_relations) "
                    + "VALUES (gen_random_uuid(), ?1, ?2, ?3, ?4, CAST(?5 AS jsonb), CAST(?6 AS jsonb)) "
                    + "ON CONFLICT (plugin_id, entity_name) DO UPDATE SET "
                    + "storage_type = EXCLUDED.storage_type, "
                    + "table_or_collection = EXCLUDED.table_or_collection, "
                    + "schema_definition = EXCLUDED.schema_definition, "
                    + "exported_relations = EXCLUDED.exported_relations")
            .setParameter(1, pluginId)
            .setParameter(2, entityName)
            .setParameter(3, storage)
            .setParameter(4, table)
            .setParameter(5, toJson(Map.of("fields", publicFields)))
            .setParameter(6, toJson(relations))
            .executeUpdate();

        LOG.debugf("Entity Registry: registered %s.%s -> %s (%s)", pluginId, entityName, table, storage);
    }

    private String stringValue(AnnotationInstance instance, String name, String defaultValue) {
        AnnotationValue value = instance.value(name);
        return value != null && value.asString() != null ? value.asString() : defaultValue;
    }

    private String[] stringArray(AnnotationInstance instance, String name) {
        AnnotationValue value = instance.value(name);
        return value != null ? value.asStringArray() : new String[0];
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            LOG.warnf("Entity Registry: unable to serialize schema metadata: %s", e.getMessage());
            return "{}";
        }
    }
}
