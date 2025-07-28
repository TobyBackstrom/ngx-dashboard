import { CellId, CellIdUtils, CellData, DragData } from '../../../models';
import { GridQueryInternalUtils } from './grid-query-internal.utils';

export interface CollisionInfo {
  hasCollisions: boolean;
  invalidCells: CellId[];
  outOfBounds: boolean;
  footprint: { row: number; col: number }[];
}

export function calculateCollisionInfo(
  dragData: DragData | null,
  hovered: { row: number; col: number } | null,
  cells: CellData[],
  rows: number,
  columns: number,
): CollisionInfo {
  if (!dragData || !hovered) {
    return {
      hasCollisions: false,
      invalidCells: [],
      outOfBounds: false,
      footprint: [],
    };
  }

  const isCell = dragData.kind === 'cell';
  const rowSpan = isCell ? dragData.content.rowSpan : 1;
  const colSpan = isCell ? dragData.content.colSpan : 1;

  // Check bounds
  const outOfBounds = GridQueryInternalUtils.isOutOfBounds(
    hovered.row,
    hovered.col,
    rowSpan,
    colSpan,
    rows,
    columns
  );

  // Generate footprint
  const footprint: { row: number; col: number }[] = [];
  for (let r = 0; r < rowSpan; r++) {
    for (let c = 0; c < colSpan; c++) {
      footprint.push({ row: hovered.row + r, col: hovered.col + c });
    }
  }

  const excludeId = isCell ? dragData.content.cellId : undefined;

  // Check for actual collisions with other widgets (not self)
  const hasCollisions = footprint.some((pos) =>
    GridQueryInternalUtils.isCellOccupied(cells, pos.row, pos.col, excludeId)
  );

  // Generate invalid cell IDs
  const invalidCells: CellId[] = [];
  if (hasCollisions || outOfBounds) {
    for (const pos of footprint) {
      invalidCells.push(CellIdUtils.create(pos.row, pos.col));
    }
  }

  return {
    hasCollisions,
    invalidCells,
    outOfBounds,
    footprint,
  };
}

export function calculateHighlightedZones(
  dragData: DragData | null,
  hovered: { row: number; col: number } | null,
): { row: number; col: number }[] {
  if (!dragData || !hovered) return [];

  const zones: { row: number; col: number }[] = [];
  const rowSpan = dragData.kind === 'cell' ? dragData.content.rowSpan : 1;
  const colSpan = dragData.kind === 'cell' ? dragData.content.colSpan : 1;

  for (let r = 0; r < rowSpan; r++) {
    for (let c = 0; c < colSpan; c++) {
      zones.push({ row: hovered.row + r, col: hovered.col + c });
    }
  }

  return zones;
}