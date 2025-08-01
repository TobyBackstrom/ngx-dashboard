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
  viewChild,
  DestroyRef,
  OnChanges,
  SimpleChanges,
  untracked,
  computed,
} from '@angular/core';
import { DashboardViewerComponent } from '../dashboard-viewer/dashboard-viewer.component';
import { DashboardEditorComponent } from '../dashboard-editor/dashboard-editor.component';
import { DashboardStore } from '../store/dashboard-store';
import { DashboardDataDto } from '../models/dashboard-data.dto';
import { DashboardBridgeService } from '../services/dashboard-bridge.service';
import { DashboardViewportService } from '../services/dashboard-viewport.service';
import { ReservedSpace } from '../models/reserved-space';

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

  // Public export/import methods
  exportDashboard(): DashboardDataDto {
    // Delegate to the active child component
    if (this.editMode()) {
      const editor = this.dashboardEditor();
      return editor ? editor.exportDashboard() : this.#store.exportDashboard();
    } else {
      const viewer = this.dashboardViewer();
      return viewer ? viewer.exportDashboard() : this.#store.exportDashboard();
    }
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
      let currentWidgetStates: Map<string, unknown> | null = null;

      if (previousEditMode) {
        // Previously in edit mode, collect states from editor
        const editor = this.dashboardEditor();
        if (editor) {
          currentWidgetStates = editor.getCurrentWidgetStates();
        }
      } else {
        // Previously in view mode, collect states from viewer
        const viewer = this.dashboardViewer();
        if (viewer) {
          currentWidgetStates = viewer.getCurrentWidgetStates();
        }
      }

      // Update the store with the live widget states using untracked to avoid triggering effects
      if (currentWidgetStates && currentWidgetStates.size > 0) {
        untracked(() => {
          this.#store.updateAllWidgetStates(currentWidgetStates);
        });
      }
    } finally {
      this.#isPreservingStates = false;
    }
  }
}
