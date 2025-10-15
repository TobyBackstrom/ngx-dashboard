import { DashboardDataDto } from './dashboard-data.dto';

/**
 * Creates an empty dashboard configuration with the specified dimensions.
 * This is a convenience function for creating a basic dashboard without any cells.
 *
 * @param dashboardId - Unique identifier for the dashboard (managed by client)
 * @param rows - Number of rows in the dashboard grid
 * @param columns - Number of columns in the dashboard grid
 * @param gutterSize - CSS size for the gutter between cells (default: '0.5em')
 * @returns A DashboardDataDto configured with the specified dimensions and no cells
 *
 * @example
 * // Create an 8x16 dashboard with default gutter
 * const dashboard = createEmptyDashboard('my-dashboard-1', 8, 16);
 *
 * @example
 * // Create a 5x10 dashboard with custom gutter
 * const dashboard = createEmptyDashboard('my-dashboard-2', 5, 10, '0.5rem');
 */
export function createEmptyDashboard(
  dashboardId: string,
  rows: number,
  columns: number,
  gutterSize = '0.5em'
): DashboardDataDto {
  return {
    version: '1.1.0',
    dashboardId,
    rows,
    columns,
    gutterSize,
    cells: [],
  };
}

/**
 * Creates a default dashboard configuration with standard dimensions.
 * This provides a reasonable starting point for most use cases.
 *
 * @param dashboardId - Unique identifier for the dashboard (managed by client)
 * @returns A DashboardDataDto with 8 rows, 16 columns, and 0.5em gutter
 *
 * @example
 * const dashboard = createDefaultDashboard('my-dashboard-id');
 */
export function createDefaultDashboard(dashboardId: string): DashboardDataDto {
  return createEmptyDashboard(dashboardId, 8, 16, '0.5em');
}
