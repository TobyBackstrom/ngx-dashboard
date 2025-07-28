import { CellComponentPosition } from './cell-position';
import { WidgetMetadata } from './widget';

export type DragData =
  | { kind: 'cell'; content: CellComponentPosition }
  | { kind: 'widget'; content: WidgetMetadata };
