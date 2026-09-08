/**
 * Outcome of a grid resize request (e.g. `DashboardComponent.setGridSize()`
 * or an editor drag-handle commit).
 *
 * The dashboard uses a clamp-to-content policy: a requested size that would
 * push an existing widget outside the grid is snapped up to the smallest size
 * that still contains every widget's full footprint. A request is also capped
 * at the configured maximum (`DashboardComponent.maxRows` / `maxColumns`).
 * The fields below report the size that was actually applied, not the size
 * that was requested.
 */
export interface GridResizeResult {
  /** Rows actually applied after clamping. */
  rows: number;
  /** Columns actually applied after clamping. */
  columns: number;
  /**
   * True when the applied size differs from the requested one — either
   * snapped up to keep widgets in bounds, or capped at the maximum.
   */
  clamped: boolean;
}
