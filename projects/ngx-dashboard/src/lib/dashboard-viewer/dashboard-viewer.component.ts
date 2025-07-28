import { Component, computed, effect, inject, input, viewChildren, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CellComponent } from '../cell/cell.component';
import { DashboardStore } from '../store/dashboard-store';
import { CellIdUtils } from '../models';

@Component({
  selector: 'ngx-dashboard-viewer',
  standalone: true,
  imports: [CellComponent, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-viewer.component.html',
  styleUrl: './dashboard-viewer.component.scss',
  host: {
    '[style.--rows]': 'rows()',
    '[style.--columns]': 'columns()',
    '[style.--gutter-size]': 'gutterSize()',
    '[style.--gutters]': 'gutters()',
  },
})
export class DashboardViewerComponent {
  #store = inject(DashboardStore);
  cellComponents = viewChildren(CellComponent);

  rows = input.required<number>();
  columns = input.required<number>();
  gutterSize = input<string>('1em');
  gutters = computed(() => this.columns() + 1);

  // store signals - read-only
  cells = this.#store.cells;

  constructor() {
    // Sync grid configuration with store when inputs change
    effect(() => {
      this.#store.setGridConfig({
        rows: this.rows(),
        columns: this.columns(),
        gutterSize: this.gutterSize(),
      });
    });
  }

  /**
   * Get current widget states from all cell components.
   * Used during dashboard export to get live widget states.
   */
  getCurrentWidgetStates(): Map<string, unknown> {
    const stateMap = new Map<string, unknown>();
    
    const cells = this.cellComponents();
    for (const cell of cells) {
      const cellId = cell.id();
      const currentState = cell.getCurrentWidgetState();
      if (currentState !== undefined) {
        stateMap.set(CellIdUtils.toString(cellId), currentState);
      }
    }
    
    return stateMap;
  }

  /**
   * Export dashboard with live widget states from current component instances.
   * This ensures the most up-to-date widget states are captured.
   */
  exportDashboard() {
    return this.#store.exportDashboard(() => this.getCurrentWidgetStates());
  }
}
