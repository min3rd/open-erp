import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeFile } from '../fsx.js';
import { validateManifest } from '../manifest.js';
import { packageName } from '../templates.js';

/**
 * Generate Angular list/drawer/form + Java DTO/service/resource for one entity.
 * Data access stays inside the plugin SDK; the generated Java never touches a DB.
 */
export function generateCrud(flags) {
  const dir = process.cwd();
  const manifest = readManifestLocal(dir);
  const entityName = flags.entity;
  if (!entityName) {
    throw new Error('--entity is required (e.g. Invoice)');
  }
  const entity = (manifest.entities || []).find((item) => item.name === entityName);
  if (!entity) {
    throw new Error(`entity not found: ${entityName}`);
  }
  const id = manifest.id;
  const entityKey = snake(entityName);
  const tag = `op-${id}-${entityKey.replaceAll('_', '-')}`;
  const defaultRoute = `/apps/${id}/${entityKey.replaceAll('_', '-')}`;
  const route = (typeof flags.route === 'string' ? flags.route : defaultRoute).replace(/\/+$/, '');
  const fields = (entity.fields || []).map((field) => ({ ...field }));
  if (fields.length === 0) {
    throw new Error(`entity ${entityName} has no fields`);
  }
  const columnNames = listFlag(flags.columns) || fields.slice(0, 4).map((field) => field.name);
  const formNames = listFlag(flags.formFields) || fields.map((field) => field.name);
  const columns = columnNames.map((name) => requireField(fields, name));
  const formFields = formNames.map((name) => requireField(fields, name));
  const layout = flags.layout || 'list';
  if (layout !== 'list') {
    throw new Error('--layout currently supports "list"');
  }

  const pkg = packageName(id);
  const pkgPath = pkg.replaceAll('.', '/');
  const classBase = entityName;
  const dtoClass = `${classBase}Dto`;
  const serviceClass = `${classBase}Service`;
  const resourceClass = `${classBase}Resource`;
  const componentClass = `${classBase}CrudComponent`;
  const files = new Map();
  files.set(`src/main/java/${pkgPath}/${dtoClass}.java`, javaDto(pkg, classBase, fields));
  files.set(`src/main/java/${pkgPath}/${serviceClass}.java`, javaService(pkg, id, classBase, dtoClass, fields, entityKey));
  files.set(`src/main/java/${pkgPath}/${resourceClass}.java`, javaResource(pkg, id, classBase, dtoClass, serviceClass, entityKey));
  files.set(`src/test/java/${pkgPath}/${classBase}DtoTest.java`, javaDtoTest(pkg, classBase, dtoClass, fields));

  const hasWeb = existsSync(join(dir, 'web/src/plugin-main.ts'));
  if (hasWeb) {
    files.set(`web/src/app/features/${entityKey}/${entityKey}.service.ts`, webService(id, classBase, entityKey));
    files.set(`web/src/app/features/${entityKey}/${entityKey}-crud.component.ts`, webComponent(id, entityKey, classBase, componentClass, columns, formFields, tag));
    files.set(`web/src/app/features/${entityKey}/${entityKey}-crud.component.html`, webTemplate(entityKey, classBase, columns, formFields));
  }

  const writeList = [...files.entries()].filter(([path]) => !existsSync(join(dir, path)));
  const existing = [...files.keys()].filter((path) => existsSync(join(dir, path)));
  if (existing.length > 0 && !flags.force) {
    throw new Error(`already exists: ${existing.join(', ')} (use --force)`);
  }
  if (flags.dryRun) {
    console.log(`Dry run: ${writeList.length} file(s), ${existing.length} overwrite(s)`);
    for (const [path] of files) {
      console.log(`  ${path}`);
    }
    return;
  }
  for (const [path, content] of files) {
    if (existsSync(join(dir, path)) && !flags.force) {
      continue;
    }
    writeFile(join(dir, path), content);
  }

  if (hasWeb) {
    patchPluginMain(dir, componentClass, entityKey, tag);
  }
  patchManifest(manifest, dir, entityName, entityKey, route, tag, columns, formFields, layout, id);
  patchQueries(manifest, id, entityName, entityKey, fields);
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    throw new Error(`generated manifest is invalid: ${errors.join('; ')}`);
  }
  writeManifestLocal(dir, manifest);
  console.log(`Generated CRUD for ${entityName}`);
  console.log(`  route: ${route}`);
  console.log(`  tag: ${tag}`);
  console.log(`  files: ${files.size}`);
}

function listFlag(value) {
  if (!value || value === true) {
    return null;
  }
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function requireField(fields, name) {
  const field = fields.find((item) => item.name === name);
  if (!field) {
    throw new Error(`field not found: ${name}`);
  }
  return field;
}

function javaDto(pkg, classBase, fields) {
  const components = ['UUID id', ...fields.map((field) => `${javaType(field.type)} ${field.name}`), 'Instant createdAt'];
  const mapping = [
    '        id = asUuid(row.get("id"));',
    ...fields.map((field) => `        ${field.name} = ${converter(field.type)}(row.get("${field.name}"));`),
    '        createdAt = asInstant(row.get("created_at"));',
  ].join('\n');
  return `package ${pkg};

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** ${classBase} transport DTO; mapping stays independent from persistence. */
public record ${classBase}Dto(${components.join(', ')}) {

    public static ${classBase}Dto from(Map<String, Object> row) {
        if (row == null || row.isEmpty()) {
            return null;
        }
        UUID id;
${fields.length > 0 ? fields.map((field) => `        ${javaType(field.type)} ${field.name};`).join('\n') : '        // no business fields'}
        Instant createdAt;
${mapping}
        return new ${classBase}Dto(id, ${fields.map((field) => field.name).concat('createdAt').join(', ')});
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

    private static BigDecimal asDecimal(Object value) {
        return value == null ? null : new BigDecimal(String.valueOf(value));
    }

    private static Integer asInt(Object value) {
        return value == null ? null : Integer.valueOf(String.valueOf(value));
    }

    private static Long asLong(Object value) {
        return value == null ? null : Long.valueOf(String.valueOf(value));
    }

    private static Boolean asBool(Object value) {
        return value == null ? null : Boolean.valueOf(String.valueOf(value));
    }
}
`;
}

function javaService(pkg, id, classBase, dtoClass, fields, entityKey) {
  const listId = `${id}.${entityKey}.list`;
  const getId = `${id}.${entityKey}.get`;
  const insertId = `${id}.${entityKey}.create`;
  const updateId = `${id}.${entityKey}.update`;
  const deleteId = `${id}.${entityKey}.delete`;
  const errorPrefix = `${id}_${entityKey}`.toUpperCase().replaceAll('-', '_');
  const required = fields.filter((field) => field.required);
  const validation = required.length === 0
    ? ''
    : required.map((field) => {
      if (['string', 'text', 'enum', 'date', 'datetime', 'uuid', 'json'].includes(field.type)) {
        return `        if (request.${field.name}() == null || String.valueOf(request.${field.name}()).isBlank()) {
            throw new ApiException(400, "${errorPrefix}_${field.name.toUpperCase()}_REQUIRED", "${field.name} is required");
        }`;
      }
      return `        if (request.${field.name}() == null) {
            throw new ApiException(400, "${errorPrefix}_${field.name.toUpperCase()}_REQUIRED", "${field.name} is required");
        }`;
    }).join('\n');
  const params = fields.map((field) => `        params.put("${field.name}", request.${field.name}());`).join('\n');
  return `package ${pkg};

import com.vn9melody.openerp.plugin.sdk.api.ApiException;
import com.vn9melody.openerp.plugin.sdk.data.PluginDataClient;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@ApplicationScoped
public class ${classBase}Service {

    @Inject
    PluginDataClient client;

    public Page list(int page, int size, String q) {
        Map<String, Object> params = new HashMap<>();
        params.put("page", Math.max(page, 0));
        params.put("size", Math.min(Math.max(size, 1), 100));
        if (q != null && !q.isBlank()) {
            params.put("q", q.trim());
        }
        var result = client.query("${listId}", params);
        List<${dtoClass}> items = result.rows().stream().map(${dtoClass}::from).toList();
        return new Page(items, result.totalRows());
    }

    public ${dtoClass} get(UUID id) {
        var result = client.query("${getId}", Map.of("id", id));
        ${dtoClass} item = ${dtoClass}.from(result.first());
        if (item == null) {
            throw notFound();
        }
        return item;
    }

    public ${dtoClass} create(${dtoClass} request) {
        validate(request);
        var result = client.write("${insertId}", values(request));
        ${dtoClass} item = ${dtoClass}.from(result.first());
        if (item == null) {
            throw new ApiException(500, "${errorPrefix}_CREATE_FAILED", "Could not create ${classBase}");
        }
        return item;
    }

    public ${dtoClass} update(UUID id, ${dtoClass} request) {
        validate(request);
        Map<String, Object> params = values(request);
        params.put("id", id);
        var result = client.write("${updateId}", params);
        ${dtoClass} item = ${dtoClass}.from(result.first());
        if (item == null) {
            throw notFound();
        }
        return item;
    }

    public void delete(UUID id) {
        var result = client.write("${deleteId}", Map.of("id", id));
        if (result.affectedRows() == 0) {
            throw notFound();
        }
    }

    private Map<String, Object> values(${dtoClass} request) {
        Map<String, Object> params = new HashMap<>();
${params}
        return params;
    }

    private void validate(${dtoClass} request) {
        if (request == null) {
            throw new ApiException(400, "${errorPrefix}_REQUEST_REQUIRED", "Request body is required");
        }
${validation}
    }

    private ApiException notFound() {
        return new ApiException(404, "${errorPrefix}_NOT_FOUND", "${classBase} was not found");
    }

    public record Page(List<${dtoClass}> items, long totalItems) {}
}
`;
}

function javaResource(pkg, id, classBase, dtoClass, serviceClass, entityKey) {
  const plural = `${entityKey.replaceAll('_', '-')}s`;
  const readPermission = `${id}:${entityKey.replaceAll('_', '-')}:read`;
  const managePermission = `${id}:${entityKey.replaceAll('_', '-')}:manage`;
  const codePrefix = `${id}_${entityKey}`.toUpperCase().replaceAll('-', '_');
  return `package ${pkg};

import com.vn9melody.openerp.plugin.sdk.api.ApiResponse;
import com.vn9melody.openerp.plugin.sdk.api.PagedData;
import com.vn9melody.openerp.plugin.sdk.api.ResponseKey;
import com.vn9melody.openerp.plugin.sdk.runtime.RequirePermission;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import java.util.Map;
import java.util.UUID;

@Path("/api/v1/${id}/${plural}")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ${classBase}Resource {

    @Inject
    ${serviceClass} service;

    @GET
    @RequirePermission("${readPermission}")
    public ApiResponse<PagedData<${dtoClass}>> list(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("q") String q) {
        ${serviceClass}.Page result = service.list(page, size, q);
        return ApiResponse.successPaged(
                "${codePrefix}_LIST_SUCCESS",
                "${classBase} list retrieved.",
                result.items(), page, size, result.totalItems());
    }

    @GET
    @Path("/{id}")
    @RequirePermission("${readPermission}")
    public ApiResponse<${dtoClass}> get(@PathParam("id") UUID id) {
        return ApiResponse.success("${codePrefix}_DETAIL_SUCCESS",
                "${classBase} retrieved.", service.get(id));
    }

    @POST
    @RequirePermission("${managePermission}")
    public ApiResponse<${dtoClass}> create(${dtoClass} request) {
        return ApiResponse.success("${codePrefix}_CREATED",
                "${classBase} created.", service.create(request));
    }

    @PUT
    @Path("/{id}")
    @RequirePermission("${managePermission}")
    public ApiResponse<${dtoClass}> update(@PathParam("id") UUID id, ${dtoClass} request) {
        return ApiResponse.success("${codePrefix}_UPDATED",
                "${classBase} updated.", service.update(id, request));
    }

    @DELETE
    @Path("/{id}")
    @RequirePermission("${managePermission}")
    public ApiResponse<Map<String, Object>> delete(@PathParam("id") UUID id) {
        service.delete(id);
        return ApiResponse.success("${codePrefix}_DELETED", "${classBase} deleted.",
                Map.of(ResponseKey.UPDATED_COUNT.getKey(), 1));
    }
}
`;
}

function javaDtoTest(pkg, classBase, dtoClass, fields) {
  const assertions = fields.map((field) => {
    if (field.type === 'decimal') {
      return `        assertEquals(new BigDecimal("12.50"), dto.${field.name}());`;
    }
    if (field.type === 'bool') {
      return `        assertEquals(Boolean.TRUE, dto.${field.name}());`;
    }
    if (field.type === 'int') {
      return `        assertEquals(7, dto.${field.name}());`;
    }
    if (field.type === 'long') {
      return `        assertEquals(9L, dto.${field.name}());`;
    }
    if (field.type === 'uuid') {
      return `        assertEquals(id, dto.${field.name}());`;
    }
    if (field.type === 'date' || field.type === 'datetime') {
      return `        assertEquals(Instant.parse("2026-01-01T00:00:00Z"), dto.${field.name}());`;
    }
    return `        assertEquals("${field.name}-value", dto.${field.name}());`;
  }).join('\n');
  return `package ${pkg};

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** Mapping check for generated ${classBase} DTO (no database required). */
public class ${classBase}DtoTest {

    @Test
    public void mapsGatewayRow() {
        UUID id = UUID.randomUUID();
        Map<String, Object> row = new HashMap<>();
        row.put("id", id);
${fields.map((field) => `        row.put("${field.name}", ${sampleValue(field, true)});`).join('\n')}
        row.put("created_at", "2026-01-01T00:00:00Z");

        ${dtoClass} dto = ${dtoClass}.from(row);

        assertEquals(id, dto.id());
${assertions}
    }
}
`;
}

function sampleValue(field, asObject = false) {
  switch (field.type) {
    case 'decimal': return asObject ? 'new BigDecimal("12.50")' : '"12.50"';
    case 'int': return '7';
    case 'long': return '9L';
    case 'bool': return 'true';
    case 'uuid': return 'id';
    case 'date':
    case 'datetime': return asObject ? '"2026-01-01T00:00:00Z"' : '"2026-01-01T00:00:00Z"';
    default: return `"${field.name}-value"`;
  }
}

function webService(id, classBase, entityKey) {
  const path = `/api/v1/plugins/runtime/${id}/api/v1/${id}/${entityKey.replaceAll('_', '-')}s`;
  return `import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface ${classBase}Item {
  id: string;
  [key: string]: unknown;
}

export interface ${classBase}Page {
  items: ${classBase}Item[];
  total_items: number;
}

@Injectable({ providedIn: 'root' })
export class ${classBase}Service {
  private http = inject(HttpClient);
  private runtimeOrigin = '';
  private get base(): string {
    return \`\${this.runtimeOrigin}${path}\`;
  }

  /** Core host passes its backend origin when the plugin is mounted cross-origin. */
  setRuntimeOrigin(origin: string): void {
    this.runtimeOrigin = (origin ?? '').replace(/\\/$/, '');
  }

  async list(page: number, size: number, q: string): Promise<${classBase}Page> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q.trim()) {
      params = params.set('q', q.trim());
    }
    const response = await firstValueFrom(
      this.http.get<{ data?: ${classBase}Page }>(this.base, { params })
    );
    return response.data ?? { items: [], total_items: 0 };
  }

  async create(payload: Record<string, unknown>): Promise<void> {
    await firstValueFrom(this.http.post(this.base, payload));
  }

  async update(id: string, payload: Record<string, unknown>): Promise<void> {
    await firstValueFrom(this.http.put(\`\${this.base}/\${id}\`, payload));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(\`\${this.base}/\${id}\`));
  }
}
`;
}

function webComponent(id, entityKey, classBase, componentClass, columns, formFields, tag) {
  const titleKey = `${id.toUpperCase().replaceAll('-', '_')}_${entityKey.toUpperCase()}_TITLE`;
  const addKey = `${id.toUpperCase().replaceAll('-', '_')}_${entityKey.toUpperCase()}_ADD`;
  const fields = formFields.map((field) => `    ${field.name}: ${defaultJs(field)},`).join('\n');
  return `import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../translate.pipe';
import { ${classBase}Item, ${classBase}Service } from './${entityKey}.service';

@Component({
  selector: '${tag}',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './${entityKey}-crud.component.html',
})
export class ${componentClass} implements OnInit {
  private service = inject(${classBase}Service);

  @Input()
  set apiBaseUrl(value: string) {
    this.service.setRuntimeOrigin(value);
  }

  readonly titleKey = '${titleKey}';
  readonly addKey = '${addKey}';
  readonly columns = [${columns.map((field) => `'${field.name}'`).join(', ')}] as const;
  readonly items = signal<${classBase}Item[]>([]);
  readonly page = signal(0);
  readonly size = signal(20);
  readonly total = signal(0);
  readonly q = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly drawerOpen = signal(false);
  readonly editing = signal<${classBase}Item | null>(null);
  readonly pendingDelete = signal<string | null>(null);
  readonly saving = signal(false);
  readonly form = signal<Record<string, unknown>>({
${fields}
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.service.list(this.page(), this.size(), this.q());
      this.items.set(result.items);
      this.total.set(result.total_items);
    } catch {
      this.error.set('COMMON_ERROR');
    } finally {
      this.loading.set(false);
    }
  }

  search(value: string): void {
    this.q.set(value);
    this.page.set(0);
    void this.load();
  }

  nextPage(): void {
    if ((this.page() + 1) * this.size() < this.total()) {
      this.page.update((value) => value + 1);
      void this.load();
    }
  }

  previousPage(): void {
    if (this.page() > 0) {
      this.page.update((value) => value - 1);
      void this.load();
    }
  }

  openCreate(): void {
    this.editing.set(null);
    this.form.set({${formFields.map((field) => `${field.name}: ${defaultJs(field)}`).join(', ')}});
    this.drawerOpen.set(true);
  }

  openEdit(item: ${classBase}Item): void {
    this.editing.set(item);
    this.form.set({${formFields.map((field) => `${field.name}: item['${field.name}'] ?? ${defaultJs(field)}`).join(', ')}});
    this.drawerOpen.set(true);
  }

  setField(name: string, value: unknown): void {
    this.form.update((current) => ({ ...current, [name]: value }));
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
    this.editing.set(null);
  }

  async save(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    try {
      const editing = this.editing();
      if (editing) {
        await this.service.update(String(editing['id']), this.form());
      } else {
        await this.service.create(this.form());
      }
      this.closeDrawer();
      await this.load();
    } catch {
      this.error.set('COMMON_ERROR');
    } finally {
      this.saving.set(false);
    }
  }

  askDelete(id: string): void {
    this.pendingDelete.set(id);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  async confirmDelete(id: string): Promise<void> {
    try {
      await this.service.delete(id);
      this.pendingDelete.set(null);
      await this.load();
    } catch {
      this.error.set('COMMON_ERROR');
    }
  }
}
`;
}

function webTemplate(entityKey, classBase, columns, formFields) {
  const headers = columns.map((field) => `          <th class="px-2 py-1 text-start text-[10px] uppercase tracking-wider text-muted">{{ 'PLUGIN_${field.name.toUpperCase()}_LABEL' | translate }}</th>`).join('\n');
  const cells = columns.map((field) => `            <td class="px-2 py-1 text-xs">${cellExpression(field)}</td>`).join('\n');
  const inputs = formFields.map((field) => formInput(field)).join('\n');
  return `<section class="flex min-h-screen flex-col bg-surface p-2 text-xs text-ink">
  <header class="flex flex-wrap items-center justify-between gap-2 border-b border-default pb-2">
    <h1 class="text-sm font-semibold uppercase tracking-wider">{{ titleKey | translate }}</h1>
    <div class="flex items-center gap-1">
      <input
        class="min-h-8 border border-default bg-surface px-2 text-xs"
        [value]="q()"
        (input)="search($any($event.target).value)"
        [placeholder]="'COMMON_SEARCH' | translate"
      />
      <button type="button" class="min-h-8 border border-transparent bg-accent px-2 text-xs text-accent-contrast" (click)="openCreate()">
        {{ addKey | translate }}
      </button>
    </div>
  </header>

  @if (error()) {
    <p class="mt-1 border border-rose-300 bg-rose-50 px-2 py-1 text-[11px] text-rose-700">{{ error() | translate }}</p>
  }

  <div class="mt-2 min-h-0 flex-1 overflow-auto border border-default">
    <table class="w-full border-collapse">
      <thead class="bg-surface-muted">
        <tr>
${headers}
          <th class="px-2 py-1 text-end text-[10px] uppercase tracking-wider text-muted">{{ 'COMMON_ACTIONS' | translate }}</th>
        </tr>
      </thead>
      <tbody>
        @for (item of items(); track item.id) {
          <tr class="border-t border-default">
${cells}
            <td class="px-2 py-1 text-end">
              @if (pendingDelete() === item.id) {
                <button type="button" class="px-1.5 py-0.5 text-[10px] text-rose-700" (click)="confirmDelete(item.id)">
                  {{ 'COMMON_CONFIRM' | translate }}
                </button>
                <button type="button" class="px-1.5 py-0.5 text-[10px]" (click)="cancelDelete()">
                  {{ 'COMMON_CANCEL' | translate }}
                </button>
              } @else {
                <button type="button" class="px-1.5 py-0.5 text-[10px] underline" (click)="openEdit(item)">
                  {{ 'COMMON_EDIT' | translate }}
                </button>
                <button type="button" class="px-1.5 py-0.5 text-[10px] text-rose-700" (click)="askDelete(item.id)">
                  {{ 'COMMON_DELETE' | translate }}
                </button>
              }
            </td>
          </tr>
        } @empty {
          <tr>
            <td class="px-2 py-4 text-center text-[11px] text-muted" [attr.colspan]="columns.length + 1">
              {{ 'COMMON_EMPTY' | translate }}
            </td>
          </tr>
        }
      </tbody>
    </table>
  </div>

  <footer class="mt-1 flex items-center justify-between text-[11px] text-muted">
    <span>{{ page() + 1 }} / {{ (total() / size()) | number:'1.0-0' }}</span>
    <span class="flex gap-1">
      <button type="button" class="border border-default px-2 py-1 disabled:opacity-40" [disabled]="page() === 0" (click)="previousPage()">
        {{ 'COMMON_PREV' | translate }}
      </button>
      <button type="button" class="border border-default px-2 py-1 disabled:opacity-40" [disabled]="(page() + 1) * size() >= total()" (click)="nextPage()">
        {{ 'COMMON_NEXT' | translate }}
      </button>
    </span>
  </footer>

  @if (drawerOpen()) {
    <div class="fixed inset-0 z-20 flex justify-end bg-black/20" (click)="closeDrawer()">
      <aside class="h-full w-full max-w-md border-s border-default bg-surface p-2" (click)="$event.stopPropagation()">
        <header class="flex items-center justify-between border-b border-default pb-1">
          <h2 class="text-xs font-semibold uppercase tracking-wider">
            {{ (editing() ? 'COMMON_EDIT' : 'COMMON_CREATE') | translate }}
          </h2>
          <button type="button" class="px-1 text-xs" (click)="closeDrawer()">×</button>
        </header>
        <form class="mt-2 space-y-2" (ngSubmit)="save()">
${inputs}
          <div class="flex justify-end gap-1 border-t border-default pt-2">
            <button type="button" class="min-h-8 border border-default px-2 text-xs" (click)="closeDrawer()">
              {{ 'COMMON_CANCEL' | translate }}
            </button>
            <button type="submit" class="min-h-8 bg-accent px-2 text-xs text-accent-contrast" [disabled]="saving()">
              {{ 'COMMON_SAVE' | translate }}
            </button>
          </div>
        </form>
      </aside>
    </div>
  }
</section>
`;
}

function formInput(field) {
  const label = `{{ 'PLUGIN_${field.name.toUpperCase()}_LABEL' | translate }}`;
  if (field.type === 'enum') {
    const options = (field.enum_values || []).map((value) => `              <option value="${value}">${value}</option>`).join('\n');
    return `          <label class="block">
            <span class="text-[10px] uppercase tracking-wider text-muted">${label}</span>
            <select name="${field.name}" class="mt-0.5 min-h-8 w-full border border-default bg-surface px-2 text-xs"
              [ngModel]="form()['${field.name}']" (ngModelChange)="setField('${field.name}', $event)">
              <option value=""></option>
${options}
            </select>
          </label>`;
  }
  if (field.type === 'bool') {
    return `          <label class="flex items-center gap-2">
            <input type="checkbox" name="${field.name}"
              [ngModel]="form()['${field.name}']" (ngModelChange)="setField('${field.name}', $event)" />
            <span class="text-[10px] uppercase tracking-wider text-muted">${label}</span>
          </label>`;
  }
  const type = field.type === 'int' || field.type === 'long' || field.type === 'decimal' ? 'number'
    : field.type === 'date' ? 'date'
      : field.type === 'datetime' ? 'datetime-local'
        : 'text';
  return `          <label class="block">
            <span class="text-[10px] uppercase tracking-wider text-muted">${label}</span>
            <input
              name="${field.name}"
              type="${type}"
              class="mt-0.5 min-h-8 w-full border border-default bg-surface px-2 text-xs"
              [ngModel]="form()['${field.name}']" (ngModelChange)="setField('${field.name}', $event)"
            />
          </label>`;
}

function cellExpression(field) {
  if (field.type === 'bool') {
    return `{{ item['${field.name}'] ? '✓' : '—' }}`;
  }
  return `{{ item['${field.name}'] ?? '—' }}`;
}

function patchPluginMain(dir, componentClass, entityKey, tag) {
  const path = join(dir, 'web/src/plugin-main.ts');
  let source = readFileSync(path, 'utf8');
  if (!source.includes(tag)) {
    const importLine = `import { ${componentClass} } from './app/features/${entityKey}/${entityKey}-crud.component';\n`;
    source = `${importLine}${source}`;
    source = source.replace(
      /(\n\s*customElements\.define\([^\n]+\n)/,
      `$1  customElements.define('${tag}', createCustomElement(${componentClass}, { injector: app.injector }));\n`
    );
    writeFile(path, source);
  }
}

function patchManifest(manifest, dir, entityName, entityKey, route, tag, columns, formFields, layout, id) {
  const read = `${id}:${entityKey.replaceAll('_', '-')}:read`;
  manifest.ui_manifest = manifest.ui_manifest || { contract_version: '1.0', screens: [], contributions: [], slots: [], crud: [] };
  manifest.ui_manifest.crud = manifest.ui_manifest.crud || [];
  const crud = manifest.ui_manifest.crud.find((item) => item.entity === entityName);
  const metadata = {
    entity: entityName,
    route,
    columns: columns.map((field) => field.name),
    filters: ['q'],
    form_fields: formFields.map((field) => field.name),
    layout,
  };
  if (crud) {
    Object.assign(crud, metadata);
  } else {
    manifest.ui_manifest.crud.push(metadata);
  }
  manifest.ui_manifest.screens = manifest.ui_manifest.screens || [];
  const titleKey = `${id.toUpperCase().replaceAll('-', '_')}_${entityKey.toUpperCase()}_TITLE`;
  if (!manifest.ui_manifest.screens.some((screen) => screen.route === route)) {
    manifest.ui_manifest.screens.push({
      route,
      title_key: titleKey,
      permission: read,
      render_mode: 'WEB_COMPONENT',
      entry: `/plugins-runtime/${id}/main.js`,
      tag_name: tag,
      order: 200,
      platforms: ['desktop', 'mobile'],
    });
  }
  writeI18n(dir, entityName, entityKey, id, columns, formFields);
}

function patchQueries(manifest, id, entityName, entityKey, fields) {
  const select = ['id', ...fields.map((field) => field.name), 'created_at'];
  const returning = [...select];
  const textFields = fields
    .filter((field) => ['string', 'text', 'enum'].includes(field.type))
    .map((field) => field.name);
  const list = {
    id: `${id}.${entityKey}.list`,
    mode: 'READ',
    operation: 'LIST',
    entity: entityName,
    tenant_scope: 'TENANT',
    select,
    ...(textFields.length > 0 ? { search: [{ param: 'q', fields: textFields }] } : {}),
    sort: [{ field: 'created_at', direction: 'DESC' }],
    page: { pageParam: 'page', sizeParam: 'size', maxSize: 100, defaultSize: 20 },
    maxRows: 100,
  };
  const values = Object.fromEntries(fields.map((field) => [
    field.name,
    field.required ? { param: field.name } : { param: field.name, optional: true, allow_null: true },
  ]));
  const queries = [
    list,
    {
      id: `${id}.${entityKey}.get`,
      mode: 'READ',
      operation: 'LIST',
      entity: entityName,
      tenant_scope: 'TENANT',
      select,
      filters: [{ field: 'id', op: 'EQ', param: 'id', required: true }],
      maxRows: 1,
    },
    {
      id: `${id}.${entityKey}.create`,
      mode: 'WRITE',
      operation: 'INSERT',
      entity: entityName,
      tenant_scope: 'TENANT',
      values,
      returning,
    },
    {
      id: `${id}.${entityKey}.update`,
      mode: 'WRITE',
      operation: 'UPDATE',
      entity: entityName,
      tenant_scope: 'TENANT',
      values,
      filters: [{ field: 'id', op: 'EQ', param: 'id', required: true }],
      returning,
    },
    {
      id: `${id}.${entityKey}.delete`,
      mode: 'WRITE',
      operation: 'DELETE',
      entity: entityName,
      tenant_scope: 'TENANT',
      filters: [{ field: 'id', op: 'EQ', param: 'id', required: true }],
      returning: ['id'],
    },
  ];
  manifest.queries = (manifest.queries || []).filter((query) => !queries.some((item) => item.id === query.id));
  manifest.queries.push(...queries);
}

function writeI18n(projectDir, entityName, entityKey, id, columns, formFields) {
  const dir = join(projectDir, 'web/public/i18n');
  const base = `${id.toUpperCase().replaceAll('-', '_')}_${entityKey.toUpperCase()}`;
  const values = {
    vi: {
      [`${base}_TITLE`]: entityName,
      [`${base}_ADD`]: `Thêm ${entityName}`,
      COMMON_SEARCH: 'Tìm kiếm',
      COMMON_CREATE: 'Thêm mới',
      COMMON_EDIT: 'Sửa',
      COMMON_DELETE: 'Xóa',
      COMMON_CONFIRM: 'Xác nhận',
      COMMON_CANCEL: 'Hủy',
      COMMON_SAVE: 'Lưu',
      COMMON_EMPTY: 'Chưa có dữ liệu.',
      COMMON_ACTIONS: 'Thao tác',
      COMMON_PREV: 'Trước',
      COMMON_NEXT: 'Sau',
      COMMON_ERROR: 'Không thể hoàn tất thao tác.',
    },
    en: {
      [`${base}_TITLE`]: entityName,
      [`${base}_ADD`]: `Add ${entityName}`,
      COMMON_SEARCH: 'Search',
      COMMON_CREATE: 'Create',
      COMMON_EDIT: 'Edit',
      COMMON_DELETE: 'Delete',
      COMMON_CONFIRM: 'Confirm',
      COMMON_CANCEL: 'Cancel',
      COMMON_SAVE: 'Save',
      COMMON_EMPTY: 'No data yet.',
      COMMON_ACTIONS: 'Actions',
      COMMON_PREV: 'Previous',
      COMMON_NEXT: 'Next',
      COMMON_ERROR: 'Could not complete the action.',
    },
  };
  const dictionaries = {};
  for (const lang of ['vi', 'en']) {
    const path = join(dir, `${lang}.json`);
    const dict = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {};
    for (const field of columns.concat(formFields)) {
      const key = `${field.name.toUpperCase()}_LABEL`;
      dict[`PLUGIN_${key}`] = field.name;
    }
    Object.assign(dict, values[lang]);
    dictionaries[lang] = dict;
    writeFile(path, `${JSON.stringify(dict, null, 2)}\n`);
  }
  patchTranslatePipe(projectDir, dictionaries);
}

function patchTranslatePipe(dir, dictionaries) {
  const path = join(dir, 'web/src/app/translate.pipe.ts');
  if (!existsSync(path)) {
    return;
  }
  const source = readFileSync(path, 'utf8');
  const start = source.indexOf('const DICTIONARIES');
  const end = start >= 0 ? source.indexOf('};', start) : -1;
  if (start < 0 || end < 0) {
    return;
  }
  const replacement = `const DICTIONARIES: Record<string, Record<string, string>> = ${JSON.stringify(dictionaries, null, 2)};`;
  writeFile(path, `${source.slice(0, start)}${replacement}${source.slice(end + 2)}`);
}

function readManifestLocal(dir) {
  const path = join(dir, 'plugin.json');
  if (!existsSync(path)) {
    throw new Error(`plugin.json not found in ${dir}`);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeManifestLocal(dir, manifest) {
  writeFile(join(dir, 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

function javaType(type) {
  switch (type) {
    case 'decimal': return 'BigDecimal';
    case 'int': return 'Integer';
    case 'long': return 'Long';
    case 'bool': return 'Boolean';
    case 'date':
    case 'datetime': return 'Instant';
    case 'uuid': return 'UUID';
    default: return 'String';
  }
}

function converter(type) {
  switch (type) {
    case 'decimal': return 'asDecimal';
    case 'int': return 'asInt';
    case 'long': return 'asLong';
    case 'bool': return 'asBool';
    case 'date':
    case 'datetime': return 'asInstant';
    case 'uuid': return 'asUuid';
    default: return 'asString';
  }
}

function defaultJs(field) {
  if (field.type === 'bool') return 'false';
  if (field.type === 'int' || field.type === 'long' || field.type === 'decimal') return 'null';
  return "''";
}

function snake(value) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}
