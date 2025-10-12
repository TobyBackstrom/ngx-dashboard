/**
 * Represents a rectangular selection region in the dashboard grid
 */
export interface GridSelection {
  topLeft: { row: number; col: number };
  bottomRight: { row: number; col: number };
}
