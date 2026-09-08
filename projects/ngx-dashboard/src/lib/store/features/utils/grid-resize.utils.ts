import { CellData, GridResizeResult, GridSizeLimits } from '../../../models';
import { calculateMinimalBoundingBox } from './export.utils';

/**
 * Floor a track count to a positive integer, falling back when it is not a
 * finite number — `1` for a request (NaN/Infinity from e.g. parseInt of empty
 * user input must never reach committed state), `Infinity` for a limit (a
 * host may bind an unusable max, which then simply imposes no ceiling).
 */
function toTrackCount(value: number, fallback: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.floor(value)) : fallback;
}

/**
 * Smallest grid that still contains every widget's full footprint — the
 * content floor. The bounding box's max edges are span-aware (a widget at
 * col 14 spanning 3 columns needs at least 16 columns); an empty dashboard
 * floors at 1 x 1.
 *
 * Shared by `clampGridSize()` and the store's `minGridSize` computed so the
 * limit a host displays and the limit the resize enforces cannot drift.
 */
export function minGridSizeFor(cells: CellData[]): {
  rows: number;
  columns: number;
} {
  const bounds = calculateMinimalBoundingBox(cells);
  return { rows: bounds?.maxRow ?? 1, columns: bounds?.maxCol ?? 1 };
}

/**
 * Clamp a requested grid size to the content floor and the configured
 * ceiling. Pure: computes the result but does not mutate any state, so it is
 * shared by both the committed resize (`setGridSize`) and the in-progress
 * drag preview.
 *
 * Values below 1 are treated as 1; fractional values are floored.
 *
 * Ordering matters: the ceiling constrains the *request*, and the content
 * floor is then applied on top of it, so the floor outranks the ceiling. A
 * dashboard loaded from a file with more rows than `maxRows` keeps its rows —
 * capping it would push widgets out of bounds, which is exactly what the
 * clamp-to-content policy exists to prevent. The cap limits what a user can
 * ask for, never what already exists.
 */
export function clampGridSize(
  requestedRows: number,
  requestedColumns: number,
  cells: CellData[],
  limits: GridSizeLimits
): GridResizeResult {
  const min = minGridSizeFor(cells);

  const reqRows = toTrackCount(requestedRows, 1);
  const reqColumns = toTrackCount(requestedColumns, 1);

  const rows = Math.max(min.rows, Math.min(reqRows, toTrackCount(limits.maxRows, Infinity)));
  const columns = Math.max(
    min.columns,
    Math.min(reqColumns, toTrackCount(limits.maxColumns, Infinity))
  );

  return {
    rows,
    columns,
    // Compared against the raw request, so hitting either the content floor
    // or the ceiling reports as clamped — the editor badge signals both.
    clamped: rows !== reqRows || columns !== reqColumns,
  };
}
