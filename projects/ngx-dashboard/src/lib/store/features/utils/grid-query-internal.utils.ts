import { CellId, CellIdUtils, CellData } from '../../../models';

// Internal utility functions used by collision detection, resize logic, and tests
export const GridQueryInternalUtils = {
  isCellOccupied(cells: CellData[], row: number, col: number, excludeId?: CellId): boolean {
    return cells.some((cell) => {
      // Skip checking against the cell being dragged
      if (excludeId && CellIdUtils.equals(cell.cellId, excludeId))
        return false;

      const endRow = cell.row + cell.rowSpan - 1;
      const endCol = cell.col + cell.colSpan - 1;

      return (
        cell.row <= row && row <= endRow && cell.col <= col && col <= endCol
      );
    });
  },

  isOutOfBounds(
    targetRow: number,
    targetCol: number,
    spanRow: number,
    spanCol: number,
    maxRows: number,
    maxColumns: number,
  ): boolean {
    const rowLimit = targetRow + spanRow - 1;
    const colLimit = targetCol + spanCol - 1;

    return rowLimit > maxRows || colLimit > maxColumns;
  },

  getCellAt(cells: CellData[], row: number, col: number): CellData | null {
    return cells.find((cell) => cell.row === row && cell.col === col) ?? null;
  },
};