// grid-config.ts

/**
 * Committed grid geometry.
 *
 * Mirrors the persisted shape in `DashboardDataDto` so a host can round-trip
 * it without a mapper. Emitted by `DashboardComponent.gridConfigChanged` and
 * readable at any time from `DashboardComponent.gridConfig()`.
 */
export interface GridConfig {
  /** Committed row count (never the in-progress drag preview). */
  rows: number;
  /** Committed column count (never the in-progress drag preview). */
  columns: number;
  /** CSS length; always a value that has passed `sanitizeGutterSize()`. */
  gutterSize: string;
}

/**
 * Upper bound applied to a requested grid size.
 *
 * The content floor outranks this ceiling: a dashboard that already exceeds
 * the cap keeps its size rather than losing widgets. See `clampGridSize()`.
 */
export interface GridSizeLimits {
  maxRows: number;
  maxColumns: number;
}

/**
 * Default ceiling, overridable per dashboard via `DashboardComponent.maxRows`
 * / `maxColumns`.
 *
 * The editor renders one drop-zone component per cell, so the cap is what
 * keeps a typed size from materializing an unbounded number of components —
 * a cliff a drag gesture cannot reach but a number field can. The default is
 * generous enough that no plausible dashboard hits it.
 */
export const DEFAULT_GRID_SIZE_LIMITS: GridSizeLimits = {
  maxRows: 64,
  maxColumns: 128,
};
