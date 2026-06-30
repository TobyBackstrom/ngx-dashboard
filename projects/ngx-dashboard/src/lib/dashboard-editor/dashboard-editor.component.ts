// dashboard-editor.component.ts

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
  viewChildren,
  afterNextRender,
} from '@angular/core';
import { CellComponent } from '../cell/cell.component';
import { CellContextMenuComponent } from '../cell/cell-context-menu.component';
import { CellContextMenuService } from '../cell/cell-context-menu.service';
import { DropZoneComponent } from '../drop-zone/drop-zone.component';
import { EmptyCellContextMenuComponent } from '../drop-zone/empty-cell-context-menu.component';
import {
  GridResizeHandleComponent,
  GridResizeAxis,
  GridResizeDelta,
} from '../grid-resize-handle/grid-resize-handle.component';
import {
  CellId,
  CellIdUtils,
  WidgetId,
  DragData,
  CellData,
  GridResizeResult,
} from '../models';
import { DashboardStore } from '../store/dashboard-store';

@Component({
  selector: 'ngx-dashboard-editor',
  standalone: true,
  imports: [
    CellComponent,
    DropZoneComponent,
    CellContextMenuComponent,
    EmptyCellContextMenuComponent,
    GridResizeHandleComponent
],
  providers: [
    CellContextMenuService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-editor.component.html',
  styleUrl: './dashboard-editor.component.scss',
  host: {
    '[style.--rows]': 'effectiveRows()',
    '[style.--columns]': 'effectiveColumns()',
    '[style.--gutter-size]': 'gutterSize()',
    '[style.--gutters]': 'effectiveColumns() + 1',
    '[class.is-edit-mode]': 'true', // Always in edit mode
  },
})
export class DashboardEditorComponent {
  bottomGridRef = viewChild.required<ElementRef<HTMLDivElement>>('bottomGrid');
  dropZones = viewChildren(DropZoneComponent);
  cellComponents = viewChildren(CellComponent);

  #store = inject(DashboardStore);
  #destroyRef = inject(DestroyRef);
  #resizeObserver?: ResizeObserver;

  rows = input.required<number>();
  columns = input.required<number>();
  gutterSize = input<string>('1em');

  // Emitted when a grid resize handle commits a new size (after clamp-to-content).
  gridResized = output<GridResizeResult>();

  // store signals
  cells = this.#store.cells;
  highlightedZones = this.#store.highlightedZones;
  highlightMap = this.#store.highlightMap;
  invalidHighlightMap = this.#store.invalidHighlightMap;
  hoveredDropZone = this.#store.hoveredDropZone;
  resizePreviewMap = this.#store.resizePreviewMap;
  cellDimensions = this.#store.gridCellDimensions;
  gridResizePreview = this.#store.gridResizePreview;

  // Effective grid size = the live drag preview when one is active, otherwise
  // the committed size. Drives the grid template, aspect-ratio and drop zones
  // so the editor reflows under the handle without committing.
  effectiveRows = computed(() => this.gridResizePreview()?.rows ?? this.rows());
  effectiveColumns = computed(
    () => this.gridResizePreview()?.columns ?? this.columns()
  );

  // Hide grid resize handles while a widget drag is in progress to avoid
  // conflicting gestures.
  isDragActive = this.#store.isDragActive;

  // Axes rendered as grid resize handles (right edge, bottom edge, corner).
  protected readonly resizeAxes: GridResizeAxis[] = [
    'horizontal',
    'vertical',
    'both',
  ];

  // Generate all possible cell positions for the grid (using the effective
  // size so the drop-zone grid grows/shrinks with the live resize preview).
  dropzonePositions = computed(() => {
    const rows = this.effectiveRows();
    const columns = this.effectiveColumns();
    const positions = [];
    for (let row = 1; row <= rows; row++) {
      for (let col = 1; col <= columns; col++) {
        positions.push({
          row,
          col,
          id: `dropzone-${row}-${col}`,
          index: (row - 1) * columns + col,
        });
      }
    }
    return positions;
  });

  // True for drop zones in the about-to-be-added region during a grow preview,
  // so the template can tint the tracks the resize is adding.
  isPreviewAdded(row: number, col: number): boolean {
    return (
      this.gridResizePreview() !== null &&
      (row > this.rows() || col > this.columns())
    );
  }

  // Helper method for template
  createCellId(row: number, col: number): CellId {
    return CellIdUtils.create(row, col);
  }

  constructor() {
    // Sync grid configuration with store when inputs change
    effect(() => {
      this.#store.setGridConfig({
        rows: this.rows(),
        columns: this.columns(),
        gutterSize: this.gutterSize(),
      });
    });

    // Observe grid size after rendering
    afterNextRender(() => {
      this.#observeGridSize();
    });

    // Always set edit mode to true
    effect(() => {
      this.#store.setEditMode(true);
    });

    // Drop any in-progress resize preview if the editor is torn down mid-drag
    // (e.g. editMode toggled off): the store outlives this component, so a
    // stale preview would otherwise render a phantom grid on the next mount.
    this.#destroyRef.onDestroy(() => this.#store.clearGridResizePreview());
  }

  #observeGridSize(): void {
    const gridEl = this.bottomGridRef()?.nativeElement;
    if (!gridEl || this.#resizeObserver) return;

    this.#resizeObserver = new ResizeObserver(() => {
      const dropZonesList = this.dropZones();
      const firstDropZone = dropZonesList[0];
      if (!firstDropZone) return;
      const el: HTMLElement = firstDropZone.nativeElement;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      const width = rect.width;
      const height = rect.height;

      this.#store.setGridCellDimensions(width, height);
    });

    this.#resizeObserver.observe(gridEl);

    // Register cleanup with DestroyRef for automatic memory management
    this.#destroyRef.onDestroy(() => {
      this.#resizeObserver?.disconnect();
      this.#resizeObserver = undefined;
    });
  }

  // Pure delegation methods - no business logic in component
  addWidget = (cellData: CellData) => this.#store.addWidget(cellData);

  updateCellPosition = (id: WidgetId, row: number, column: number) =>
    this.#store.updateWidgetPosition(id, row, column);

  updateCellSpan = (id: WidgetId, colSpan: number, rowSpan: number) =>
    this.#store.updateWidgetSpan(id, rowSpan, colSpan);

  updateCellSettings = (id: WidgetId, flat: boolean) =>
    this.#store.updateCellSettings(id, flat);

  // Pure delegation - drag and drop event handlers
  onDragOver = (event: { row: number; col: number }) =>
    this.#store.setHoveredDropZone(event);

  onDragEnter = (event: { row: number; col: number }) => this.onDragOver(event);

  onDragExit = () => this.#store.setHoveredDropZone(null);

  dragEnd = () => this.#store.endDrag();

  // Pure delegation - cell event handlers
  onCellDelete = (id: WidgetId) => this.#store.removeWidget(id);

  onCellSettings = (event: { id: WidgetId; flat: boolean }) =>
    this.updateCellSettings(event.id, event.flat);

  onCellResize = (event: { id: WidgetId; rowSpan: number; colSpan: number }) =>
    this.updateCellSpan(event.id, event.colSpan, event.rowSpan);

  // Handle drag events from cell component
  onCellDragStart = (dragData: DragData) => this.#store.startDrag(dragData);

  // Handle resize events from cell component
  onCellResizeStart = (event: {
    cellId: CellId;
    direction: 'horizontal' | 'vertical';
  }) => this.#store.startResize(event.cellId);

  onCellResizeMove = (event: {
    cellId: CellId;
    direction: 'horizontal' | 'vertical';
    delta: number;
  }) => this.#store.updateResizePreview(event.direction, event.delta);

  onCellResizeEnd = (event: { cellId: CellId; apply: boolean }) =>
    this.#store.endResize(event.apply);

  // Handle drop events by delegating to store's business logic
  onDragDrop(event: { data: DragData; target: { row: number; col: number } }) {
    this.#store.handleDrop(event.data, event.target);
    // Note: Store handles all validation and error handling internally
  }

  // Live preview while dragging a handle: the store reflows the grid to the
  // clamped target size without committing.
  onGridResizeMove(delta: GridResizeDelta): void {
    this.#store.previewGridResize(delta.deltaRows, delta.deltaColumns);
  }

  // Commit a grid resize gesture. The store clears the preview, no-ops on a
  // zero delta, and otherwise commits the clamped relative resize.
  onGridResizeEnd(delta: GridResizeDelta): void {
    const result = this.#store.endGridResize(
      delta.deltaRows,
      delta.deltaColumns
    );
    if (result) this.gridResized.emit(result);
  }
}
