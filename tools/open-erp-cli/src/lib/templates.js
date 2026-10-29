import { sha256Text } from './checksum.js';

export function pluginManifest(options, migration) {
  const id = options.id;
  const titleKey = `PLUGIN_${id.toUpperCase().replaceAll('-', '_')}_MENU`;
  const headerKey = `PLUGIN_${id.toUpperCase().replaceAll('-', '_')}_HEADER`;
  const entry = `/plugins-runtime/${id}/main.js`;
  return {
    schema_version: '2.0',
    id,
    name: options.name,
    description: options.description || options.name,
    version: '1.0.0',
    template_version: '2.0.0',
    author: 'Open-ERP Plugin Team',
    core_version_compatibility: options.coreVersion || '>=1.0.0 <2.0.0',
    migration_policy: 'COMPATIBLE',
    rollback_strategy: 'SNAPSHOT_RESTORE',
    dependencies: [],
    platforms: {
      desktop: { supported: true, features: ['sample_list'] },
      mobile: { supported: options.platforms.includes('mobile'), features: options.platforms.includes('mobile') ? ['sample_list'] : [] },
    },
    permissions: [
      { code: `${id}:item:read`, name: `${options.name} - read` },
      { code: `${id}:item:manage`, name: `${options.name} - manage` },
    ],
    entities: [
      {
        name: 'SampleItem',
        table: `plg_${id.replaceAll('-', '_')}_sample_items`,
        storage_scope: 'TENANT',
        fields: [
          { name: 'code', type: 'string', required: true, unique: true, max_length: 64 },
          { name: 'name', type: 'string', required: true, max_length: 255 },
          { name: 'status', type: 'enum', enum_values: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
        ],
        validators: [
          { field: 'code', rule: 'max_length', value: 64 },
          { field: 'name', rule: 'max_length', value: 255 },
        ],
      },
    ],
    relations: [],
    queries: [
      {
        id: 'sample.list',
        mode: 'READ',
        operation: 'LIST',
        entity: 'SampleItem',
        tenant_scope: 'TENANT',
        select: ['id', 'code', 'name', 'status', 'created_at'],
        sort: [{ field: 'created_at', direction: 'DESC' }],
        maxRows: 100,
      },
    ],
    migrations: migration
      ? [{
          version: '1.0.0',
          file: migration.file,
          checksum: `sha256:${migration.sha256}`,
          description: `${options.name} initial schema`,
        }]
      : [],
    kafka_events: { publishes: [], subscribes: [] },
    ui_manifest: {
      contract_version: '1.0',
      screens: [
        {
          route: `/apps/${id}`,
          title_key: titleKey,
          permission: `${id}:item:read`,
          render_mode: 'WEB_COMPONENT',
          entry,
          tag_name: `op-${id}-app`,
          order: 100,
          platforms: ['desktop', 'mobile'],
        },
      ],
      contributions: [
        {
          id: 'header-action',
          slot: 'core.layout.header.actions',
          title_key: headerKey,
          render_mode: 'WEB_COMPONENT',
          entry,
          tag_name: `op-${id}-header`,
          permission: `${id}:item:read`,
          order: 10,
          contract_version: '1.0',
          platforms: ['desktop', 'mobile'],
          isolation: 'light',
        },
      ],
      slots: [],
      crud: [],
    },
    distribution: {
      type: options.packaging === 'bundle' ? 'JAR_BUNDLE' : 'IMAGE_REGISTRY',
      registry_url: 'registry.local',
      repository: `open-erp/plugin-${id}`,
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
  const migrationName = 'V1.0.0__initial_schema.sql';
  const migrationFile = `migrations/${migrationName}`;
  const migration = migrationUp(options);
  const manifest = pluginManifest(options, {
    file: migrationName,
    sha256: sha256Text(migration),
  });
  const files = {};
  files['plugin.json'] = `${JSON.stringify(manifest, null, 2)}\n`;
  files['.gitignore'] = ['target/', 'dist/', 'node_modules/', '.angular/', '*.log', '.env', '*.pem', ''].join('\n');
  files['.mvn/jvm.config'] = '-Dnet.bytebuddy.experimental=true\n';
  files['README.md'] = readme(options);
  files['pom.xml'] = pomXml(options, pkg);
  files['src/main/resources/application.properties'] = applicationProperties(options);
  files[`src/main/java/${pkgPath}/SampleItem.java`] = entity(options, pkg);
  files[`src/main/java/${pkgPath}/SampleItemDto.java`] = dto(pkg);
  files[`src/main/java/${pkgPath}/SampleItemService.java`] = service(pkg);
  files[`src/main/java/${pkgPath}/SampleItemResource.java`] = resource(options, pkg);
  files[migrationFile] = migration;
  files[`src/test/java/${pkgPath}/SampleItemResourceTest.java`] = resourceTest(pkg);
  files['deploy/Dockerfile'] = dockerfile();
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

Plugin ID: \`${options.id}\` — scaffolded with \`@open-erp/cli\` (template 2.0, zero-DB).

## Commands

\`\`\`bash
npx @open-erp/cli validate
npx @open-erp/cli generate entity --name Invoice --fields "code:string,total:decimal"
npx @open-erp/cli generate crud --entity Invoice --interactive
npx @open-erp/cli package
npx @open-erp/cli dev
\`\`\`

## Structure

- \`plugin.json\`: manifest 2.0 (entities, fields, relations, queries, migrations, UI manifest).
- \`src/main/java\`: Quarkus plugin backend; DB access through \`PluginDataClient\` (zero DB).
- \`migrations/\`: SQL executed by core, checksum in manifest.
- \`web/\`: Angular 22 Web Component screen + contribution entry.
- \`deploy/\`: Dockerfile + Kubernetes manifests.

## Database

The platform owns the tenant schema. Declare DDL in \`migrations/\` and keep the
SHA-256 in \`plugin.json.migrations[]\`. Do not add datasource/Flyway/Panache or
\`tenant_id\` columns.
`;
}

function pomXml(options, pkg) {
  const parent = options.monorepo
    ? `  <parent>
    <groupId>com.vn9melody.openerp.plugins</groupId>
    <artifactId>plugins-parent</artifactId>
    <version>1.0.0</version>
    <relativePath>../pom.xml</relativePath>
  </parent>
`
    : '';
  const coordinates = options.monorepo
    ? ''
    : `  <groupId>${pkg}</groupId>
  <version>1.0.0-SNAPSHOT</version>
`;
  const sdkVersion = options.monorepo ? '${project.version}' : '1.0.0';
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
${parent}${coordinates}  <artifactId>plugin-${options.id}</artifactId>
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
      <groupId>com.vn9melody.openerp.plugins</groupId>
      <artifactId>plugin-sdk</artifactId>
      <version>${sdkVersion}</version>
    </dependency>
    <dependency>
      <groupId>io.quarkus</groupId>
      <artifactId>quarkus-rest-jackson</artifactId>
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

function applicationProperties(options) {
  return `quarkus.http.port=8080
quarkus.smallrye-health.root-path=/q/health
plugin.key=${options.id}
plugin.scope=\${PLUGIN_SCOPE:tenant}
plugin.data.gateway-url=\${PLUGIN_DATA_GATEWAY_URL:}
plugin.data.service-token=\${PLUGIN_SERVICE_TOKEN:}
plugin.data.tls-ca=\${PLUGIN_DATA_TLS_CA:}
plugin.data.tls-cert=\${PLUGIN_DATA_TLS_CERT:}
plugin.data.tls-key=\${PLUGIN_DATA_TLS_KEY:}
plugin.data.deadline-ms=\${PLUGIN_DATA_DEADLINE_MS:15000}
quarkus.redis.hosts=\${QUARKUS_REDIS_HOSTS:redis://localhost:6379}
`;
}

function entity(options, pkg) {
  return `package ${pkg};

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Sample entity (POJO; persistence is owned by the core data gateway). */
public class SampleItem {

    public UUID id;
    public String code;
    public String name;
    public String status;
    public Instant createdAt;

    public static SampleItem from(Map<String, Object> row) {
        SampleItem item = new SampleItem();
        item.id = asUuid(row.get("id"));
        item.code = asString(row.get("code"));
        item.name = asString(row.get("name"));
        item.status = asString(row.get("status"));
        item.createdAt = asInstant(row.get("created_at"));
        return item;
    }

    private static String asString(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private static UUID asUuid(Object value) {
        return value == null ? null : UUID.fromString(String.valueOf(value));
    }

    private static Instant asInstant(Object value) {
        return value == null ? null : Instant.parse(String.valueOf(value));
    }
}
`;
}

function dto(pkg) {
  return `package ${pkg};

import java.time.Instant;
import java.util.UUID;

public record SampleItemDto(UUID id, String code, String name, String status, Instant createdAt) {

    public static SampleItemDto from(SampleItem item) {
        return new SampleItemDto(item.id, item.code, item.name, item.status, item.createdAt);
    }
}
`;
}

function service(pkg) {
  return `package ${pkg};

import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class SampleItemService {

    @Inject
    PluginDataClient client;

    public List<SampleItemDto> list() {
        return client.query("sample.list", Map.of()).rows().stream()
                .map(SampleItem::from)
                .map(SampleItemDto::from)
                .toList();
    }
}
`;
}

function resource(options, pkg) {
  return `package ${pkg};

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.ListData;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

@Path("/api/v1/${options.id}/sample-items")
@Produces(MediaType.APPLICATION_JSON)
public class SampleItemResource {

    @Inject
    SampleItemService service;

    @GET
    public ApiResponse<ListData<SampleItemDto>> list() {
        return ApiResponse.successList(
                "SAMPLE_ITEM_LIST_SUCCESS",
                "Sample items retrieved.",
                service.list());
    }
}
`;
}

function migrationUp(options) {
  const table = `plg_${options.id.replaceAll('-', '_')}_sample_items`;
  return `CREATE TABLE IF NOT EXISTS ${table} (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_${table}_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_${table}_created ON ${table} (created_at DESC);
-- Plugin ${options.id}: this migration runs inside the tenant schema only.
`;
}

function resourceTest(pkg) {
  return `package ${pkg};

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class SampleItemResourceTest {

    @Test
    public void healthEndpointResponds() {
        given()
            .when().get("/q/health/ready")
            .then().statusCode(200);
    }
}
`;
}

function dockerfile() {
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
  const id = options.id;
  const titleKey = `PLUGIN_${id.toUpperCase().replaceAll('-', '_')}_MENU`;
  const headerKey = `PLUGIN_${id.toUpperCase().replaceAll('-', '_')}_HEADER`;
  const emptyKey = `PLUGIN_${id.toUpperCase().replaceAll('-', '_')}_EMPTY`;
  const project = `plugin-${id}-web`;
  const appTag = `op-${id}-app`;
  const headerTag = `op-${id}-header`;
  const dictionaries = {
    vi: { [titleKey]: options.name, [headerKey]: options.name, [emptyKey]: 'Chưa có dữ liệu.' },
    en: { [titleKey]: options.name, [headerKey]: options.name, [emptyKey]: 'No data yet.' },
  };
  return {
    'web/package.json': `{
  "name": "@open-erp/${project}",
  "private": true,
  "scripts": {
    "start": "ng serve --port 4300",
    "build": "ng build"
  },
  "dependencies": {
    "@angular/common": "^22.0.0",
    "@angular/compiler": "^22.0.0",
    "@angular/core": "^22.0.0",
    "@angular/elements": "^22.0.0",
    "@angular/forms": "^22.0.0",
    "@angular/platform-browser": "^22.0.0",
    "rxjs": "^7.8.1",
    "tslib": "^2.6.0"
  },
  "devDependencies": {
    "@angular/build": "^22.0.1",
    "@angular/cli": "^22.0.1",
    "@angular/compiler-cli": "^22.0.0",
    "@tailwindcss/postcss": "^4.1.12",
    "postcss": "^8.5.3",
    "tailwindcss": "^4.1.12",
    "typescript": "~6.0.2"
  }
}
`,
    'web/angular.json': `{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "cli": {
    "packageManager": "npm"
  },
  "projects": {
    "${project}": {
      "projectType": "application",
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular/build:application",
          "options": {
            "browser": "src/plugin-main.ts",
            "index": "src/index.html",
            "tsConfig": "tsconfig.app.json",
            "outputPath": {
              "base": "dist",
              "browser": ""
            },
            "assets": [
              {
                "glob": "**/*.json",
                "input": "public/i18n",
                "output": "i18n"
              }
            ],
            "styles": [
              "src/styles.css"
            ]
          },
          "configurations": {
            "production": {
              "outputHashing": "none",
              "budgets": [
                {
                  "type": "initial",
                  "maximumWarning": "1MB",
                  "maximumError": "4MB"
                }
              ]
            },
            "development": {
              "optimization": false,
              "sourceMap": true,
              "outputHashing": "none"
            }
          },
          "defaultConfiguration": "production"
        },
        "serve": {
          "builder": "@angular/build:dev-server",
          "configurations": {
            "production": {
              "buildTarget": "${project}:build:production"
            },
            "development": {
              "buildTarget": "${project}:build:development"
            }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}
`,
    'web/tsconfig.json': `{
  "compileOnSave": false,
  "compilerOptions": {
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "experimentalDecorators": true,
    "importHelpers": true,
    "target": "ES2022",
    "module": "preserve"
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true
  },
  "files": [],
  "references": [
    {
      "path": "./tsconfig.app.json"
    }
  ]
}
`,
    'web/tsconfig.app.json': `{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "src/**/*.spec.ts"
  ]
}
`,
    'web/.postcssrc.json': `{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
`,
    'web/src/index.html': `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${options.name}</title>
  <base href="/">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <${appTag}></${appTag}>
</body>
</html>
`,
    'web/src/styles.css': `@import "tailwindcss";
@source './';
`,
    'web/src/plugin-main.ts': `import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { PluginScreenComponent } from './app/plugin-screen.component';
import { HeaderActionComponent } from './app/header-action.component';

const authHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('openerp_token');
  const sessionId = localStorage.getItem('openerp_session_id');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = \`Bearer \${token}\`;
  if (sessionId) headers['X-Session-Id'] = sessionId;
  return next(Object.keys(headers).length ? req.clone({ setHeaders: headers }) : req);
};

async function bootstrap(): Promise<void> {
  const app = await createApplication({
    providers: [
      provideBrowserGlobalErrorListeners(),
      provideHttpClient(withInterceptors([authHeaderInterceptor])),
    ],
  });
  customElements.define('${appTag}', createCustomElement(PluginScreenComponent, { injector: app.injector }));
  customElements.define('${headerTag}', createCustomElement(HeaderActionComponent, { injector: app.injector }));
}

void bootstrap();
`,
    'web/src/app/translate.pipe.ts': `import { Pipe, PipeTransform } from '@angular/core';

const DICTIONARIES: Record<string, Record<string, string>> = ${JSON.stringify(dictionaries, null, 2)};

@Pipe({ name: 'translate', standalone: true })
export class TranslatePipe implements PipeTransform {
  transform(key: string): string {
    const lang = typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en' : 'vi';
    return DICTIONARIES[lang]?.[key] ?? DICTIONARIES['vi']?.[key] ?? key;
  }
}
`,
    'web/src/app/plugin-screen.component.ts': `import { Component } from '@angular/core';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-plugin-screen',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './plugin-screen.component.html',
})
export class PluginScreenComponent {
  readonly titleKey = '${titleKey}';
  readonly emptyKey = '${emptyKey}';
}
`,
    'web/src/app/plugin-screen.component.html': `<section class="min-h-screen bg-surface text-ink p-2 text-sm">
  <h1 class="text-xs font-semibold">{{ titleKey | translate }}</h1>
  <p class="text-xs text-muted">{{ emptyKey | translate }}</p>
</section>
`,
    'web/src/app/header-action.component.ts': `import { Component, Input } from '@angular/core';
import { TranslatePipe } from './translate.pipe';

@Component({
  selector: 'app-header-action',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './header-action.component.html',
})
export class HeaderActionComponent {
  @Input() context: unknown;
  readonly titleKey = '${headerKey}';
}
`,
    'web/src/app/header-action.component.html': `<button
  type="button"
  class="inline-flex min-h-8 min-w-8 items-center justify-center border border-topbar-border px-2 text-xs text-topbar-text hover:bg-topbar-text/10"
  [attr.aria-label]="titleKey | translate"
>
  {{ titleKey | translate }}
</button>
`,
    'web/public/i18n/vi.json': `${JSON.stringify(dictionaries.vi, null, 2)}\n`,
    'web/public/i18n/en.json': `${JSON.stringify(dictionaries.en, null, 2)}\n`,
  };
}
