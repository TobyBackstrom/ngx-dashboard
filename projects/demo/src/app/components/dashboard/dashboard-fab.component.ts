import {
  Component,
  ChangeDetectionStrategy,
  signal,
  output,
  input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Valid dashboard action types
 */
type DashboardAction =
  | 'editMode'
  | 'export'
  | 'import'
  | 'save'
  | 'load'
  | 'clear'
  | 'reset'
  | 'select';

@Component({
  selector: 'app-dashboard-fab',
  imports: [MatButtonModule, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './dashboard-fab.component.html',
  styleUrl: './dashboard-fab.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardFabComponent {
  // State
  protected isSpeedDialOpen = signal(false);

  // Outputs for parent component
  editModeToggle = output<void>();
  exportToFile = output<void>();
  importFromFile = output<void>();
  saveToLocalStorage = output<void>();
  loadFromLocalStorage = output<void>();
  clearDashboard = output<void>();
  resetToDefault = output<void>();
  selectToggle = output<void>();

  // Edit mode and select mode inputs from parent
  editMode = input(false);
  selectMode = input(false);
  isWidgetListCollapsed = input(true);

  /**
   * Command map for action handlers
   * Maps each action type to its corresponding output emission
   */
  private readonly actionHandlers: Record<DashboardAction, () => void> = {
    editMode: () => this.editModeToggle.emit(),
    export: () => this.exportToFile.emit(),
    import: () => this.importFromFile.emit(),
    save: () => this.saveToLocalStorage.emit(),
    load: () => this.loadFromLocalStorage.emit(),
    clear: () => this.clearDashboard.emit(),
    reset: () => this.resetToDefault.emit(),
    select: () => this.selectToggle.emit(),
  };

  /**
   * Toggle the speed dial menu
   */
  toggleSpeedDial(): void {
    this.isSpeedDialOpen.update((open) => !open);
  }

  /**
   * Close the speed dial menu
   */
  closeSpeedDial(): void {
    this.isSpeedDialOpen.set(false);
  }

  /**
   * Handle action click and emit to parent
   * Uses command map pattern for extensibility
   */
  onAction(action: DashboardAction): void {
    this.closeSpeedDial();
    this.actionHandlers[action]?.();
  }

  /**
   * Get select mode toggle tooltip
   */
  getSelectModeTooltip(): string {
    return this.selectMode()
      ? $localize`:@@demo.dashboard.cancelSelect:Cancel Select`
      : $localize`:@@demo.dashboard.selectArea:Select Area`;
  }

  /**
   * Get edit mode toggle tooltip
   */
  getEditModeTooltip(): string {
    return this.editMode()
      ? $localize`:@@demo.dashboard.switchToViewMode:Switch to View Mode`
      : $localize`:@@demo.dashboard.switchToEditMode:Switch to Edit Mode`;
  }

  /**
   * Get main FAB tooltip
   */
  getMainFabTooltip(): string {
    return this.isSpeedDialOpen()
      ? $localize`:@@demo.dashboard.closeMenu:Close menu`
      : $localize`:@@demo.dashboard.dashboardActions:Dashboard actions`;
  }
}
