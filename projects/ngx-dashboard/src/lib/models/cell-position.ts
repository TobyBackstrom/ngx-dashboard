// cell-position.ts
import { CellId } from './cell-id';

export interface CellPosition {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

export interface CellComponentPosition extends CellPosition {
  cellId: CellId;
}