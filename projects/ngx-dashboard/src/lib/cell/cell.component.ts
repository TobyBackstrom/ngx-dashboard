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

import {
  CellId,
  CellIdUtils,
  WidgetId,
  DragData,
  WidgetFactory,
  Widget,
  CellResizeDirection,
  CellResizeDelta,
  pxToTracks,
  resizeCursorClass,
} from '../models';
import { DashboardStore } from '../store/dashboard-store';
import { CellDisplayData } from '../models';
import { CELL_SETTINGS_DIALOG_PROVIDER } from '../providers/cell-settings-dialog';
import {
  CellContextMenuService,
  CellContextMenuItem,
} from './cell-context-menu.service';

@Component({
  selector: 'lib-cell',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cell.component.html',
  styleUrl: './cell.component.scss',
  host: {
    '[style.grid-row]': 'gridRowStyle()',
    '[style.grid-column]': 'gridColumnStyle()',
    '[class.is-dragging]': 'isDragging()',
    '[class.is-resizing]': 'isResizing()',
    // On the host, not `.cell`: the resize handles are siblings of `.cell`, so
    // a right-click on one would not bubble through it.
    '(contextmenu)': 'onContextMenu($event)',
    '[class.drag-active]': 'isDragActive()',
    '[class.flat]': 'flat() === true',
  },
})
export class CellComponent {
  widgetId = input.required<WidgetId>(); // Unique widget instance identifier
  cellId = input.required<CellId>(); // Current grid position
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

  edit = output<WidgetId>();
  delete = output<WidgetId>();
  settings = output<{ id: WidgetId; flat: boolean }>();
  resizeStart = output<{
    cellId: CellId;
    direction: CellResizeDirection;
  }>();
  resizeMove = output<{
    cellId: CellId;
    direction: CellResizeDirection;
    delta: CellResizeDelta;
  }>();
  resizeEnd = output<{ cellId: CellId; apply: boolean }>();

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
      ? CellIdUtils.equals(resizeData.cellId, this.cellId())
      : false;
  });

  isDragActive = this.#store.isDragActive;

  resizeData = this.#store.resizeData;
  gridCellDimensions = this.#store.gridCellDimensions;
  /** Direction of the gesture in progress; null between gestures. */
  private readonly resizeDirection = signal<CellResizeDirection | null>(null);
  private resizeStartPos = signal({ x: 0, y: 0 });

  /** Last delta actually emitted, used to drop no-op moves. Not reactive. */
  #lastResizeDelta: CellResizeDelta | null = null;

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
      cellId: this.cellId(),
      widgetId: this.widgetId(),
      row: this.row(),
      col: this.column(),
      rowSpan: this.rowSpan(),
      colSpan: this.colSpan(),
    };

    const content: DragData = { kind: 'cell', content: cell };
    this.dragStart.emit(content);

    event.dataTransfer.setData('text/plain', 'cell'); // helps firefox
    requestAnimationFrame(() => this.isDragging.set(true)); // defer to next frame to avoid immediate dragend event in some instances
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
        label: $localize`:@@ngx.dashboard.cell.menu.edit:Edit Widget`,
        icon: 'edit',
        action: () => this.onEdit(),
        disabled: !this.canEdit(),
      },
    ];

    // Add shared state entry if widget implements the method
    if (this.canEditSharedState()) {
      items.push({
        label: $localize`:@@ngx.dashboard.cell.menu.editShared:Edit Shared State`,
        icon: 'edit_document',
        action: () => this.onEditSharedState(),
      });
    }

    items.push(
      {
        label: $localize`:@@ngx.dashboard.cell.menu.settings:Settings`,
        icon: 'settings',
        action: () => this.onSettings(),
      },
      { divider: true },
      {
        label: $localize`:@@ngx.dashboard.cell.menu.delete:Delete`,
        icon: 'delete',
        action: () => this.onDelete(),
      }
    );

    // Position menu at exact mouse coordinates
    this.#contextMenuService.show(event.clientX, event.clientY, items);
  }

  canEdit(): boolean {
    if (this.#widgetRef?.instance?.dashboardEditState) {
      return true;
    }
    return false;
  }

  canEditSharedState(): boolean {
    return !!this.#widgetRef?.instance?.dashboardEditSharedState;
  }

  onEdit(): void {
    this.edit.emit(this.widgetId());

    // Call the widget's edit dialog method if it exists
    if (this.#widgetRef?.instance?.dashboardEditState) {
      this.#widgetRef.instance.dashboardEditState();
    }
  }

  onEditSharedState(): void {
    if (this.#widgetRef?.instance?.dashboardEditSharedState) {
      this.#widgetRef.instance.dashboardEditSharedState();
    }
  }

  onDelete(): void {
    this.delete.emit(this.widgetId());
  }

  async onSettings(): Promise<void> {
    const currentSettings: CellDisplayData = {
      id: CellIdUtils.toString(this.cellId()), // Use cellId for display position
      flat: this.flat(),
    };

    try {
      const result = await this.#dialogProvider.openCellSettings(
        currentSettings
      );

      if (result) {
        this.settings.emit({
          id: this.widgetId(),
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
  onResizeStart(event: MouseEvent, direction: CellResizeDirection): void {
    event.preventDefault();
    event.stopPropagation();

    this.resizeDirection.set(direction);
    this.#lastResizeDelta = null;
    this.resizeStartPos.set({ x: event.clientX, y: event.clientY });
    this.resizeStart.emit({ cellId: this.cellId(), direction });

    // Setup document listeners only when actively resizing
    this.setupDocumentListeners();

    this.#renderer.addClass(document.body, resizeCursorClass(direction));
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

    // Zero the axis this handle does not drive, so every consumer downstream
    // can read both fields without re-deriving that from the direction.
    const delta: CellResizeDelta = {
      columns:
        direction === 'vertical'
          ? 0
          : pxToTracks(event.clientX - startPos.x, cellSize.width),
      rows:
        direction === 'horizontal'
          ? 0
          : pxToTracks(event.clientY - startPos.y, cellSize.height),
    };

    // Pointer movement is continuous but the span delta is quantised to whole
    // tracks, so most moves resolve to the delta already previewed. Emitting
    // those anyway patches the store with a fresh object every time, which
    // re-renders every drop zone in the editor for no visible change.
    const last = this.#lastResizeDelta;
    if (last && last.columns === delta.columns && last.rows === delta.rows) {
      return;
    }
    this.#lastResizeDelta = delta;

    this.resizeMove.emit({
      cellId: this.cellId(),
      direction,
      delta,
    });
  }

  /**
   * Handle resize end events (called from document listener)
   * Performance: Cleans up document listeners immediately after resize
   * State cleanup: Resets resize direction to stop further event processing
   */
  private handleResizeEnd(): void {
    // Remove every resize cursor class rather than just the active one, so a
    // gesture can never leave the body cursor stuck if the direction changed.
    this.#renderer.removeClass(document.body, 'cursor-col-resize');
    this.#renderer.removeClass(document.body, 'cursor-row-resize');
    this.#renderer.removeClass(document.body, 'cursor-nwse-resize');

    // Clean up document listeners immediately
    this.#cleanupDocumentListeners();

    this.resizeEnd.emit({ cellId: this.cellId(), apply: true });
    this.resizeDirection.set(null);
    this.#lastResizeDelta = null;
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
