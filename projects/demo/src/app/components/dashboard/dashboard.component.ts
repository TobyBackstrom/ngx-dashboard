import {
  Component,
  inject,
  viewChild,
  computed,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import {
  DashboardComponent as NgxDashboardComponent,
  WidgetListComponent,
  createEmptyDashboard,
  ReservedSpace,
  DashboardDataDto,
} from '@dragonworks/ngx-dashboard';
import {
  FilePersistenceService,
  LocalStoragePersistenceService,
} from '../../services';
import { DashboardFabComponent } from './dashboard-fab.component';

@Component({
  selector: 'app-dashboard',
  imports: [NgxDashboardComponent, WidgetListComponent, DashboardFabComponent],
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

  // Local state
  protected editMode = signal(false);

  // Dashboard configuration
  protected dashboardConfig = createEmptyDashboard(
    'demo-dashboard-main',
    8,
    16,
    '0.5em'
  );

  // Component references
  dashboard = viewChild.required<NgxDashboardComponent>('dashboard');
  fab = viewChild.required<DashboardFabComponent>('fab');

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
   */
  onEditModeToggle(): void {
    this.editMode.update((mode) => !mode);
    this.fab().setEditMode(this.editMode());
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
}
