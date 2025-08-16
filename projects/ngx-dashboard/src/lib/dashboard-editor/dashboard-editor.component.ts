// dashboard-editor.component.ts
import { CommonModule } from '@angular/common';
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
import { CellId, CellIdUtils, WidgetId, WidgetIdUtils, DragData, CellData } from '../models';
import { DashboardStore } from '../store/dashboard-store';

@Component({
  selector: 'ngx-dashboard-editor',
  standalone: true,
  imports: [
    CellComponent,
    CommonModule,
    DropZoneComponent,
    CellContextMenuComponent,
  ],
  providers: [
    CellContextMenuService,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-editor.component.html',
  styleUrl: './dashboard-editor.component.scss',
  host: {
    '[style.--rows]': 'rows()',
    '[style.--columns]': 'columns()',
    '[style.--gutter-size]': 'gutterSize()',
    '[style.--gutters]': 'gutters()',
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
  gutters = computed(() => this.columns() + 1);

  // store signals
  cells = this.#store.cells;
  highlightedZones = this.#store.highlightedZones;
  highlightMap = this.#store.highlightMap;
  invalidHighlightMap = this.#store.invalidHighlightMap;
  hoveredDropZone = this.#store.hoveredDropZone;
  resizePreviewMap = this.#store.resizePreviewMap;

  // Generate all possible cell positions for the grid
  dropzonePositions = computed(() => {
    const positions = [];
    for (let row = 1; row <= this.rows(); row++) {
      for (let col = 1; col <= this.columns(); col++) {
        positions.push({
          row,
          col,
          id: `dropzone-${row}-${col}`,
          index: (row - 1) * this.columns() + col,
        });
      }
    }
    return positions;
  });

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

  /**
   * Get current widget states from all cell components.
   * Used during dashboard export to get live widget states.
   */
  getCurrentWidgetStates(): Map<string, unknown> {
    const stateMap = new Map<string, unknown>();
    
    const cells = this.cellComponents();
    for (const cell of cells) {
      const cellId = cell.cellId();
      const currentState = cell.getCurrentWidgetState();
      if (currentState !== undefined) {
        stateMap.set(CellIdUtils.toString(cellId), currentState);
      }
    }
    
    return stateMap;
  }

  /**
   * Export dashboard with live widget states from current component instances.
   * This ensures the most up-to-date widget states are captured.
   */
  exportDashboard() {
    return this.#store.exportDashboard(() => this.getCurrentWidgetStates());
  }
}
