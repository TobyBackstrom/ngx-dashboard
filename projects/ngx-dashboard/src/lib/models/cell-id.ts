/**
 * Branded type for cell identifiers to ensure type safety when working with grid coordinates.
 * This prevents accidentally mixing up row/column numbers with cell IDs.
 */
export type CellId = number & { __brand: 'CellId' };

/**
 * Maximum number of columns supported by the grid.
 * This determines the encoding scheme for cell coordinates.
 */
const MAX_COLUMNS = 1024;

/**
 * Utility functions for working with CellId branded type.
 */
export const CellIdUtils = {
  /**
   * Creates a CellId from row and column coordinates.
   * @param row - The row number (1-based)
   * @param col - The column number (1-based)
   * @returns A branded CellId that encodes both coordinates
   * @throws Error if row or col is less than 1, or if col exceeds MAX_COLUMNS
   */
  create(row: number, col: number): CellId {
    if (row < 1 || col < 1) {
      throw new Error(
        `Invalid cell coordinates: row=${row}, col=${col}. Both must be >= 1`,
      );
    }
    if (col >= MAX_COLUMNS) {
      throw new Error(`Column ${col} exceeds maximum of ${MAX_COLUMNS - 1}`);
    }
    return (row * MAX_COLUMNS + col) as CellId;
  },

  /**
   * Decodes a CellId back into row and column coordinates.
   * @param cellId - The CellId to decode
   * @returns A tuple of [row, col] coordinates (1-based)
   */
  decode(cellId: CellId): [number, number] {
    const id = cellId as number;
    const row = Math.floor(id / MAX_COLUMNS);
    const col = id % MAX_COLUMNS;
    return [row, col];
  },

  /**
   * Gets the row coordinate from a CellId.
   * @param cellId - The CellId to extract row from
   * @returns The row number (1-based)
   */
  getRow(cellId: CellId): number {
    return Math.floor((cellId as number) / MAX_COLUMNS);
  },

  /**
   * Gets the column coordinate from a CellId.
   * @param cellId - The CellId to extract column from
   * @returns The column number (1-based)
   */
  getCol(cellId: CellId): number {
    return (cellId as number) % MAX_COLUMNS;
  },

  /**
   * Creates a string representation of a CellId for debugging/display purposes.
   * @param cellId - The CellId to convert to string
   * @returns A string in the format "row-col"
   */
  toString(cellId: CellId): string {
    const [row, col] = this.decode(cellId);
    return `${row}-${col}`;
  },

  /**
   * Checks if two CellIds are equal.
   * @param a - First CellId
   * @param b - Second CellId
   * @returns True if the CellIds represent the same cell
   */
  equals(a: CellId, b: CellId): boolean {
    return a === b;
  },
};
