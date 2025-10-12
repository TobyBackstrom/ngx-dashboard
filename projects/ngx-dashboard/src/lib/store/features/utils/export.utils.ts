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
 * Apply selection filtering to extract cells within specified bounds.
 * Calculates new grid dimensions and coordinate offsets for export.
 *
 * @param selection - The grid selection to filter by
 * @param allCells - All cells in the dashboard
 * @returns Filtered cells with export parameters
 */
export function applySelectionFilter(selection: GridSelection, allCells: CellData[]): SelectionFilterResult {
  // Calculate new grid dimensions based on selection
  const exportRows = selection.bottomRight.row - selection.topLeft.row + 1;
  const exportColumns = selection.bottomRight.col - selection.topLeft.col + 1;

  // Calculate offsets for coordinate transformation
  const rowOffset = selection.topLeft.row - 1;
  const colOffset = selection.topLeft.col - 1;

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

  return {
    cells: filteredCells,
    rows: exportRows,
    columns: exportColumns,
    rowOffset,
    colOffset,
  };
}