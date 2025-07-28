// cell-data.ts
import { WidgetFactory } from './widget-factory';
import { CellId } from './cell-id';
import { CellPosition } from './cell-position';

export interface CellData extends CellPosition {
  cellId: CellId;
  flat?: boolean;
  widgetFactory: WidgetFactory;
  widgetState: unknown;
}
