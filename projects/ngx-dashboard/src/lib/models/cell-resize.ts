// cell-resize.ts
//
// Shared vocabulary for a widget (cell) resize gesture. Lives in models/ so the
// cell component, the store feature and the resize utils all agree on the shape
// without depending on each other.

/**
 * Which axis a resize handle drives. `'both'` is the corner handle: it
 * grows/shrinks columns and rows in the same gesture.
 */
export type CellResizeDirection = 'horizontal' | 'vertical' | 'both';

/**
 * Span delta in whole grid tracks. Producers zero the axis their handle does
 * not drive, so every consumer reads both fields unconditionally rather than
 * re-deriving which axis is live from the direction.
 */
export interface CellResizeDelta {
  columns: number;
  rows: number;
}

/**
 * Round half away from zero so inward and outward half-cell drags behave
 * symmetrically. `Math.round` rounds 0.5 to 1 but -0.5 to 0, which makes a
 * half-cell shrink "stick" while a half-cell grow responds.
 */
export function symmetricRound(value: number): number {
  return Math.sign(value) * Math.round(Math.abs(value));
}

/**
 * Convert a pixel drag distance into whole grid tracks.
 *
 * Returns 0 for a non-positive or unknown cell size. The grid reports
 * `{ width: 0, height: 0 }` until it has been measured, and dividing by that
 * yields NaN, which propagates through the span clamp into `updateWidgetSpan`
 * and would persist a NaN span into the widget and its exported DTO.
 */
export function pxToTracks(distance: number, cellSize: number): number {
  if (!(cellSize > 0)) return 0;
  return symmetricRound(distance / cellSize);
}

/**
 * Body cursor class used for the duration of a resize gesture. The classes
 * themselves live in `styles/_resize-cursors.scss`; this keeps the mapping to
 * them in one place too.
 */
export function resizeCursorClass(direction: CellResizeDirection): string {
  switch (direction) {
    case 'horizontal':
      return 'cursor-col-resize';
    case 'vertical':
      return 'cursor-row-resize';
    default:
      return 'cursor-nwse-resize';
  }
}
