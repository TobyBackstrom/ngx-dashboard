// dashboard.component.ts
//
// A performant, modular, and fully reactive Angular dashboard container that orchestrates between
// editing and viewing modes — with clean component separation and no external dependencies.

import { CommonModule } from '@angular/common';
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
import { DashboardViewerComponent, GridRange } from '../dashboard-viewer/dashboard-viewer.component';
import { DashboardEditorComponent } from '../dashboard-editor/dashboard-editor.component';
import { DashboardStore } from '../store/dashboard-store';
import { DashboardDataDto } from '../models/dashboard-data.dto';
import { DashboardBridgeService } from '../services/dashboard-bridge.service';
import { DashboardViewportService } from '../services/dashboard-viewport.service';
import { ReservedSpace } from '../models/reserved-space';
import { CellIdUtils } from '../models';

@Component({
  selector: 'ngx-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardViewerComponent, DashboardEditorComponent],
  providers: [DashboardStore, DashboardViewportService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  host: {
    '[style.--rows]': 'store.rows()',
    '[style.--columns]': 'store.columns()',
    '[style.--gutter-size]': 'store.gutterSize()',
    '[style.--gutters]': 'store.columns() + 1',
    '[class.is-edit-mode]': 'editMode()',
    '[style.max-width.px]': 'viewport.constraints().maxWidth',
    '[style.max-height.px]': 'viewport.constraints().maxHeight',
  },
})
export class DashboardComponent implements OnChanges {
  #store = inject(DashboardStore);
  #bridge = inject(DashboardBridgeService);
  #viewport = inject(DashboardViewportService);
  #destroyRef = inject(DestroyRef);

  // Public accessors for template
  protected readonly store = this.#store;
  protected readonly viewport = this.#viewport;

  // Component inputs
  dashboardData = input.required<DashboardDataDto>();
  editMode = input<boolean>(false);
  reservedSpace = input<ReservedSpace>();
  enableSelection = input<boolean>(false);

  // Component outputs
  rangeSelected = output<GridRange>();

  // Store signals - shared by both child components
  cells = this.#store.cells;

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

    // Initialize from dashboardData
    effect(() => {
      const data = this.dashboardData();
      if (data) {
        this.#store.initializeFromDto(data);
        // Register with bridge service after dashboard ID is set
        this.#bridge.updateDashboardRegistration(this.#store);
        this.#isInitialized = true;
      }
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

  // Public export/import methods
  exportDashboard(): DashboardDataDto {
    // Export dashboard with live widget states
    return this.#store.exportDashboard(() => this.getCurrentWidgetStates());
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
