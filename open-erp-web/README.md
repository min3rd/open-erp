# OpenErpWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.4.

## Backend Integration

This frontend application integrates with the [open-erp-backend](https://github.com/min3rd/open-erp-backend) API. 

**Important:** To use the full functionality of this application, you need to run the backend services. See [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) for detailed instructions on:
- Setting up the backend
- Configuring API endpoints
- Handling authentication
- CORS configuration
- Environment setup

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

**Note:** The User List and other data-driven features require the backend to be running. Without the backend, you'll see API errors.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
