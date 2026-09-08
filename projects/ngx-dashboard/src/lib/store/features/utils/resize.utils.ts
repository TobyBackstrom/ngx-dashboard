import {
  CellId,
  CellIdUtils,
  CellData,
  CellResizeDirection,
  CellResizeDelta,
} from '../../../models';
import { GridQueryInternalUtils } from './grid-query-internal.utils';

export function getMaxColSpan(
  cellId: CellId,
  row: number,
  col: number,
  cells: CellData[],
  columns: number,
  /**
   * How many rows the widget is assumed to occupy while widening. Callers pass
   * the *preview* rowSpan so the two axes are checked against each other
   * instead of against stale committed spans.
   */
  rowSpan: number,
): number {
  const currentCell = cells.find((c) => CellIdUtils.equals(c.cellId, cellId));
  if (!currentCell) return 1;

  // Start from current position and check each column until we hit a boundary or collision
  let maxSpan = 1;

  for (let testCol = col + 1; testCol <= columns; testCol++) {
    // Check if this column is free for all rows the widget spans
    let columnIsFree = true;

    for (let testRow = row; testRow < row + rowSpan; testRow++) {
      if (
        GridQueryInternalUtils.isCellOccupied(
          cells,
          testRow,
          testCol,
          currentCell.widgetId,
        )
      ) {
        columnIsFree = false;
        break;
      }
    }

    if (!columnIsFree) {
      break; // Hit a collision, stop here
    }

    maxSpan = testCol - col + 1; // Update max span to include this column
  }

  return maxSpan;
}

export function getMaxRowSpan(
  cellId: CellId,
  row: number,
  col: number,
  cells: CellData[],
  rows: number,
  /**
   * How many columns the widget is assumed to occupy while growing taller.
   * See `getMaxColSpan`'s `rowSpan`.
   */
  colSpan: number,
): number {
  const currentCell = cells.find((c) => CellIdUtils.equals(c.cellId, cellId));
  if (!currentCell) return 1;

  // Start from current position and check each row until we hit a boundary or collision
  let maxSpan = 1;

  for (let testRow = row + 1; testRow <= rows; testRow++) {
    // Check if this row is free for all columns the widget spans
    let rowIsFree = true;

    for (let testCol = col; testCol < col + colSpan; testCol++) {
      if (
        GridQueryInternalUtils.isCellOccupied(
          cells,
          testRow,
          testCol,
          currentCell.widgetId,
        )
      ) {
        rowIsFree = false;
        break;
      }
    }

    if (!rowIsFree) {
      break; // Hit a collision, stop here
    }

    maxSpan = testRow - row + 1; // Update max span to include this row
  }

  return maxSpan;
}

export interface ResizeData {
  cellId: CellId;
  originalRowSpan: number;
  originalColSpan: number;
  previewRowSpan: number;
  previewColSpan: number;
}

export function calculateResizePreview(
  resizeData: ResizeData,
  direction: CellResizeDirection,
  delta: CellResizeDelta,
  cells: CellData[],
  rows: number,
  columns: number,
): { rowSpan: number; colSpan: number } | null {
  const cell = cells.find((c) =>
    CellIdUtils.equals(c.cellId, resizeData.cellId),
  );
  if (!cell) return null;

  // Deltas are always measured from the span the gesture started with, so a
  // drag back towards the origin undoes itself exactly. An axis this handle
  // does not drive keeps whatever the gesture has already previewed.
  const drivesColumns = direction !== 'vertical';
  const drivesRows = direction !== 'horizontal';

  let colSpan = drivesColumns
    ? Math.max(1, resizeData.originalColSpan + delta.columns)
    : resizeData.previewColSpan;
  let rowSpan = drivesRows
    ? Math.max(1, resizeData.originalRowSpan + delta.rows)
    : resizeData.previewRowSpan;

  // Clamp columns against the row extent the gesture is asking for, then rows
  // against the columns actually granted. For the corner ('both') handle this
  // ordering is what keeps the two axes honest: a widget may only widen into
  // columns that are free for every row it is simultaneously growing into.
  // Clamping in this order cannot yield an overlapping pair, because shrinking
  // rows only ever relaxes the column limit.
  if (drivesColumns) {
    colSpan = Math.min(
      colSpan,
      getMaxColSpan(cell.cellId, cell.row, cell.col, cells, columns, rowSpan),
    );
  }

  if (drivesRows) {
    rowSpan = Math.min(
      rowSpan,
      getMaxRowSpan(cell.cellId, cell.row, cell.col, cells, rows, colSpan),
    );
  }

  return { rowSpan, colSpan };
}
