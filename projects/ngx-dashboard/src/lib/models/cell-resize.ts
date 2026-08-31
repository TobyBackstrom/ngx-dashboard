// cell-resize.ts
//
// Shared vocabulary for a widget (cell) resize gesture. Lives in models/ so the
// cell component, the store feature and the resize utils all agree on the shape
// without depending on each other.

/**
 * Which axis a cell resize handle drives. `'both'` is the corner handle: it
 * grows/shrinks columns and rows in the same gesture.
 */
export type CellResizeDirection = 'horizontal' | 'vertical' | 'both';

/** Span delta in whole grid tracks, per axis. */
export interface CellResizeDeltaSpans {
  columns: number;
  rows: number;
}

/**
 * Delta produced by a resize gesture. A plain number is the single-axis form
 * (it applies to the handle's own axis); the object form carries both axes and
 * is what the corner (`'both'`) handle emits.
 */
export type CellResizeDelta = number | CellResizeDeltaSpans;

/**
 * Normalize either delta form into per-axis spans. A single-axis handle
 * contributes 0 on the axis it does not own, so the caller can always read both.
 */
export function normalizeCellResizeDelta(
  direction: CellResizeDirection,
  delta: CellResizeDelta,
): CellResizeDeltaSpans {
  if (typeof delta !== 'number') {
    return {
      columns: direction === 'vertical' ? 0 : delta.columns,
      rows: direction === 'horizontal' ? 0 : delta.rows,
    };
  }

  return {
    columns: direction === 'vertical' ? 0 : delta,
    rows: direction === 'horizontal' ? 0 : delta,
  };
}
