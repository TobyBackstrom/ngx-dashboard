// realtime-gauge-widget.component.ts
import {
  Component,
  inject,
  signal,
  computed,
  effect,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import {
  RadialGaugeComponent,
  ResponsiveTextDirective,
} from '@dragonworks/ngx-dashboard-widgets';
import { svgIcon } from './realtime-gauge-widget.metadata';
import { RealtimeGaugeStateDialogComponent } from './realtime-gauge-state-dialog.component';
import { VolatileTimeSeries } from '../../utils';

export interface RealtimeGaugeWidgetState {
  // Visual settings (passed to RadialGaugeComponent)
  colorProfile?: 'dynamic' | 'static';
  active?: boolean;
  hasBackground?: boolean;
  showValueLabel?: boolean;
  label?: string;
  showLabel?: boolean;

  // Real-time data settings
  datasource?: 'random' | 'none';
  updateInterval?: number; // seconds (1-10)
}

@Component({
  selector: 'demo-realtime-gauge-widget',
  standalone: true,
  imports: [RadialGaugeComponent, ResponsiveTextDirective],
  templateUrl: './realtime-gauge-widget.component.html',
  styleUrl: './realtime-gauge-widget.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealtimeGaugeWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: '@demo/realtime-gauge-widget',
    name: $localize`:@@demo.widgets.realtimeGauge.name:Realtime Gauge`,
    description: $localize`:@@demo.widgets.realtimeGauge.description:Gauge with real-time data updates`,
    svgIcon,
  };

  readonly #dialog = inject(MatDialog);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #destroyRef = inject(DestroyRef);

  readonly safeSvgIcon = this.#sanitizer.bypassSecurityTrustHtml(svgIcon);

  readonly state = signal<RealtimeGaugeWidgetState>({
    colorProfile: 'dynamic',
    active: false,
    hasBackground: true,
    showValueLabel: true,
    label: '',
    showLabel: false,
    datasource: 'none',
    updateInterval: 1,
  });

  // Current gauge value as signal
  readonly gaugeValue = signal(50);

  // Data generator for random values
  #dataGenerator?: VolatileTimeSeries;
  #updateTimer?: ReturnType<typeof setInterval>;

  // Computed segments based on state's color profile
  readonly segments = computed(() => {
    const profile = this.state().colorProfile || 'dynamic';

    if (profile === 'static') {
      // Static performance segments
      return [
        { from: 0, to: 25, color: '#dc2626' }, // Poor - red
        { from: 25, to: 50, color: '#f59e0b' }, // Fair - orange
        { from: 50, to: 75, color: '#3b82f6' }, // Good - blue
        { from: 75, to: 100, color: '#10b981' }, // Excellent - green
      ];
    } else {
      // Dynamic theme-aware segments
      return [
        { from: 0, to: 60, color: 'var(--mat-sys-error)' },
        { from: 60, to: 80, color: 'var(--mat-sys-secondary)' },
        { from: 80, to: 100, color: 'var(--mat-sys-tertiary)' },
      ];
    }
  });

  constructor() {
    // Effect to handle real-time updates
    effect(() => {
      // Watch for datasource and updateInterval changes
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.state().datasource; // Required for effect tracking - triggers setup on datasource changes
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      this.state().updateInterval; // Required for effect tracking - triggers setup on interval changes

      this.#setupRealtimeUpdates();
    });

    // Setup cleanup on component destruction
    this.#destroyRef.onDestroy(() => {
      this.#stopRealtimeUpdates();
      this.#dataGenerator = undefined;
    });
  }

  #setupRealtimeUpdates(): void {
    // Clear any existing timer
    this.#stopRealtimeUpdates();

    const currentState = this.state();

    if (currentState.datasource === 'random') {
      // Create data generator with specified range
      this.#dataGenerator = VolatileTimeSeries.createValueSeries(0, 100, 1);

      // Convert seconds to milliseconds
      const intervalMs = (currentState.updateInterval ?? 2) * 1000;

      // Update immediately
      this.#updateValue();

      // Set up timer for periodic updates
      this.#updateTimer = setInterval(() => {
        this.#updateValue();
      }, intervalMs);
    } else {
      this.gaugeValue.set(75);
    }
  }

  #stopRealtimeUpdates(): void {
    if (this.#updateTimer) {
      clearInterval(this.#updateTimer);
      this.#updateTimer = undefined;
    }
  }

  #updateValue(): void {
    if (this.#dataGenerator) {
      const newValue = this.#dataGenerator.next();
      this.gaugeValue.set(newValue);
    }
  }

  dashboardSetState(state?: unknown): void {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as RealtimeGaugeWidgetState),
      }));
    }
  }

  dashboardGetState(): RealtimeGaugeWidgetState {
    return this.state();
  }

  dashboardEditState(): void {
    const dialogRef = this.#dialog.open(RealtimeGaugeStateDialogComponent, {
      data: this.state(),
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
}
