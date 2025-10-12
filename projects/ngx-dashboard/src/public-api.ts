/*
 * Public API Surface of ngx-dashboard
 */

// Main dashboard components
export { DashboardComponent } from './lib/dashboard/dashboard.component';
export { WidgetListComponent } from './lib/widget-list/widget-list.component';

// Dashboard viewer types (for selection feature)
export type { GridSelection } from './lib/models/grid-selection';

// Public Services
export { DashboardService } from './lib/services/dashboard.service';

// Core Widget Types
export type { Widget, WidgetMetadata } from './lib/models/widget';

// Data Transfer Types
export type {
  DashboardDataDto,
  CellDataDto,
} from './lib/models/dashboard-data.dto';
export type { ReservedSpace } from './lib/models/reserved-space';

// Utility Functions
export {
  createEmptyDashboard,
  createDefaultDashboard,
} from './lib/models/dashboard-data.utils';

// Provider exports for advanced customization
export { CELL_SETTINGS_DIALOG_PROVIDER } from './lib/providers/cell-settings-dialog/cell-settings-dialog.tokens';
export { DefaultCellSettingsDialogProvider } from './lib/providers/cell-settings-dialog/default-cell-settings-dialog.provider';
export { CellSettingsDialogProvider } from './lib/providers/cell-settings-dialog/cell-settings-dialog.provider';
