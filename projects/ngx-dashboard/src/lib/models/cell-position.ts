// cell-position.ts
import { CellId } from './cell-id';
import { WidgetId } from './widget-id';

export interface CellPosition {
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

export interface CellComponentPosition extends CellPosition {
  cellId: CellId;  // Current position
  widgetId: WidgetId;  // Widget instance identifier
}