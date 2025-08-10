import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

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

  // Edit mode input (will be passed from parent)
  editMode = signal(false);

  /**
   * Toggle the speed dial menu
   */
  toggleSpeedDial(): void {
    this.isSpeedDialOpen.update(open => !open);
  }

  /**
   * Close the speed dial menu
   */
  closeSpeedDial(): void {
    this.isSpeedDialOpen.set(false);
  }

  /**
   * Handle action click and emit to parent
   */
  onAction(action: string): void {
    this.closeSpeedDial();
    
    switch (action) {
      case 'editMode':
        this.editModeToggle.emit();
        break;
      case 'export':
        this.exportToFile.emit();
        break;
      case 'import':
        this.importFromFile.emit();
        break;
      case 'save':
        this.saveToLocalStorage.emit();
        break;
      case 'load':
        this.loadFromLocalStorage.emit();
        break;
      case 'clear':
        this.clearDashboard.emit();
        break;
      case 'reset':
        this.resetToDefault.emit();
        break;
    }
  }

  /**
   * Set edit mode from parent
   */
  setEditMode(editMode: boolean): void {
    this.editMode.set(editMode);
  }
}