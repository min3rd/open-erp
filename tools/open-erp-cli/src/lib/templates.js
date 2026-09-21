export function pluginManifest(options) {
  return {
    id: options.id,
    name: options.name,
    description: options.description || options.name,
    version: '1.0.0',
    author: 'Open-ERP Plugin Team',
    core_version_compatibility: options.coreVersion || '>=1.0.0 <2.0.0',
    migration_policy: 'COMPATIBLE',
    rollback_strategy: 'SNAPSHOT_RESTORE',
    template_version: '0.1.0',
    dependencies: [],
    platforms: {
      desktop: { supported: true, features: ['sample_list', 'sample_create'] },
      mobile: { supported: options.platforms.includes('mobile'), features: options.platforms.includes('mobile') ? ['sample_list'] : [] },
    },
    permissions: [
      { code: `${options.id}:item:read`, name: `${options.name} - read` },
      { code: `${options.id}:item:create`, name: `${options.name} - create` },
    ],
    entities: [
      {
        name: 'SampleItem',
        storage: options.db === 'mongodb' ? 'mongodb' : 'postgres',
        table: 'plg_sample_items',
        public_fields: ['id', 'code', 'name', 'status', 'created_at'],
      },
    ],
    kafka_events: { publishes: [], subscribes: [] },
    ui_manifest: {
      contract_version: '1.0',
      screens: [
        {
          route: `/apps/${options.id}`,
          title_key: `PLUGIN_${options.id.toUpperCase().replaceAll('-', '_')}_MENU`,
          permission: `${options.id}:item:read`,
          render_mode: 'MODULE_FEDERATION',
          order: 100,
        },
      ],
      contributions: [],
      slots: [],
    },
    distribution: {
      type: options.packaging === 'bundle' ? 'JAR_BUNDLE' : 'IMAGE_REGISTRY',
      registry_url: 'registry.local',
      repository: `open-erp/plugin-${options.id}`,
      tag: '1.0.0',
    },
  };
}

export function packageName(id) {
  return `com.vn9melody.openerp.plugins.${id.replaceAll('-', '')}`;
}

export function projectFiles(options) {
  const pkg = packageName(options.id);
  const pkgPath = pkg.replaceAll('.', '/');
  const files = {};
  files['plugin.json'] = `${JSON.stringify(pluginManifest(options), null, 2)}\n`;
  files['.gitignore'] = ['target/', 'dist/', 'node_modules/', '.angular/', '*.log', '.env', '*.pem', ''].join('\n');
  files['.mvn/jvm.config'] = '-Dnet.bytebuddy.experimental=true\n';
  files['README.md'] = readme(options);
  files['pom.xml'] = pomXml(options, pkg);
  files['src/main/resources/application.properties'] = applicationProperties();
  files[`src/main/java/${pkgPath}/SampleItem.java`] = entity(options, pkg);
  files[`src/main/java/${pkgPath}/SampleItemRepository.java`] = repository(pkg);
  files[`src/main/java/${pkgPath}/SampleItemService.java`] = service(pkg);
  files[`src/main/java/${pkgPath}/SampleItemResource.java`] = resource(pkg);
  files['src/main/resources/db/plugin-migration/V1.0.0__initial_schema.up.sql'] = migrationUp(options);
  files['src/main/resources/db/plugin-migration/V1.0.0__initial_schema.down.sql'] = migrationDown();
  files[`src/test/java/${pkgPath}/SampleItemResourceTest.java`] = resourceTest(pkg);
  files['deploy/Dockerfile'] = dockerfile(options);
  files['deploy/k8s.yaml'] = k8s(options);
  files['ci/github-actions.yml'] = workflow(options);
  if (options.withWeb) {
    Object.assign(files, webFiles(options));
  } else {
    files['web/README.md'] = `# ${options.name} Web\n\nWeb UI disabled for this plugin (no --with-web).\n`;
  }
  return files;
}

function readme(options) {
  return `# ${options.name}

Plugin ID: \`${options.id}\` — scaffolded with \`@open-erp/cli\`.

## Commands

\`\`\`bash
npx @open-erp/cli validate
npx @open-erp/cli generate entity --name Invoice --fields "code:string,total:decimal"
npx @open-erp/cli generate menu --title-key PLUGIN_${options.id.toUpperCase().replaceAll('-', '_')}_MENU --route /apps/${options.id}
npx @open-erp/cli generate ui-contribution --slot core.dashboard.widgets --render-mode web-component
npx @open-erp/cli package
npx @open-erp/cli dev
\`\`\`

## Structure

- \`plugin.json\`: manifest (entities, permissions, UI manifest, distribution).
- \`src/main/java\`: Quarkus plugin backend (self-migrating against the tenant schema).
- \`src/main/resources/db/plugin-migration\`: per-tenant migration \`up\`/\`down\`.
- \`web/\`: Angular 22 UI using shared components on the Core shell.
- \`deploy/\`: Dockerfile + Kubernetes manifests.
`;
}

function pomXml(options, pkg) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>${pkg}</groupId>
  <artifactId>plugin-${options.id}</artifactId>
  <version>1.0.0-SNAPSHOT</version>
  <properties>
    <maven.compiler.release>21</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    <quarkus.platform.version>3.15.1</quarkus.platform.version>
  </properties>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>io.quarkus.platform</groupId>
        <artifactId>quarkus-bom</artifactId>
        <version>\${quarkus.platform.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-rest-jackson</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-hibernate-orm-panache</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-jdbc-postgresql</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-flyway</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-smallrye-health</artifactId>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-junit5</artifactId>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>io.rest-assured</groupId>
      <artifactId>rest-assured</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>io.quarkus.platform</groupId>
        <artifactId>quarkus-maven-plugin</artifactId>
        <version>\${quarkus.platform.version}</version>
        <extensions>true</extensions>
        <executions>
          <execution>
            <goals>
              <goal>build</goal>
              <goal>generate-code</goal>
              <goal>generate-code-tests</goal>
            </goals>
          </execution>
        </executions>
      </plugin>
    </plugins>
  </build>
</project>
`;
}

function applicationProperties() {
  return `quarkus.http.port=8080
quarkus.datasource.db-kind=postgresql
quarkus.datasource.jdbc.url=\${DB_URL:jdbc:postgresql://localhost:5432/openerp_dev}
quarkus.datasource.username=\${DB_USER:openerp}
quarkus.datasource.password=\${DB_PASSWORD:openerp_dev_password}
quarkus.datasource.jdbc.current-schema=\${DB_SCHEMA:public}
quarkus.flyway.migrate-at-start=true
quarkus.flyway.locations=classpath:db/plugin-migration
quarkus.flyway.schemas=\${DB_SCHEMA:public}
quarkus.hibernate-orm.database.generation=none
`;
}

function entity(options, pkg) {
  return `package ${pkg};

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "plg_sample_items")
public class SampleItem extends PanacheEntityBase {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false)
    public UUID id;

    @Column(name = "tenant_id", nullable = false)
    public UUID tenantId;

    @Column(name = "code", nullable = false, length = 64)
    public String code;

    @Column(name = "name", nullable = false, length = 255)
    public String name;

    @Column(name = "status", nullable = false, length = 30)
    public String status = "ACTIVE";

    @Column(name = "created_at", nullable = false)
    public Instant createdAt = Instant.now();
}
`;
}

function repository(pkg) {
  return `package ${pkg};

import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class SampleItemRepository implements PanacheRepositoryBase<SampleItem, UUID> {

    public List<SampleItem> listByTenant(UUID tenantId) {
        return list("tenantId = ?1 order by createdAt desc", tenantId);
    }
}
`;
}

function service(pkg) {
  return `package ${pkg};

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@ApplicationScoped
public class SampleItemService {

    @Inject
    SampleItemRepository repository;

    public List<SampleItem> list(UUID tenantId) {
        return repository.listByTenant(tenantId);
    }

    @Transactional
    public SampleItem create(UUID tenantId, String code, String name) {
        SampleItem item = new SampleItem();
        item.tenantId = tenantId;
        item.code = code;
        item.name = name;
        item.createdAt = Instant.now();
        repository.persist(item);
        return item;
    }
}
`;
}

function resource(pkg) {
  return `package ${pkg};

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Path("/api/v1/plugins/sample-items")
@Produces(MediaType.APPLICATION_JSON)
public class SampleItemResource {

    @Inject
    SampleItemService service;

    @GET
    @Transactional
    public List<SampleItem> list() {
        String tenantHeader = System.getenv("TENANT_ID");
        UUID tenantId = tenantHeader == null ? null : UUID.fromString(tenantHeader);
        return service.list(tenantId);
    }

    @POST
    @Transactional
    public Response create(Map<String, String> body) {
        String tenantHeader = System.getenv("TENANT_ID");
        UUID tenantId = tenantHeader == null ? null : UUID.fromString(tenantHeader);
        SampleItem item = service.create(tenantId, body.get("code"), body.get("name"));
        return Response.status(Response.Status.CREATED)
                .entity(Map.of("success", true, "code", "SAMPLE_ITEM_CREATED", "data", Map.of("id", item.id.toString())))
                .build();
    }
}
`;
}

function migrationUp(options) {
  return `CREATE TABLE IF NOT EXISTS plg_sample_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plg_sample_items_tenant ON plg_sample_items (tenant_id, created_at DESC);
-- Plugin ${options.id}: this migration runs inside the tenant schema only.
`;
}

function migrationDown() {
  return `DROP TABLE IF EXISTS plg_sample_items;
`;
}

function resourceTest(pkg) {
  return `package ${pkg};

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.notNullValue;

@QuarkusTest
public class SampleItemResourceTest {

    @Test
    public void listEndpointResponds() {
        given()
            .when().get("/api/v1/plugins/sample-items")
            .then().statusCode(200);
    }
}
`;
}

function dockerfile(options) {
  return `FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /workspace
COPY . .
RUN ./mvnw -q -DskipTests package 2>/dev/null || mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/target/quarkus-app/lib/ /app/lib/
COPY --from=build /workspace/target/quarkus-app/*.jar /app/
COPY --from=build /workspace/target/quarkus-app/app/ /app/app/
COPY --from=build /workspace/target/quarkus-app/quarkus/ /app/quarkus/
EXPOSE 8080
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/quarkus-run.jar"]
`;
}

function k8s(options) {
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: plugin-${options.id}
  labels:
    app: open-erp-plugin
    plugin_key: ${options.id}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: open-erp-plugin
      plugin_key: ${options.id}
  template:
    metadata:
      labels:
        app: open-erp-plugin
        plugin_key: ${options.id}
        managed-by: plugin-manager
    spec:
      containers:
        - name: plugin
          image: registry.local/open-erp/plugin-${options.id}:1.0.0
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet:
              path: /q/health/ready
              port: 8080
          livenessProbe:
            httpGet:
              path: /q/health/live
              port: 8080
          resources:
            limits:
              cpu: "500m"
              memory: "512Mi"
---
apiVersion: v1
kind: Service
metadata:
  name: plugin-${options.id}
spec:
  selector:
    app: open-erp-plugin
    plugin_key: ${options.id}
  ports:
    - port: 8080
      targetPort: 8080
`;
}

function workflow(options) {
  return `name: plugin-${options.id}
on:
  push:
    branches: [main]
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
      - name: Test
        run: mvn -B test
      - name: Package
        run: mvn -B -DskipTests package
      - name: Checksums
        run: sha256sum target/quarkus-app/quarkus-run.jar
`;
}

function webFiles(options) {
  const titleKey = `PLUGIN_${options.id.toUpperCase().replaceAll('-', '_')}_MENU`;
  return {
    'web/package.json': `{
  "name": "@open-erp/plugin-${options.id}-web",
  "private": true,
  "scripts": {
    "start": "ng serve --port 4300",
    "build": "ng build"
  },
  "dependencies": {
    "@angular/common": "^22.0.0",
    "@angular/compiler": "^22.0.0",
    "@angular/core": "^22.0.0",
    "@angular/forms": "^22.0.0",
    "@angular/platform-browser": "^22.0.0",
    "rxjs": "^7.8.1",
    "tslib": "^2.6.0",
    "zone.js": "^0.14.0"
  },
  "devDependencies": {
    "@angular/build": "^22.0.1",
    "@angular/cli": "^22.0.1",
    "@angular/compiler-cli": "^22.0.0",
    "typescript": "~6.0.2"
  }
}
`,
    'web/src/main.ts': `import { bootstrapApplication } from '@angular/platform-browser';
import { PluginScreenComponent } from './app/plugin-screen.component';

bootstrapApplication(PluginScreenComponent);
`,
    'web/src/app/plugin-screen.component.ts': `import { Component } from '@angular/core';

@Component({
  selector: 'app-plugin-screen',
  standalone: true,
  templateUrl: './plugin-screen.component.html',
})
export class PluginScreenComponent {}
`,
    'web/src/app/plugin-screen.component.html': `<section class="p-2 text-sm">
  <h1 class="text-xs font-semibold">{{ '${titleKey}' | translate }}</h1>
  <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ 'PLUGIN_${options.id.toUpperCase().replaceAll('-', '_')}_EMPTY' | translate }}</p>
</section>
`,
    'web/public/i18n/vi.json': `{
  "${titleKey}": "${options.name}",
  "PLUGIN_${options.id.toUpperCase().replaceAll('-', '_')}_EMPTY": "Chưa có dữ liệu."
}
`,
    'web/public/i18n/en.json': `{
  "${titleKey}": "${options.name}",
  "PLUGIN_${options.id.toUpperCase().replaceAll('-', '_')}_EMPTY": "No data yet."
}
`,
  };
}
