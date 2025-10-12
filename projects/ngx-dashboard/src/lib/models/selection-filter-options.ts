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
}
