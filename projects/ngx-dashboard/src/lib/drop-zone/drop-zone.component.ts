// drop-zone.component.ts
import {
  Component,
  ElementRef,
  inject,
  input,
  output,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStore } from '../store/dashboard-store';
import { DragData } from '../models';
import { EMPTY_CELL_CONTEXT_PROVIDER } from '../providers/empty-cell-context';

@Component({
  selector: 'lib-drop-zone',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drop-zone.component.html',
  styleUrl: './drop-zone.component.scss',
})
export class DropZoneComponent {
  // Required inputs
  row = input.required<number>();
  col = input.required<number>();
  index = input.required<number>();

  // Optional inputs with defaults
  highlight = input(false);
  highlightInvalid = input(false);
  highlightResize = input(false);
  editMode = input(false);

  // Outputs
  dragEnter = output<{ row: number; col: number }>();
  dragExit = output<void>();
  dragOver = output<{ row: number; col: number }>();
  dragDrop = output<{
    data: DragData;
    target: { row: number; col: number };
  }>();

  // Computed properties
  dropZoneId = computed(() => `drop-zone-${this.row()}-${this.col()}`);

  dropData = computed(() => ({
    row: this.row(),
    col: this.col(),
  }));

  // Abstract drag state from store
  dragData = computed(() => this.#store.dragData());
  
  // Computed drop effect based on drag data and validity
  dropEffect = computed(() => {
    const data = this.dragData();
    if (!data || this.highlightInvalid()) {
      return 'none';
    }
    return data.kind === 'cell' ? 'move' : 'copy';
  });

  readonly #store = inject(DashboardStore);
  readonly #elementRef = inject(ElementRef);
  readonly #contextProvider = inject(EMPTY_CELL_CONTEXT_PROVIDER, {
    optional: true,
  });

  get nativeElement(): HTMLElement {
    return this.#elementRef.nativeElement;
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragEnter.emit({ row: this.row(), col: this.col() });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer && this.dragData()) {
      event.dataTransfer.dropEffect = this.dropEffect();
    }

    this.dragOver.emit({ row: this.row(), col: this.col() });
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Only emit if actually leaving the element (not entering a child)
    if (this.#isLeavingElement(event)) {
      this.dragExit.emit();
    }
  }

  #isLeavingElement(event: DragEvent): boolean {
    const rect = this.#elementRef.nativeElement.getBoundingClientRect();
    return (
      event.clientX <= rect.left ||
      event.clientX >= rect.right ||
      event.clientY <= rect.top ||
      event.clientY >= rect.bottom
    );
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!event.dataTransfer) return;

    const data = this.dragData();
    if (data) {
      this.dragDrop.emit({
        data,
        target: { row: this.row(), col: this.col() },
      });
    }
  }

  /**
   * Handle context menu events on empty cells.
   * Only active in edit mode. Delegates to the context provider if available.
   */
  onContextMenu(event: MouseEvent): void {
    if (!this.editMode()) return;

    // Always prevent default browser menu in edit mode
    event.preventDefault();

    if (this.#contextProvider) {
      this.#contextProvider.handleEmptyCellContext(event, {
        row: this.row(),
        col: this.col(),
        totalRows: this.#store.rows(),
        totalColumns: this.#store.columns(),
        gutterSize: this.#store.gutterSize(),
      });
    }
  }
}
