// clock-widget.component.ts
import { Component, inject, signal } from '@angular/core';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';
import { svgIcon } from './clock-widget.metadata';
import { DomSanitizer } from '@angular/platform-browser';
import { ClockStateDialogComponent } from './clock-state-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { DigitalClockComponent } from './digital-clock/digital-clock.component';
import { AnalogClockComponent } from './analog-clock/analog-clock.component';

export interface ClockWidgetState {
  mode: 'analog' | 'digital';
  hasBackground?: boolean;
  timeFormat?: '12h' | '24h';
  showSeconds?: boolean;
}

@Component({
  selector: 'ngx-dashboard-clock-widget',
  standalone: true,
  imports: [DigitalClockComponent, AnalogClockComponent],
  templateUrl: './clock-widget.component.html',
  styleUrl: './clock-widget.component.scss',
})
export class ClockWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: '@ngx-dashboard/clock-widget',
    name: $localize`:@@ngx.dashboard.widgets.clock.name:Clock`,
    description: $localize`:@@ngx.dashboard.widgets.clock.description:Display time in analog or digital format`,
    svgIcon,
  };

  readonly #sanitizer = inject(DomSanitizer);
  readonly #dialog = inject(MatDialog);

  safeSvgIcon = this.#sanitizer.bypassSecurityTrustHtml(svgIcon);

  state = signal<ClockWidgetState>({
    mode: 'analog',
    hasBackground: true,
    timeFormat: '24h',
    showSeconds: true,
  });

  constructor() {
    // No timer logic needed - DigitalClock manages its own time
  }

  dashboardSetState(state?: unknown) {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as ClockWidgetState),
      }));
    }
  }

  dashboardGetState(): ClockWidgetState {
    return { ...this.state() };
  }

  dashboardEditState(): void {
    const dialogRef = this.#dialog.open(ClockStateDialogComponent, {
      data: this.dashboardGetState(),
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: false,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: ClockWidgetState | undefined) => {
        if (result) {
          this.state.set(result);
        }
      });
  }

  get isAnalog(): boolean {
    return this.state().mode === 'analog';
  }

  get isDigital(): boolean {
    return this.state().mode === 'digital';
  }
}
