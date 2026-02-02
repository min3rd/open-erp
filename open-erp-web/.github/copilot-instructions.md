
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Internationalization (i18n)

- **MANDATORY**: Use Transloco for all user-facing text and messages
- Never hardcode English or any language strings in templates or TypeScript files
- All text must be translatable through Transloco translation keys
- Define translation keys in `public/i18n/en.json` and `public/i18n/es.json`
- Use the `transloco` pipe in templates: `{{ 'key.path' | transloco }}`
- Use `TranslocoService.translate()` in TypeScript files for dynamic translations
- For parameterized translations, use: `{{ 'key' | transloco: { param: value } }}`
- Group related translations under logical namespaces (e.g., `userList.*`, `login.*`)

## PrimeNG Component Templates

- **MANDATORY**: Use the new PrimeNG template syntax with `#templateName` instead of `pTemplate="templateName"`
- Examples of correct syntax:
  - Toolbar: `<ng-template #start>` and `<ng-template #end>`
  - Table: `<ng-template #header>`, `<ng-template #body>`, `<ng-template #empty>`
  - SelectButton/Dropdown: `<ng-template #item>`
  - Dialog: `<ng-template #header>`, `<ng-template #footer>`
- Do NOT use the deprecated `pTemplate` directive syntax
- Always consult the official PrimeNG documentation for the correct template names for each component

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).
- **Do NOT use inline styles** - use Tailwind CSS utility classes instead
- Avoid using `[style]` or `style=""` attributes; prefer class bindings and Tailwind classes

## DOM Element ID Requirements

**CRITICAL: All DOM elements MUST have unique `id` attributes**

### ID Naming Convention

- Use kebab-case for all IDs
- Prefix IDs with the component/page name to ensure uniqueness
- Use descriptive names that indicate the element's purpose
- For form fields, use pattern: `{component}-{field-name}` (e.g., `login-username`, `register-email`)
- For error messages, use pattern: `{component}-{field-name}-error` (e.g., `login-username-error`)
- For buttons, use pattern: `{component}-{action}-button` (e.g., `login-submit-button`)
- For containers/wrappers, use pattern: `{component}-{section}-{type}` (e.g., `login-container`, `login-form-wrapper`)

### Examples

```html
<!-- Login Component -->
<div id="login-container">
  <form id="login-form">
    <input id="login-username" type="text" />
    <small id="login-username-error">Error message</small>
    <button id="login-submit-button">Login</button>
  </form>
</div>

<!-- Register Component -->
<div id="register-container">
  <form id="register-form">
    <input id="register-email" type="email" />
    <small id="register-email-error">Error message</small>
    <button id="register-submit-button">Register</button>
  </form>
</div>
```

### Why IDs are Required

- **Accessibility**: Screen readers and assistive technologies rely on unique IDs for proper navigation
- **Testing**: Automated tests use IDs to locate and interact with elements reliably
- **Debugging**: Unique IDs make it easier to trace and debug issues in the application
- **SEO**: Search engines use IDs to understand page structure better
- **Form Labels**: Labels must reference form inputs by ID for accessibility

### Important Notes

- NEVER reuse the same ID across different components or pages
- Always assign IDs to interactive elements (buttons, inputs, links)
- Assign IDs to major container elements for navigation and testing
- IDs must be unique within the entire document, not just the component
- When in doubt, always add an ID rather than omitting it

## Data Operation Screen Layout

- When creating data operation screens, follow this layout:
  - **Toolbar:** a header toolbar at the top containing the title and primary actions.
  - **Content:** the content area below the toolbar containing forms, tables, or interactive components.
- The overall application layout must fit within a single viewport and must NOT scroll the whole page.
- Only allow scrolling within the `content` area when its content exceeds the visible height; the toolbar and header must be fixed and always visible.
- Use IDs for containers with the convention: `{component}-toolbar`, `{component}-content` (e.g., `user-edit-toolbar`, `user-edit-content`).
- Ensure accessibility: proper keyboard focus management, status/error announcements inside the `content` area, and appropriate ARIA attributes.

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Integration & Architecture

- When integrating with backend APIs you **MUST** clone the `open-erp-backend` repository locally and run it to perform integration tests alongside unit tests. Integration PRs should include instructions (or npm scripts) to start the backend for local testing and CI where applicable.
- Always use Angular **Route Resolvers** to preload data required by a screen; data needed for rendering must be fetched by a resolver so the route activates only after preload completes.
- Design routes to capture and persist user view state and actions (filters, sorts, active view, pagination). Use route parameters and/or query parameters to enable traceability and reproducibility of user interactions.
- Do **not** implement branching in the UI to handle legacy vs newest API formats; assume the **newest API format** by default. If legacy support is required, it must be handled in a dedicated compatibility layer and explicitly documented.
- Common component options (e.g., page size options, base map layers, default tile providers) should be declared as shared UI constants (for example `src/core/ui-constants.ts`) and reused across components to ensure consistency.

