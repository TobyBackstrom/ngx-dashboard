/*
 * Public API Surface of ngx-dashboard
 */

// Library version
export { NGX_DASHBOARD_VERSION } from './lib/version';

// Main dashboard components
export { DashboardComponent } from './lib/dashboard/dashboard.component';
export { WidgetListComponent } from './lib/widget-list/widget-list.component';

// Dashboard viewer types (for selection feature)
export type { GridSelection } from './lib/models/grid-selection';
export type { SelectionFilterOptions } from './lib/models/selection-filter-options';

// Public Services
export { DashboardService } from './lib/services/dashboard.service';

// Core Widget Types
export type { Widget, WidgetMetadata } from './lib/models/widget';
export type { WidgetSharedStateProvider } from './lib/models/widget-shared-state-provider';

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

export { EMPTY_CELL_CONTEXT_PROVIDER } from './lib/providers/empty-cell-context/empty-cell-context.tokens';
export { DefaultEmptyCellContextProvider } from './lib/providers/empty-cell-context/default-empty-cell-context.provider';
export { EmptyCellContextProvider } from './lib/providers/empty-cell-context/empty-cell-context.provider';
export type { EmptyCellContext } from './lib/providers/empty-cell-context/empty-cell-context.provider';
export { WidgetListContextMenuProvider } from './lib/providers/empty-cell-context/widget-list-context-menu.provider';
