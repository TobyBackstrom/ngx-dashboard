import { CellId, CellIdUtils, CellData } from '../../../models';

export function getMaxColSpan(
  cellId: CellId,
  row: number,
  col: number,
  cells: CellData[],
  columns: number,
): number {
  const currentCell = cells.find((c) => CellIdUtils.equals(c.cellId, cellId));
  if (!currentCell) return 1;

  // Start from current position and check each column until we hit a boundary or collision
  let maxSpan = 1;

  for (let testCol = col + 1; testCol <= columns; testCol++) {
    // Check if this column is free for all rows the widget spans
    let columnIsFree = true;

    for (let testRow = row; testRow < row + currentCell.rowSpan; testRow++) {
      const occupied = cells.some((cell) => {
        if (CellIdUtils.equals(cell.cellId, cellId)) return false;

        const wStartCol = cell.col;
        const wEndCol = cell.col + cell.colSpan - 1;
        const wStartRow = cell.row;
        const wEndRow = cell.row + cell.rowSpan - 1;

        return (
          testCol >= wStartCol &&
          testCol <= wEndCol &&
          testRow >= wStartRow &&
          testRow <= wEndRow
        );
      });

      if (occupied) {
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
): number {
  const currentCell = cells.find((c) => CellIdUtils.equals(c.cellId, cellId));
  if (!currentCell) return 1;

  // Start from current position and check each row until we hit a boundary or collision
  let maxSpan = 1;

  for (let testRow = row + 1; testRow <= rows; testRow++) {
    // Check if this row is free for all columns the widget spans
    let rowIsFree = true;

    for (let testCol = col; testCol < col + currentCell.colSpan; testCol++) {
      const occupied = cells.some((cell) => {
        if (CellIdUtils.equals(cell.cellId, cellId)) return false;

        const wStartRow = cell.row;
        const wEndRow = cell.row + cell.rowSpan - 1;
        const wStartCol = cell.col;
        const wEndCol = cell.col + cell.colSpan - 1;

        return (
          testRow >= wStartRow &&
          testRow <= wEndRow &&
          testCol >= wStartCol &&
          testCol <= wEndCol
        );
      });

      if (occupied) {
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
  direction: 'horizontal' | 'vertical',
  delta: number,
  cells: CellData[],
  rows: number,
  columns: number,
): { rowSpan: number; colSpan: number } | null {
  const cell = cells.find((c) =>
    CellIdUtils.equals(c.cellId, resizeData.cellId),
  );
  if (!cell) return null;

  if (direction === 'horizontal') {
    // Calculate the desired span based on the delta
    const desiredColSpan = Math.max(1, resizeData.originalColSpan + delta);

    // Get the maximum allowed span
    const maxColSpan = getMaxColSpan(
      cell.cellId,
      cell.row,
      cell.col,
      cells,
      columns,
    );

    // Clamp to the maximum
    const newColSpan = Math.min(desiredColSpan, maxColSpan);

    return {
      rowSpan: resizeData.previewRowSpan,
      colSpan: newColSpan,
    };
  } else {
    // Calculate the desired span based on the delta
    const desiredRowSpan = Math.max(1, resizeData.originalRowSpan + delta);

    // Get the maximum allowed span
    const maxRowSpan = getMaxRowSpan(
      cell.cellId,
      cell.row,
      cell.col,
      cells,
      rows,
    );

    // Clamp to the maximum
    const newRowSpan = Math.min(desiredRowSpan, maxRowSpan);

    return {
      rowSpan: newRowSpan,
      colSpan: resizeData.previewColSpan,
    };
  }
}