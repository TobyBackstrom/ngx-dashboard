/**
 * Context information about the empty cell that was clicked
 */
export interface EmptyCellContext {
  /** The row position in the grid (1-indexed) */
  row: number;
  /** The column position in the grid (1-indexed) */
  col: number;
  /** Total number of rows in the dashboard */
  totalRows: number;
  /** Total number of columns in the dashboard */
  totalColumns: number;
  /** The gutter size between cells (e.g., '1em') */
  gutterSize: string;
}

/**
 * Abstract provider for handling context menu events on empty dashboard cells.
 * Implement this to provide custom behavior when users right-click on unoccupied grid spaces.
 *
 * @example
 * ```typescript
 * @Injectable()
 * export class CustomEmptyCellProvider extends EmptyCellContextProvider {
 *   handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
 *     event.preventDefault();
 *     // Show custom menu, open dialog, etc.
 *   }
 * }
 * ```
 */
export abstract class EmptyCellContextProvider {
  /**
   * Handle context menu event on an empty dashboard cell.
   *
   * @param event - The mouse event from the right-click
   * @param context - Information about the empty cell and dashboard
   */
  abstract handleEmptyCellContext(
    event: MouseEvent,
    context: EmptyCellContext
  ): void;
}
