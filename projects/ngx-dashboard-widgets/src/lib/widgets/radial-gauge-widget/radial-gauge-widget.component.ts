// radial-gauge-widget.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { RadialGaugeComponent } from '../../components/radial-gauge/radial-gauge.component';
import { svgIcon } from './radial-gauge-widget.metadata';
import { RadialGaugeStateDialogComponent } from './radial-gauge-state-dialog.component';

export interface RadialGaugeWidgetState {
  value?: number;
  colorProfile?: 'dynamic' | 'static';
  active?: boolean;
  hasBackground?: boolean;
  showValueLabel?: boolean;
}

@Component({
  selector: 'ngx-dashboard-radial-gauge-widget',
  imports: [RadialGaugeComponent],
  templateUrl: './radial-gauge-widget.component.html',
  styleUrl: './radial-gauge-widget.component.scss',
})
export class RadialGaugeWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: '@default/radial-gauge-widget',
    name: 'Radial Gauge',
    description: 'A semi-circular gauge indicator',
    svgIcon,
  };

  readonly #dialog = inject(MatDialog);
  readonly #sanitizer = inject(DomSanitizer);

  readonly safeSvgIcon = this.#sanitizer.bypassSecurityTrustHtml(svgIcon);

  readonly state = signal<RadialGaugeWidgetState>({
    value: 50,
    colorProfile: 'dynamic',
    active: false,
    hasBackground: true,
    showValueLabel: true,
  });

  readonly segments = computed(() => {
    const profile = this.state().colorProfile || 'dynamic';
    
    if (profile === 'static') {
      // Static performance segments (like CPU usage example)
      return [
        { from: 0, to: 25, color: '#dc2626' }, // Poor - red
        { from: 25, to: 50, color: '#f59e0b' }, // Fair - orange
        { from: 50, to: 75, color: '#3b82f6' }, // Good - blue
        { from: 75, to: 100, color: '#10b981' }, // Excellent - green
      ];
    } else {
      // Dynamic theme-aware segments (like demo gauge preview)
      return [
        { from: 0, to: 60, color: 'var(--mat-sys-error)' },
        { from: 60, to: 80, color: 'var(--mat-sys-secondary)' },
        { from: 80, to: 100, color: 'var(--mat-sys-tertiary)' },
      ];
    }
  });

  dashboardSetState(state?: unknown): void {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as RadialGaugeWidgetState),
      }));
    }
  }

  dashboardGetState(): RadialGaugeWidgetState {
    return this.state();
  }

  dashboardEditState(): void {
    const dialogRef = this.#dialog.open(RadialGaugeStateDialogComponent, {
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