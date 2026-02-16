// cell-data.ts
import { WidgetFactory } from './widget-factory';
import { CellId } from './cell-id';
import { WidgetId } from './widget-id';
import { CellPosition } from './cell-position';

export interface CellData extends CellPosition {
  widgetId: WidgetId;  // Unique identifier for the widget instance
  cellId: CellId;      // Current grid position (updates when widget moves)
  flat?: boolean;
  widgetTypeid?: string;  // Intended widget type (for healing late-registered types)
  widgetFactory: WidgetFactory;
  widgetState: unknown;
}
