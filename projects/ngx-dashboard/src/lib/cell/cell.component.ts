// cell.component.ts
import {
  Component,
  ComponentRef,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  signal,
  ViewContainerRef,
  output,
  ElementRef,
  viewChild,
  Renderer2,
  ChangeDetectionStrategy,
} from '@angular/core';
// RxJS removed: Using native DOM events with Renderer2 for performance
// - Context menu uses template event binding (element-specific)
// - Resize uses conditional document listeners (only when actively resizing)
// - Eliminates N*mousemove performance issue with @HostListener approach
import { CommonModule } from '@angular/common';
import {
  CellId,
  CellIdUtils,
  DragData,
  WidgetFactory,
  Widget,
} from '../models';
import { DashboardStore } from '../store/dashboard-store';
import { CellDisplayData } from '../models';
import { CELL_SETTINGS_DIALOG_PROVIDER } from '../providers/cell-settings-dialog';
import { CellContextMenuService, CellContextMenuItem } from './cell-context-menu.service';

@Component({
  selector: 'lib-cell',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cell.component.html',
  styleUrl: './cell.component.scss',
  host: {
    '[style.grid-row]': 'gridRowStyle()',
    '[style.grid-column]': 'gridColumnStyle()',
    '[class.is-dragging]': 'isDragging()',
    '[class.drag-active]': 'isDragActive()',
    '[class.flat]': 'flat() === true',
  },
})
export class CellComponent {
  id = input.required<CellId>();
  widgetFactory = input<WidgetFactory | undefined>(undefined);
  widgetState = input<unknown | undefined>(undefined);
  isEditMode = input<boolean>(false);
  flat = input<boolean | undefined>(undefined);

  row = model.required<number>();
  column = model.required<number>();
  rowSpan = input<number>(1);
  colSpan = input<number>(1);
  draggable = input<boolean>(false);

  dragStart = output<DragData>();
  dragEnd = output<void>();

  edit = output<CellId>();
  delete = output<CellId>();
  settings = output<{ id: CellId; flat: boolean }>();
  resizeStart = output<{ id: CellId; direction: 'horizontal' | 'vertical' }>();
  resizeMove = output<{
    id: CellId;
    direction: 'horizontal' | 'vertical';
    delta: number;
  }>();
  resizeEnd = output<{ id: CellId; apply: boolean }>();

  private container = viewChild.required<ElementRef, ViewContainerRef>(
    'container',
    { read: ViewContainerRef }
  );

  readonly #store = inject(DashboardStore);
  readonly #dialogProvider = inject(CELL_SETTINGS_DIALOG_PROVIDER);
  readonly #destroyRef = inject(DestroyRef);
  readonly #renderer = inject(Renderer2);
  readonly #contextMenuService = inject(CellContextMenuService, {
    optional: true,
  });
  readonly #elementRef = inject(ElementRef);

  #widgetRef?: ComponentRef<Widget>;
  
  // Document event listeners cleanup function
  // Performance: Only created when actively resizing, not for every cell
  #documentListeners?: () => void;

  isDragging = signal(false);

  readonly gridRowStyle = computed(
    () => `${this.row()} / span ${this.rowSpan()}`
  );
  readonly gridColumnStyle = computed(
    () => `${this.column()} / span ${this.colSpan()}`
  );

  isResizing = computed(() => {
    const resizeData = this.#store.resizeData();
    return resizeData
      ? CellIdUtils.equals(resizeData.cellId, this.id())
      : false;
  });

  isDragActive = computed(() => !!this.#store.dragData());

  resizeData = this.#store.resizeData;
  gridCellDimensions = this.#store.gridCellDimensions;
  private resizeDirection = signal<'horizontal' | 'vertical' | null>(null);
  private resizeStartPos = signal({ x: 0, y: 0 });

  constructor() {
    // widget creation - triggers when factory or state changes
    effect(() => {
      const factory = this.widgetFactory();
      const state = this.widgetState();
      const container = this.container();

      if (factory && container) {
        // Clean up previous widget
        this.#widgetRef?.destroy();

        // Create new widget
        container.clear();
        try {
          this.#widgetRef = factory.createInstance(container, state);
        } catch (error) {
          console.error('Failed to create widget:', error);
          this.#widgetRef = undefined;
        }
      }
    });

    // Auto cleanup on destroy
    this.#destroyRef.onDestroy(() => {
      this.#widgetRef?.destroy();
      this.#widgetRef = undefined;
      // Clean up any active document listeners
      this.#cleanupDocumentListeners();
    });
  }

  /**
   * Setup document-level event listeners for resize operations
   * Performance: Only creates listeners when actively resizing (not for every cell)
   * Angular-idiomatic: Uses Renderer2 for dynamic listener management
   */
  private setupDocumentListeners(): void {
    // Clean up any existing listeners first
    this.#cleanupDocumentListeners();

    // Create document listeners with proper cleanup functions
    const unlistenMove = this.#renderer.listen(
      'document',
      'mousemove',
      this.handleResizeMove.bind(this)
    );
    const unlistenUp = this.#renderer.listen(
      'document',
      'mouseup',
      this.handleResizeEnd.bind(this)
    );

    // Store cleanup function for later use
    this.#documentListeners = () => {
      unlistenMove();
      unlistenUp();
    };
  }

  /**
   * Clean up document-level event listeners
   * Called on resize end and component destruction
   */
  #cleanupDocumentListeners(): void {
    if (this.#documentListeners) {
      this.#documentListeners();
      this.#documentListeners = undefined;
    }
  }

  setPosition(row: number, column: number): void {
    this.row.set(row);
    this.column.set(column);
  }

  onDragStart(event: DragEvent): void {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'move';

    const cell = {
      cellId: this.id(),
      row: this.row(),
      col: this.column(),
      rowSpan: this.rowSpan(),
      colSpan: this.colSpan(),
    };

    const content: DragData = { kind: 'cell', content: cell };
    this.dragStart.emit(content);
    this.isDragging.set(true);
  }

  onDragEnd(/*_: DragEvent*/): void {
    this.isDragging.set(false);
    this.dragEnd.emit();
  }

  /**
   * Handle context menu events (called from template)
   * Performance: Element-specific event binding, not document-level
   * Angular-idiomatic: Template event binding instead of fromEvent
   */
  onContextMenu(event: MouseEvent): void {
    if (!this.isEditMode() || !this.#contextMenuService) return;

    event.preventDefault();
    event.stopPropagation();

    const items: CellContextMenuItem[] = [
      {
        label: 'Edit Widget',
        icon: 'edit',
        action: () => this.onEdit(),
        disabled: !this.canEdit(),
      },
      {
        label: 'Settings',
        icon: 'settings',
        action: () => this.onSettings(),
      },
      { divider: true },
      {
        label: 'Delete',
        icon: 'delete',
        action: () => this.onDelete(),
      },
    ];

    // Position menu at exact mouse coordinates
    this.#contextMenuService.show(event.clientX, event.clientY, items);
  }

  canEdit(): boolean {
    if (this.#widgetRef?.instance?.dashboardEditState) {
      return true;
    }
    return false;
  }

  onEdit(): void {
    this.edit.emit(this.id());

    // Call the widget's edit dialog method if it exists
    if (this.#widgetRef?.instance?.dashboardEditState) {
      this.#widgetRef.instance.dashboardEditState();
    }
  }

  onDelete(): void {
    this.delete.emit(this.id());
  }

  async onSettings(): Promise<void> {
    const currentSettings: CellDisplayData = {
      id: CellIdUtils.toString(this.id()),
      flat: this.flat(),
    };

    try {
      const result = await this.#dialogProvider.openCellSettings(
        currentSettings
      );

      if (result) {
        this.settings.emit({
          id: this.id(),
          flat: result.flat ?? false,
        });
      }
    } catch (error) {
      console.error('Error opening cell settings dialog:', error);
    }
  }

  /**
   * Start resize operation and setup document listeners
   * Performance: Only THIS cell creates document listeners when actively resizing
   * RxJS-free: Uses Renderer2 for dynamic listener management
   */
  onResizeStart(event: MouseEvent, direction: 'horizontal' | 'vertical'): void {
    event.preventDefault();
    event.stopPropagation();

    this.resizeDirection.set(direction);
    this.resizeStartPos.set({ x: event.clientX, y: event.clientY });
    this.resizeStart.emit({ id: this.id(), direction });

    // Setup document listeners only when actively resizing
    this.setupDocumentListeners();

    const cursorClass =
      direction === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize';
    this.#renderer.addClass(document.body, cursorClass);
  }

  /**
   * Handle resize move events (called from document listener)
   * Performance: Only called for the actively resizing cell
   * Bound method: Maintains component context without arrow functions
   */
  private handleResizeMove(event: MouseEvent): void {
    const direction = this.resizeDirection();
    if (!direction) return;

    const startPos = this.resizeStartPos();
    const cellSize = this.gridCellDimensions();

    if (direction === 'horizontal') {
      const deltaX = event.clientX - startPos.x;
      const deltaSpan = Math.round(deltaX / cellSize.width);
      this.resizeMove.emit({ id: this.id(), direction, delta: deltaSpan });
    } else {
      const deltaY = event.clientY - startPos.y;
      const deltaSpan = Math.round(deltaY / cellSize.height);
      this.resizeMove.emit({ id: this.id(), direction, delta: deltaSpan });
    }
  }

  /**
   * Handle resize end events (called from document listener)
   * Performance: Cleans up document listeners immediately after resize
   * State cleanup: Resets resize direction to stop further event processing
   */
  private handleResizeEnd(): void {
    this.#renderer.removeClass(document.body, 'cursor-col-resize');
    this.#renderer.removeClass(document.body, 'cursor-row-resize');

    // Clean up document listeners immediately
    this.#cleanupDocumentListeners();

    this.resizeEnd.emit({ id: this.id(), apply: true });
    this.resizeDirection.set(null);
  }

  /**
   * Get the current widget state by calling dashboardGetState() on the widget instance.
   * Used during dashboard export to get live widget state instead of stale stored state.
   */
  getCurrentWidgetState(): unknown | undefined {
    if (!this.#widgetRef?.instance) {
      return undefined;
    }

    // Call dashboardGetState() if the widget implements it
    if (typeof this.#widgetRef.instance.dashboardGetState === 'function') {
      return this.#widgetRef.instance.dashboardGetState();
    }

    // Fall back to stored state if widget doesn't implement dashboardGetState
    return this.widgetState();
  }
}
