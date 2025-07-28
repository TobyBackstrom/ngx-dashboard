/*
 * Public API Surface of ngx-dashboard
 */

// Main dashboard components
export * from './lib/dashboard/dashboard.component';
export * from './lib/dashboard-editor/dashboard-editor.component';
export * from './lib/dashboard-viewer/dashboard-viewer.component';
export * from './lib/widget-list/widget-list.component';

// Public Services
export * from './lib/services/dashboard.service';

// Store is now internal - removed from public API

// Public Models and interfaces
// TODO: not everything should be exported
export * from './lib/models';

// Providers
export * from './lib/providers';
