// radial-gauge-widget.component.ts
import { Component, inject, signal } from '@angular/core';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { svgIcon } from './radial-gauge-widget.metadata';
import { RadialGaugeStateDialogComponent } from './radial-gauge-state-dialog.component';

export interface RadialGaugeWidgetState {
  value?: number;
  min?: number;
  max?: number;
  hasBackground?: boolean;
}

@Component({
  selector: 'ngx-dashboard-radial-gauge-widget',
  imports: [],
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

  readonly #sanitizer = inject(DomSanitizer);
  readonly #dialog = inject(MatDialog);

  readonly safeSvgIcon = this.#sanitizer.bypassSecurityTrustHtml(svgIcon);

  readonly state = signal<RadialGaugeWidgetState>({
    value: 50,
    min: 0,
    max: 100,
    hasBackground: true,
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