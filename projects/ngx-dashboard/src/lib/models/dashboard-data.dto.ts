// dashboard-data.dto.ts
/**
 * Serializable data format for dashboard export/import functionality.
 * This format can be safely converted to/from JSON for persistence.
 * Corresponds to the persistent state from the dashboard store features.
 */
export interface DashboardDataDto {
  /** Version for future compatibility and migration support */
  version: string;

  /** Unique dashboard identifier managed by the client */
  dashboardId: string;

  /** Grid dimensions */
  rows: number;
  columns: number;
  gutterSize: string;

  /** Array of serializable cell data */
  cells: CellDataDto[];
}

/**
 * Serializable version of CellData that can be safely JSON stringified.
 * Converts non-serializable types (CellId, WidgetFactory) to serializable equivalents.
 */
export interface CellDataDto {
  /** Grid position */
  row: number;
  col: number;

  /** Cell span */
  rowSpan: number;
  colSpan: number;

  /** Display settings */
  flat?: boolean;

  /** Widget type identifier for factory lookup during import */
  widgetTypeid: string;

  /** Raw widget state (must be JSON serializable) */
  widgetState: unknown;
}
