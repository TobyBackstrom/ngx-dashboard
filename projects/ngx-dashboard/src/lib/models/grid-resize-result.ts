/**
 * Outcome of a grid resize request (e.g. `DashboardComponent.setGridSize()`
 * or an editor drag-handle commit).
 *
 * The dashboard uses a clamp-to-content policy: a requested size that would
 * push an existing widget outside the grid is snapped up to the smallest size
 * that still contains every widget's full footprint. The fields below report
 * the size that was actually applied, not the size that was requested.
 */
export interface GridResizeResult {
  /** Rows actually applied after clamp-to-content. */
  rows: number;
  /** Columns actually applied after clamp-to-content. */
  columns: number;
  /** True when the requested size was clamped up to keep widgets in bounds. */
  clamped: boolean;
}
