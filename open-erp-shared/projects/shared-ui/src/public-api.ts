/*
 * Public API Surface of shared-ui
 */

// =============================================
// Base UI Components
// =============================================
export * from './lib/components/button/button.component';
export * from './lib/components/input/input.component';
export * from './lib/components/modal/modal.component';
export * from './lib/components/icon/icon.component';
export * from './lib/components/textarea/textarea.component';
export * from './lib/components/checkbox/checkbox.component';
export * from './lib/components/radio/radio.component';
export * from './lib/components/switch/switch.component';
export * from './lib/components/select/select.component';
export * from './lib/components/badge/badge.component';
export * from './lib/components/avatar/avatar.component';
export * from './lib/components/card/card.component';
export * from './lib/components/tabs/tabs.component';
export * from './lib/components/alert/alert.component';
export * from './lib/components/skeleton/skeleton.component';
export * from './lib/components/table/table.component';
export * from './lib/components/pagination/pagination.component';
export * from './lib/components/toast/toast.component';
export * from './lib/components/toast/toast.service';
export * from './lib/components/tree-view/tree-view.component';
export * from './lib/components/guide-tour/guide-tour.component';

// =============================================
// TSK-2.18: Form Component Library
// =============================================

// Form utility components
export * from './lib/components/form-field-wrapper/form-field-wrapper.component';

// Form primitive components (new)
export * from './lib/components/form-number/form-number.component';
export * from './lib/components/form-date/form-date.component';
export * from './lib/components/form-file/form-file.component';

// Form Renderer (schema-driven)
export * from './lib/components/form-renderer/form-renderer.component';

// =============================================
// Services
// =============================================
export * from './lib/services/auth.service';
export * from './lib/services/config.service';
export * from './lib/services/form-engine.service';

// =============================================
// Models
// =============================================
export * from './lib/models/auth.model';
export * from './lib/models/dynamic-form.model';

// =============================================
// Constants & Directives
// =============================================
export * from './lib/constants/api-endpoints';
export * from './lib/directives/has-permission.directive';
