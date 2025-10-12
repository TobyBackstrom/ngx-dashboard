import {
  Component,
  inject,
  viewChild,
  computed,
  ChangeDetectionStrategy,
  signal,
  effect,
  HostListener,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  DashboardComponent as NgxDashboardComponent,
  WidgetListComponent,
  createEmptyDashboard,
  ReservedSpace,
  DashboardDataDto,
  GridSelection,
} from '@dragonworks/ngx-dashboard';
import {
  FilePersistenceService,
  LocalStoragePersistenceService,
} from '../../services';
import { DashboardFabComponent } from './dashboard-fab.component';
import { CellSelectionDialogComponent } from './cell-selection-dialog.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    NgxDashboardComponent,
    WidgetListComponent,
    DashboardFabComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  // Service injections
  private filePersistenceService = inject(FilePersistenceService);
  private localStoragePersistenceService = inject(
    LocalStoragePersistenceService
  );
  private document = inject(DOCUMENT);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // Dashboard resource for auto-loading with dynamic base href
  protected dashboardResource = httpResource<DashboardDataDto | null>(() => {
    const baseHref =
      this.document.querySelector('base')?.href || window.location.origin + '/';
    const dashboardUrl = new URL('demo-dashboard.json', baseHref).href;
    return { url: dashboardUrl };
  });

  // Local state
  protected editMode = signal(false);
  protected selectMode = signal(false);
  protected isZoomed = signal(false);
  protected originalDashboard = signal<DashboardDataDto | null>(null);

  // Dashboard configuration
  protected dashboardConfig = createEmptyDashboard(
    'demo-dashboard-main',
    8,
    16,
    '0.5em'
  );

  // Component references
  dashboard = viewChild.required<NgxDashboardComponent>('dashboard');

  constructor() {
    // Auto-load dashboard when resource resolves - use queueMicrotask for ViewChild availability
    effect(() => {
      const dashboardData = this.dashboardResource.value();
      const status = this.dashboardResource.status();

      // Load dashboard when data becomes available and ViewChild is ready
      if (dashboardData && status === 'resolved') {
        queueMicrotask(() => {
          this.dashboard().loadDashboard(dashboardData);
        });
      }
    });
  }

  // Reserved space configuration for viewport constraints
  protected readonly dashboardReservedSpace = computed(
    (): ReservedSpace => ({
      top: 56 + 16, // Compact toolbar height and padding
      bottom: 16 + 12 + 12, // Bottom padding from dashboard-viewport-container, dashboard border
      left: 16, // Left padding
      right: 16 + (this.editMode() ? 320 + 16 : 0), // Right padding + widget list width when in edit mode
    })
  );

  /**
   * Toggle edit mode
   * Automatically disables selection mode when entering edit mode
   */
  onEditModeToggle(): void {
    this.editMode.update((mode) => !mode);
    // Disable selection mode when entering edit mode
    if (this.editMode()) {
      this.selectMode.set(false);
    }
  }

  /**
   * Export dashboard to JSON file
   */
  async onExportToFile(): Promise<void> {
    try {
      const data = this.dashboard().exportDashboard();
      await this.filePersistenceService.exportDashboard(
        data,
        'my-dashboard.json'
      );
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      alert('Failed to export dashboard');
    }
  }

  /**
   * Import dashboard from JSON file
   */
  async onImportFromFile(): Promise<void> {
    try {
      const data = await this.filePersistenceService.importDashboard();
      if (data) {
        this.dashboard().loadDashboard(data);
      }
    } catch (error) {
      console.error('Error importing dashboard:', error);
      alert('Failed to import dashboard');
    }
  }

  /**
   * Save dashboard to localStorage
   */
  async onSaveToLocalStorage(): Promise<void> {
    try {
      const data = this.dashboard().exportDashboard();
      const slotName = prompt(
        'Enter a name for this dashboard:',
        'My Dashboard'
      );
      if (slotName) {
        await this.localStoragePersistenceService.exportDashboard(
          data,
          slotName
        );
      }
    } catch (error) {
      console.error('Error saving dashboard:', error);
      alert('Failed to save dashboard');
    }
  }

  /**
   * Load dashboard from localStorage
   */
  async onLoadFromLocalStorage(): Promise<void> {
    try {
      const data = await this.localStoragePersistenceService.importDashboard();
      if (data) {
        this.dashboard().loadDashboard(data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Failed to load dashboard');
    }
  }

  /**
   * Clear dashboard
   */
  onClearDashboard(): void {
    this.dashboard().clearDashboard();
  }

  /**
   * Reset dashboard to default configuration from demo-dashboard.json
   */
  onResetToDefault(): void {
    // Trigger reload of the resource - effect will handle the loading automatically
    this.dashboardResource.reload();
  }

  onSelectionComplete(selection: GridSelection): void {
    const dialogRef = this.dialog.open(CellSelectionDialogComponent, {
      width: '300px',
      maxWidth: '90vw',
      autoFocus: false,
      data: selection,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'zoom') {
        // Store the current dashboard state before zooming
        const currentDashboard = this.dashboard().exportDashboard();
        this.originalDashboard.set(currentDashboard);

        // Export and load the zoomed area with minimal bounding box
        const zoomedData = this.dashboard().exportDashboard(selection, {
          useMinimalBounds: true,
          padding: 1,
        });
        this.dashboard().loadDashboard(zoomedData);

        // Enter zoom mode
        this.isZoomed.set(true);

        // Show zoom indicator
        this.snackBar.open(
          $localize`:@@demo.dashboard.zoomModeActive:Zoomed in • Press ESC to exit`,
          undefined,
          { duration: 3000 }
        );
      }

      // Always reset select mode after dialog closes
      this.selectMode.set(false);
    });
  }

  /**
   * Toggle select mode - enables area selection
   */
  onSelectToggle(): void {
    this.selectMode.update((mode) => !mode);

    // Show instructions when entering selection mode
    if (this.selectMode()) {
      this.snackBar.open(
        $localize`:@@demo.dashboard.selectionModeInstructions:Drag to select area • Press ESC to cancel`,
        undefined,
        {
          duration: 4000,
          panelClass: 'centered-snackbar',
        }
      );
    }
  }

  /**
   * Cancel select mode
   */
  cancelSelect(): void {
    this.selectMode.set(false);
  }

  /**
   * Exit zoom mode and restore original dashboard
   */
  exitZoom(): void {
    const original = this.originalDashboard();
    if (original && this.isZoomed()) {
      this.dashboard().loadDashboard(original);
      this.originalDashboard.set(null);
      this.isZoomed.set(false);

      this.snackBar.open(
        $localize`:@@demo.dashboard.exitedZoom:Returned to full dashboard`,
        undefined,
        { duration: 2000 }
      );
    }
  }

  /**
   * Handle ESC key to cancel select mode or exit zoom
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isZoomed()) {
      this.exitZoom();
    } else if (this.selectMode()) {
      this.cancelSelect();
    }
  }
}
