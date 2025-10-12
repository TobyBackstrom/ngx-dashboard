/**
 * Options for filtering and exporting a selection of the dashboard.
 *
 * Used when exporting a subset of the dashboard based on a grid selection.
 * Provides control over how the selection bounds are calculated and applied.
 */
export interface SelectionFilterOptions {
  /**
   * If true, shrink the export bounds to the minimal bounding box containing all widgets.
   * If false or undefined (default), use the selection bounds as-is.
   *
   * When enabled, the exported dashboard will be tightly cropped to only include
   * the space occupied by widgets, removing any empty cells around the edges.
   *
   * @default false
   *
   * @example
   * ```typescript
   * // Export with minimal bounds (tight crop around widgets)
   * const data = dashboard.exportDashboard(selection, { useMinimalBounds: true });
   *
   * // Export with full selection bounds (preserve empty space)
   * const data = dashboard.exportDashboard(selection, { useMinimalBounds: false });
   * ```
   */
  useMinimalBounds?: boolean;

  /**
   * Number of cells to add as padding on each side of the export bounds.
   *
   * Padding expands the export area by adding empty cells around the selection.
   * A padding value of 1 adds 1 row above, 1 row below, 1 column to the left,
   * and 1 column to the right of the bounds.
   *
   * When used with `useMinimalBounds: true`, padding is applied AFTER the bounds
   * are shrunk to the minimal bounding box containing all widgets.
   *
   * The minimum row and column values are clamped to 1 (grid coordinates are 1-based),
   * so padding will not extend below the grid origin.
   *
   * @default 0
   *
   * @example
   * ```typescript
   * // Export with 1 cell of padding on all sides
   * const data = dashboard.exportDashboard(selection, { padding: 1 });
   *
   * // Export with minimal bounds and 2 cells of padding
   * const data = dashboard.exportDashboard(selection, {
   *   useMinimalBounds: true,
   *   padding: 2
   * });
   * ```
   */
  padding?: number;
}
