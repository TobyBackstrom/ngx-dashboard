import { CellData } from '../../../models';
import { GridRegion } from '../../../dashboard-viewer/dashboard-viewer.component';

/**
 * Result of applying region filtering to dashboard cells.
 */
export interface RegionFilterResult {
  cells: CellData[];
  rows: number;
  columns: number;
  rowOffset: number;
  colOffset: number;
}

/**
 * Apply region filtering to extract cells within specified bounds.
 * Calculates new grid dimensions and coordinate offsets for export.
 *
 * @param region - The grid region to filter by
 * @param allCells - All cells in the dashboard
 * @returns Filtered cells with export parameters
 */
export function applyRegionFilter(region: GridRegion, allCells: CellData[]): RegionFilterResult {
  // Calculate new grid dimensions based on selection
  const exportRows = region.bottomRight.row - region.topLeft.row + 1;
  const exportColumns = region.bottomRight.col - region.topLeft.col + 1;

  // Calculate offsets for coordinate transformation
  const rowOffset = region.topLeft.row - 1;
  const colOffset = region.topLeft.col - 1;

  // Filter widgets that are completely within the region bounds
  const filteredCells = allCells.filter((cell) => {
    const cellEndRow = cell.row + cell.rowSpan - 1;
    const cellEndCol = cell.col + cell.colSpan - 1;

    // Widget must be completely within the region
    return cell.row >= region.topLeft.row &&
           cell.col >= region.topLeft.col &&
           cellEndRow <= region.bottomRight.row &&
           cellEndCol <= region.bottomRight.col;
  });

  return {
    cells: filteredCells,
    rows: exportRows,
    columns: exportColumns,
    rowOffset,
    colOffset,
  };
}