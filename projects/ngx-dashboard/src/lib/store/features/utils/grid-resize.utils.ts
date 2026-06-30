import { CellData, GridResizeResult } from '../../../models';
import { calculateMinimalBoundingBox } from './export.utils';

/**
 * Clamp a requested grid size to the smallest size that still contains every
 * widget's full footprint (the content floor). Pure: computes the result but
 * does not mutate any state, so it is shared by both the committed resize
 * (`setGridSize`) and the in-progress drag preview.
 *
 * Values below 1 are treated as 1; fractional values are floored.
 */
export function clampGridSize(
  requestedRows: number,
  requestedColumns: number,
  cells: CellData[]
): GridResizeResult {
  // The bounding box's max edges are span-aware (a widget at col 14 spanning
  // 3 columns needs at least 16 columns). null = empty dashboard.
  const bounds = calculateMinimalBoundingBox(cells);
  const minRows = bounds?.maxRow ?? 1;
  const minColumns = bounds?.maxCol ?? 1;

  const reqRows = Math.max(1, Math.floor(requestedRows));
  const reqColumns = Math.max(1, Math.floor(requestedColumns));

  const rows = Math.max(minRows, reqRows);
  const columns = Math.max(minColumns, reqColumns);

  return {
    rows,
    columns,
    clamped: rows !== reqRows || columns !== reqColumns,
  };
}
