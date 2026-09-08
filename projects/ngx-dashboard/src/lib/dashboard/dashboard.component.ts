// dashboard.component.ts
//
// A performant, modular, and fully reactive Angular dashboard container that orchestrates between
// editing and viewing modes — with clean component separation and no external dependencies.


import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  viewChild,
  DestroyRef,
  OnChanges,
  SimpleChanges,
  untracked,
} from '@angular/core';
import { DashboardViewerComponent } from '../dashboard-viewer/dashboard-viewer.component';
import { DashboardEditorComponent } from '../dashboard-editor/dashboard-editor.component';
import { DashboardStore } from '../store/dashboard-store';
import { DashboardDataDto } from '../models/dashboard-data.dto';
import { DashboardBridgeService } from '../services/dashboard-bridge.service';
import { DashboardViewportService } from '../services/dashboard-viewport.service';
import { EmptyCellContextMenuService } from '../services/empty-cell-context-menu.service';
import { ReservedSpace } from '../models/reserved-space';
import {
  CellIdUtils,
  DEFAULT_GRID_SIZE_LIMITS,
  GridConfig,
  GridResizeResult,
  GridSelection,
  SelectionFilterOptions,
  SelectionModifier,
} from '../models';

@Component({
  selector: 'ngx-dashboard',
  standalone: true,
  imports: [DashboardViewerComponent, DashboardEditorComponent],
  providers: [DashboardStore, DashboardViewportService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  host: {
    '[style.--rows]': 'store.effectiveRows()',
    '[style.--columns]': 'store.effectiveColumns()',
    '[style.--gutter-size]': 'store.gutterSize()',
    '[style.--gutters]': 'store.effectiveColumns() + 1',
    '[class.is-edit-mode]': 'editMode()',
    '[style.max-width.px]': 'viewport.constraints().maxWidth',
    '[style.max-height.px]': 'viewport.constraints().maxHeight',
  },
})
export class DashboardComponent implements OnChanges {
  #store = inject(DashboardStore);
  #bridge = inject(DashboardBridgeService);
  #viewport = inject(DashboardViewportService);
  #emptyCellMenuService = inject(EmptyCellContextMenuService);
  #destroyRef = inject(DestroyRef);

  // Public accessors for template
  protected readonly store = this.#store;
  protected readonly viewport = this.#viewport;

  // Component inputs
  dashboardData = input.required<DashboardDataDto>();
  editMode = input<boolean>(false);
  reservedSpace = input<ReservedSpace>();
  enableSelection = input<boolean>(false);
  selectionModifier = input<SelectionModifier | null>(null);
  dragThreshold = input<number>(4);

  /**
   * Optional CSS length for the gutter between cells (e.g. `'0.5em'`).
   *
   * A seed rather than a binding: it pushes into the store when the bound
   * value changes, and the store remains the single source of truth. A
   * statically bound value therefore does not fight a later
   * `loadDashboard()` — the imported dashboard's gutter survives.
   *
   * Values that are not a `px`/`em`/`rem` length are ignored and the current
   * gutter is kept.
   */
  gutterSize = input<string>();

  /**
   * Upper bound for any resize path, typed entry and handle drags alike.
   *
   * Every grid cell renders a drop zone component in the editor, so an
   * unbounded typed size is a performance cliff a drag gesture can't reach.
   * The content floor still outranks this cap: a dashboard loaded with more
   * rows than `maxRows` keeps them rather than losing widgets.
   */
  maxRows = input<number>(DEFAULT_GRID_SIZE_LIMITS.maxRows);
  maxColumns = input<number>(DEFAULT_GRID_SIZE_LIMITS.maxColumns);

  // Component outputs
  selectionComplete = output<GridSelection>();
  gridResized = output<GridResizeResult>();

  /**
   * Emits on any committed geometry change — size or gutter, handle-driven or
   * programmatic. Does not fire for `loadDashboard()`, which the host
   * initiated itself.
   *
   * Broader than `gridResized`, which covers size only but additionally
   * reports whether the request was clamped.
   *
   * Note for autosave: every committed change emits, including the
   * intermediate states of a host UI that applies as the user edits. Debounce,
   * or persist on a settled signal, rather than writing on each emission.
   */
  gridConfigChanged = output<GridConfig>();

  // Store signals - shared by both child components
  cells = this.#store.cells;

  /** Committed grid geometry (never the in-progress drag preview). */
  readonly gridConfig = this.#store.gridConfig;

  /**
   * Smallest grid size that still contains every widget — the clamp-to-content
   * floor. Read it to show the limit before a user runs into it.
   */
  readonly minGridSize = this.#store.minGridSize;

  /**
   * Ceiling currently in force, as set by `maxRows` / `maxColumns`. Read it to
   * bound a host control without restating the defaults.
   */
  readonly gridSizeLimits = this.#store.gridSizeLimits;

  // ViewChild references for export/import functionality
  private dashboardEditor = viewChild(DashboardEditorComponent);
  private dashboardViewer = viewChild(DashboardViewerComponent);

  // Track if we're in the middle of preserving states
  #isPreservingStates = false;
  // Track if component has been initialized
  #isInitialized = false;

  constructor() {
    // Cleanup registration when component is destroyed
    this.#destroyRef.onDestroy(() => {
      this.#bridge.unregisterDashboard(this.#store);
    });

    // Initialize from dashboardData. Only applies the first emission so that
    // subsequent re-emissions (e.g. from toSignal() on an HTTP observable)
    // don't silently overwrite an imperative loadDashboard() call.
    effect(() => {
      const data = this.dashboardData();
      if (data && !this.#isInitialized) {
        this.#store.loadDashboard(data);
        // Register with bridge service after dashboard ID is set
        this.#bridge.updateDashboardRegistration(this.#store);
        this.#isInitialized = true;
      }
    });

    // Registered after the dashboardData effect so that an explicitly bound
    // gutter wins over the DTO's on the first flush: the input is the more
    // specific instruction. Later imperative loadDashboard() calls still win,
    // because an unchanged input never re-runs this.
    effect(() => {
      const gutterSize = this.gutterSize();
      if (gutterSize === undefined) return;
      untracked(() => {
        this.#store.setGutterSize(gutterSize);
      });
    });

    // Keep the resize ceiling in sync with the inputs. Covers both the typed
    // path and the drag handles, since both clamp through the same store.
    effect(() => {
      const limits = { maxRows: this.maxRows(), maxColumns: this.maxColumns() };
      untracked(() => {
        this.#store.setGridSizeLimits(limits);
      });
    });

    // Sync edit mode with store (without triggering state preservation)
    effect(() => {
      const editMode = this.editMode();
      untracked(() => {
        this.#store.setEditMode(editMode);
      });
    });

    // Sync reserved space input with viewport service
    effect(() => {
      const reserved = this.reservedSpace();
      if (reserved) {
        this.#viewport.setReservedSpace(reserved);
      }
    });

    // Reset last widget selection when exiting edit mode
    effect(() => {
      const isEditMode = this.editMode();
      if (!isEditMode) {
        // Reset last selection when exiting edit mode
        untracked(() => {
          this.#emptyCellMenuService.setLastSelection(null);
        });
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle edit mode changes after initialization
    if (
      changes['editMode'] &&
      !changes['editMode'].firstChange &&
      this.#isInitialized
    ) {
      const previousValue = changes['editMode'].previousValue;
      const currentValue = changes['editMode'].currentValue;

      if (previousValue !== currentValue) {
        // Preserve widget states before the mode switch
        this.#preserveWidgetStatesBeforeModeSwitch(previousValue);
      }
    }
  }

  /**
   * Get current widget states from all cell components.
   * Used during dashboard export to get live widget states.
   */
  private getCurrentWidgetStates(): Map<string, unknown> {
    const stateMap = new Map<string, unknown>();

    // Get cell components from the active child
    const cells = this.editMode()
      ? this.dashboardEditor()?.cellComponents()
      : this.dashboardViewer()?.cellComponents();

    if (cells) {
      for (const cell of cells) {
        const cellId = cell.cellId();
        const currentState = cell.getCurrentWidgetState();
        if (currentState !== undefined) {
          stateMap.set(CellIdUtils.toString(cellId), currentState);
        }
      }
    }

    return stateMap;
  }

  // Public export/import methods (overloaded for selection support)
  exportDashboard(): DashboardDataDto;
  exportDashboard(
    selection: GridSelection,
    options?: SelectionFilterOptions
  ): DashboardDataDto;
  exportDashboard(
    selection?: GridSelection,
    options?: SelectionFilterOptions
  ): DashboardDataDto {
    // Export dashboard with live widget states, optionally filtering by selection
    return this.#store.exportDashboard(
      () => this.getCurrentWidgetStates(),
      selection,
      options
    );
  }

  loadDashboard(data: DashboardDataDto): void {
    this.#store.loadDashboard(data);
  }

  getCurrentDashboardData(): DashboardDataDto {
    return this.exportDashboard();
  }

  clearDashboard(): void {
    this.#store.clearDashboard();
  }

  /**
   * Resize the dashboard grid to the given row/column counts.
   *
   * Uses a clamp-to-content policy: a size that would push an existing widget
   * out of bounds is snapped up to the smallest size that still contains every
   * widget, so shrinking never orphans a widget. The applied size (which may
   * differ from the request when clamped) is returned and emitted via
   * `gridResized`. Values below 1 are treated as 1; fractional values are
   * floored.
   */
  setGridSize(rows: number, columns: number): GridResizeResult {
    const beforeRows = this.#store.rows();
    const beforeColumns = this.#store.columns();
    const result = this.#store.setGridSize(rows, columns);
    // Only signal a resize when the committed size actually changed, matching
    // the handle-drag path (store.endGridResize).
    if (result.rows !== beforeRows || result.columns !== beforeColumns) {
      this.#emitResize(result);
    }
    return result;
  }

  /**
   * Set the gutter between grid cells.
   *
   * Accepts a `px`, `em` or `rem` length. An unusable value is rejected
   * silently and the current gutter is kept — the returned string is the one
   * actually applied, mirroring how `setGridSize()` reports the size actually
   * applied.
   */
  setGutterSize(value: string): string {
    const before = this.#store.gutterSize();
    const applied = this.#store.setGutterSize(value);
    if (applied !== before) {
      this.gridConfigChanged.emit(this.#store.gridConfig());
    }
    return applied;
  }

  /** Commit of a grid-resize handle drag, forwarded from the editor. */
  protected onEditorGridResized(result: GridResizeResult): void {
    this.#emitResize(result);
  }

  /** A committed size change reaches both outputs; a gutter change only one. */
  #emitResize(result: GridResizeResult): void {
    this.gridResized.emit(result);
    this.gridConfigChanged.emit(this.#store.gridConfig());
  }

  /**
   * Forwards to the active viewer. No-op in edit mode.
   * See `DashboardViewerComponent.clearSelection()`.
   */
  clearSelection(): void {
    this.dashboardViewer()?.clearSelection();
  }

  /**
   * Preserve widget states before switching modes by collecting live states
   * from the currently active component and updating the store.
   */
  #preserveWidgetStatesBeforeModeSwitch(previousEditMode: boolean): void {
    // Prevent re-entrant calls
    if (this.#isPreservingStates) {
      return;
    }

    this.#isPreservingStates = true;

    try {
      const stateMap = new Map<string, unknown>();

      // Get cell components from the previously active child
      const cells = previousEditMode
        ? this.dashboardEditor()?.cellComponents()
        : this.dashboardViewer()?.cellComponents();

      if (cells) {
        for (const cell of cells) {
          const cellId = cell.cellId();
          const currentState = cell.getCurrentWidgetState();
          if (currentState !== undefined) {
            stateMap.set(CellIdUtils.toString(cellId), currentState);
          }
        }
      }

      // Update the store with the live widget states using untracked to avoid triggering effects
      if (stateMap.size > 0) {
        untracked(() => {
          this.#store.updateAllWidgetStates(stateMap);
        });
      }
    } finally {
      this.#isPreservingStates = false;
    }
  }
}
