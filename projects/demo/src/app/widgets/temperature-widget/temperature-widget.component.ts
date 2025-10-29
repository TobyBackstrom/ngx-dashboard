// temperature-widget.component.ts
import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';
import { ResponsiveTextDirective } from '@dragonworks/ngx-dashboard-widgets';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { svgIcon } from './temperature-widget.metadata';
import { TemperatureStateDialogComponent } from './temperature-state-dialog.component';
import { TemperatureSharedStateDialogComponent } from './temperature-shared-state-dialog.component';
import { TemperatureSharedState } from './temperature-shared-state.service';

export interface TemperatureWidgetState {
  temperature: number | null;
  unit: 'C' | 'F' | 'K';
  label?: string;
  hasBackground?: boolean;
  useSharedUnit?: boolean;
}

@Component({
  selector: 'demo-temperature-widget',
  standalone: true,
  imports: [ResponsiveTextDirective],
  templateUrl: './temperature-widget.component.html',
  styleUrl: './temperature-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemperatureWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: '@demo/temperature-widget',
    name: $localize`:@@demo.widgets.temperature.name:Temperature`,
    description: $localize`:@@demo.widgets.temperature.description:Display a temperature value`,
    svgIcon,
  };

  readonly #sanitizer = inject(DomSanitizer);
  readonly #dialog = inject(MatDialog);
  readonly #sharedState = inject(TemperatureSharedState);

  readonly safeSvgIcon = this.#sanitizer.bypassSecurityTrustHtml(svgIcon);

  readonly state = signal<TemperatureWidgetState>({
    temperature: null,
    unit: 'C',
    label: '',
    hasBackground: true,
    useSharedUnit: false,
  });

  // Template string for ResponsiveText sizing (widest possible temperature format)
  readonly templateString = '888888';

  // Computed property to check if temperature is set
  readonly hasTemperature = computed(() => this.state().temperature !== null);

  // Computed property for the effective unit (shared or instance)
  readonly effectiveUnit = computed(() => {
    return this.state().useSharedUnit
      ? this.#sharedState.config().unit
      : this.state().unit;
  });

  // Computed property for formatted temperature value (converted from Celsius to selected unit)
  readonly temperatureValue = computed(() => {
    const tempCelsius = this.state().temperature;
    const unit = this.effectiveUnit();

    if (tempCelsius === null) {
      return '';
    }

    // Convert from Celsius to selected unit
    const convertedTemp = this.convertFromCelsius(tempCelsius, unit);

    const formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    });

    return formatter.format(convertedTemp);
  });

  // Computed property for unit symbol
  readonly unitSymbol = computed(() => {
    return `°${this.effectiveUnit()}`;
  });

  /**
   * Convert temperature from Celsius to the specified unit
   */
  private convertFromCelsius(celsius: number, unit: 'C' | 'F' | 'K'): number {
    switch (unit) {
      case 'C':
        return celsius;
      case 'F':
        return (celsius * 9) / 5 + 32;
      case 'K':
        return celsius + 273.15;
    }
  }

  dashboardSetState(state?: unknown): void {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as TemperatureWidgetState),
      }));
    }
  }

  dashboardGetState(): TemperatureWidgetState {
    return this.state();
  }

  dashboardEditState(): void {
    const dialogRef = this.#dialog.open(TemperatureStateDialogComponent, {
      data: {
        instanceState: this.state(),
        sharedStateProvider: this.#sharedState,
      },
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.state.set(result);
      }
    });
  }

  dashboardEditSharedState(): void {
    this.#dialog.open(TemperatureSharedStateDialogComponent, {
      data: this.#sharedState,
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: false,
    });
  }
}
