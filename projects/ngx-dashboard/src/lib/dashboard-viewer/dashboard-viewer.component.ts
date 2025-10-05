import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  viewChildren,
  viewChild,
  ChangeDetectionStrategy,
  signal,
  ElementRef,
  Renderer2,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellComponent } from '../cell/cell.component';
import { DashboardStore } from '../store/dashboard-store';
import { CellIdUtils } from '../models';

export interface CellSelectionBounds {
  topLeft: { row: number; col: number };
  bottomRight: { row: number; col: number };
}

@Component({
  selector: 'ngx-dashboard-viewer',
  standalone: true,
  imports: [CellComponent, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-viewer.component.html',
  styleUrl: './dashboard-viewer.component.scss',
  host: {
    '[style.--rows]': 'rows()',
    '[style.--columns]': 'columns()',
    '[style.--gutter-size]': 'gutterSize()',
    '[style.--gutters]': 'gutters()',
  },
})
export class DashboardViewerComponent {
  #store = inject(DashboardStore);
  #renderer = inject(Renderer2);
  #destroyRef = inject(DestroyRef);

  cellComponents = viewChildren(CellComponent);
  gridElement = viewChild<ElementRef>('gridElement');

  rows = input.required<number>();
  columns = input.required<number>();
  gutterSize = input<string>('1em');
  gutters = computed(() => this.columns() + 1);

  // Selection feature
  enableSelection = input<boolean>(false);
  cellsSelected = output<CellSelectionBounds>();

  // store signals - read-only
  cells = this.#store.cells;

  // Selection state
  isSelecting = signal(false);
  selectionStart = signal<{ row: number; col: number } | null>(null);
  selectionCurrent = signal<{ row: number; col: number } | null>(null);

  // Computed selection bounds (normalized)
  selectionBounds = computed(() => {
    const start = this.selectionStart();
    const current = this.selectionCurrent();
    if (!start || !current) return null;

    return {
      startRow: Math.min(start.row, current.row),
      endRow: Math.max(start.row, current.row),
      startCol: Math.min(start.col, current.col),
      endCol: Math.max(start.col, current.col),
    };
  });

  // Generate array for template iteration
  rowNumbers = computed(() => Array.from({ length: this.rows() }, (_, i) => i + 1));
  colNumbers = computed(() => Array.from({ length: this.columns() }, (_, i) => i + 1));

  // Document-level event listeners (cleanup needed)
  #mouseMoveListener?: () => void;
  #mouseUpListener?: () => void;

  constructor() {
    // Sync grid configuration with store when inputs change
    effect(() => {
      this.#store.setGridConfig({
        rows: this.rows(),
        columns: this.columns(),
        gutterSize: this.gutterSize(),
      });
    });
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

  // Selection methods

  /**
   * Check if a cell is within the current selection bounds
   */
  isCellSelected(row: number, col: number): boolean {
    const bounds = this.selectionBounds();
    if (!bounds) return false;

    return (
      row >= bounds.startRow &&
      row <= bounds.endRow &&
      col >= bounds.startCol &&
      col <= bounds.endCol
    );
  }

  /**
   * Handle mouse down on ghost cell to start selection
   */
  onGhostCellMouseDown(event: MouseEvent, row: number, col: number) {
    if (!this.enableSelection()) return;
    if (event.button !== 0) return; // Only left button

    event.preventDefault();
    event.stopPropagation();

    this.isSelecting.set(true);
    this.selectionStart.set({ row, col });
    this.selectionCurrent.set({ row, col });

    // Add document-level listeners for drag
    this.#mouseMoveListener = this.#renderer.listen(
      'document',
      'mousemove',
      () => this.onDocumentMouseMove()
    );

    this.#mouseUpListener = this.#renderer.listen(
      'document',
      'mouseup',
      () => this.onDocumentMouseUp()
    );

    // Register cleanup
    this.#destroyRef.onDestroy(() => {
      this.cleanupListeners();
    });
  }

  /**
   * Handle mouse enter on ghost cell during selection
   */
  onGhostCellMouseEnter(row: number, col: number) {
    if (!this.isSelecting()) return;
    this.selectionCurrent.set({ row, col });
  }

  /**
   * Handle document mouse move during selection
   */
  private onDocumentMouseMove() {
    if (!this.isSelecting()) return;
    // The actual selection update is handled by onGhostCellMouseEnter
    // This just ensures we capture the event
  }

  /**
   * Handle document mouse up to complete selection
   */
  private onDocumentMouseUp() {
    if (!this.isSelecting()) return;

    this.isSelecting.set(false);

    // Emit selection event
    const bounds = this.selectionBounds();
    if (bounds) {
      this.cellsSelected.emit({
        topLeft: { row: bounds.startRow, col: bounds.startCol },
        bottomRight: { row: bounds.endRow, col: bounds.endCol },
      });
    }

    // Clean up listeners
    this.cleanupListeners();

    // Clear selection visuals after a short delay
    setTimeout(() => {
      this.selectionStart.set(null);
      this.selectionCurrent.set(null);
    }, 150);
  }

  /**
   * Clean up document-level event listeners
   */
  private cleanupListeners() {
    if (this.#mouseMoveListener) {
      this.#mouseMoveListener();
      this.#mouseMoveListener = undefined;
    }
    if (this.#mouseUpListener) {
      this.#mouseUpListener();
      this.#mouseUpListener = undefined;
    }
  }
}
