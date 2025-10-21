// temperature-shared-state.service.ts
import { Injectable, signal } from '@angular/core';
import { WidgetSharedStateProvider } from '@dragonworks/ngx-dashboard';

export interface TemperatureSharedConfig {
  unit: 'C' | 'F' | 'K';
}

@Injectable({ providedIn: 'root' })
export class TemperatureSharedState
  implements WidgetSharedStateProvider<TemperatureSharedConfig>
{
  private state = signal<TemperatureSharedConfig>({
    unit: 'C',
  });

  // Required by WidgetSharedStateProvider interface
  getSharedState(): TemperatureSharedConfig {
    return this.state();
  }

  // Required by WidgetSharedStateProvider interface
  setSharedState(state: TemperatureSharedConfig): void {
    this.state.set(state);
  }

  // Public API for widget consumption
  readonly config = this.state.asReadonly();

  // Helper method to update unit
  updateUnit(unit: 'C' | 'F' | 'K'): void {
    this.state.update((s) => ({ ...s, unit }));
  }
}
