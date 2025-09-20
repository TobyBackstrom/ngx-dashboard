// arrow-widget.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';
import { DomSanitizer } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { svgIcon } from './arrow-widget.metadata';
import { ArrowStateDialogComponent } from './arrow-state-dialog.component';

export interface ArrowWidgetState {
  direction: 'left' | 'up' | 'right' | 'down';
  opacity?: number;
  hasBackground?: boolean;
}

@Component({
  selector: 'ngx-dashboard-arrow-widget',
  imports: [],
  templateUrl: './arrow-widget.component.html',
  styleUrl: './arrow-widget.component.scss',
})
export class ArrowWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: '@ngx-dashboard/arrow-widget',
    name: $localize`:@@ngx.dashboard.widgets.arrow.name:Arrow`,
    description: $localize`:@@ngx.dashboard.widgets.arrow.description:A generic arrow`,
    svgIcon,
  };

  readonly #sanitizer = inject(DomSanitizer);
  readonly #dialog = inject(MatDialog);

  readonly safeSvgIcon = this.#sanitizer.bypassSecurityTrustHtml(svgIcon);

  readonly state = signal<ArrowWidgetState>({
    direction: 'up',
    opacity: 0.3,
    hasBackground: true,
  });
  // Computed rotation
  readonly rotationAngle = computed(() => {
    const rotationMap = {
      up: 0,
      right: 90,
      down: 180,
      left: 270,
    };
    return rotationMap[this.state().direction];
  });

  dashboardSetState(state?: unknown): void {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as ArrowWidgetState),
      }));
    }
  }

  dashboardGetState(): ArrowWidgetState {
    return this.state();
  }

  dashboardEditState(): void {
    const dialogRef = this.#dialog.open(ArrowStateDialogComponent, {
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
