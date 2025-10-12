import { CellData, GridSelection } from '../../../models';

/**
 * Result of applying selection filtering to dashboard cells.
 */
export interface SelectionFilterResult {
  cells: CellData[];
  rows: number;
  columns: number;
  rowOffset: number;
  colOffset: number;
}

/**
 * Options for selection filtering.
 */
export interface SelectionFilterOptions {
  /**
   * If true, shrink the bounds to the minimal bounding box containing all widgets.
   * If false (default), use the selection bounds as-is.
   */
  useMinimalBounds?: boolean;
}

/**
 * Calculate the minimal bounding box for a set of cells.
 * Returns the tightest rectangle that contains all the widgets.
 *
 * @param cells - The cells to calculate bounds for
 * @returns The minimal bounding box, or null if no cells
 */
export function calculateMinimalBoundingBox(cells: CellData[]): {
  minRow: number;
  maxRow: number;
  minCol: number;
  maxCol: number;
} | null {
  if (cells.length === 0) {
    return null;
  }

  let minRow = Infinity;
  let maxRow = -Infinity;
  let minCol = Infinity;
  let maxCol = -Infinity;

  for (const cell of cells) {
    const cellEndRow = cell.row + cell.rowSpan - 1;
    const cellEndCol = cell.col + cell.colSpan - 1;

    minRow = Math.min(minRow, cell.row);
    maxRow = Math.max(maxRow, cellEndRow);
    minCol = Math.min(minCol, cell.col);
    maxCol = Math.max(maxCol, cellEndCol);
  }

  return {
    minRow,
    maxRow,
    minCol,
    maxCol,
  };
}

/**
 * Apply selection filtering to extract cells within specified bounds.
 * Calculates new grid dimensions and coordinate offsets for export.
 *
 * @param selection - The grid selection to filter by
 * @param allCells - All cells in the dashboard
 * @param options - Optional filtering options
 * @returns Filtered cells with export parameters
 */
export function applySelectionFilter(
  selection: GridSelection,
  allCells: CellData[],
  options: SelectionFilterOptions = {}
): SelectionFilterResult {
  // Filter widgets that are completely within the selection bounds
  const filteredCells = allCells.filter((cell) => {
    const cellEndRow = cell.row + cell.rowSpan - 1;
    const cellEndCol = cell.col + cell.colSpan - 1;

    // Widget must be completely within the selection
    return cell.row >= selection.topLeft.row &&
           cell.col >= selection.topLeft.col &&
           cellEndRow <= selection.bottomRight.row &&
           cellEndCol <= selection.bottomRight.col;
  });

  // Determine the actual bounds to use
  let actualMinRow: number;
  let actualMaxRow: number;
  let actualMinCol: number;
  let actualMaxCol: number;

  if (options.useMinimalBounds && filteredCells.length > 0) {
    // Calculate minimal bounding box of actual widgets
    const bounds = calculateMinimalBoundingBox(filteredCells);
    if (bounds) {
      actualMinRow = bounds.minRow;
      actualMaxRow = bounds.maxRow;
      actualMinCol = bounds.minCol;
      actualMaxCol = bounds.maxCol;
    } else {
      // Fallback to selection bounds (shouldn't happen if filteredCells.length > 0)
      actualMinRow = selection.topLeft.row;
      actualMaxRow = selection.bottomRight.row;
      actualMinCol = selection.topLeft.col;
      actualMaxCol = selection.bottomRight.col;
    }
  } else {
    // Use selection bounds as-is
    actualMinRow = selection.topLeft.row;
    actualMaxRow = selection.bottomRight.row;
    actualMinCol = selection.topLeft.col;
    actualMaxCol = selection.bottomRight.col;
  }

  // Calculate new grid dimensions based on actual bounds
  const exportRows = actualMaxRow - actualMinRow + 1;
  const exportColumns = actualMaxCol - actualMinCol + 1;

  // Calculate offsets for coordinate transformation
  const rowOffset = actualMinRow - 1;
  const colOffset = actualMinCol - 1;

  return {
    cells: filteredCells,
    rows: exportRows,
    columns: exportColumns,
    rowOffset,
    colOffset,
  };
}