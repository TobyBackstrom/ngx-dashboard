// label-widget.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';
import { svgIcon } from './label-widget.metadata';
import { DomSanitizer } from '@angular/platform-browser';
import { LabelStateDialogComponent } from './label-state-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { ResponsiveTextDirective } from '../../directives/responsive-text.directive';

export interface LabelWidgetState {
  label: string;
  fontSize?: number;
  alignment?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'bold';
  opacity?: number;
  hasBackground?: boolean;
  responsive?: boolean;
  // Font size constraints for responsive text (px values)
  minFontSize?: number; // Default: 8px (accessible minimum)
  maxFontSize?: number; // Default: 64px (practical widget maximum)
}

@Component({
  selector: 'ngx-dashboard-label-widget',
  imports: [ResponsiveTextDirective],
  templateUrl: './label-widget.component.html',
  styleUrl: './label-widget.component.scss',
})
export class LabelWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: '@ngx-dashboard/label-widget',
    name: $localize`:@@ngx.dashboard.widgets.label.name:Label`,
    description: $localize`:@@ngx.dashboard.widgets.label.description:A generic text label`,
    svgIcon,
  };

  readonly #sanitizer = inject(DomSanitizer);
  readonly #dialog = inject(MatDialog);

  safeSvgIcon = this.#sanitizer.bypassSecurityTrustHtml(svgIcon);

  state = signal<LabelWidgetState>({
    label: '',
    fontSize: 16,
    alignment: 'center',
    fontWeight: 'normal',
    opacity: 1,
    hasBackground: true,
    responsive: false,
    minFontSize: 8, // Accessible minimum for responsive text
    maxFontSize: 64, // Practical maximum for widget display
  });

  dashboardSetState(state?: unknown) {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as LabelWidgetState),
      }));
    }
  }

  dashboardGetState(): LabelWidgetState {
    return { ...this.state() };
  }

  dashboardEditState(): void {
    const dialogRef = this.#dialog.open(LabelStateDialogComponent, {
      data: this.dashboardGetState(),
      width: '400px',
      maxWidth: '90vw',
      disableClose: false,
      autoFocus: false,
    });

    dialogRef
      .afterClosed()
      .subscribe((result: LabelWidgetState | undefined) => {
        if (result) {
          this.state.set(result);
        }
      });
  }

  get hasContent(): boolean {
    return !!this.state().label?.trim();
  }

  get label(): string {
    return this.state().label?.trim();
  }

  // Computed properties for responsive font size limits with fallbacks
  readonly minFontSize = computed(() => this.state().minFontSize ?? 8);
  readonly maxFontSize = computed(() => this.state().maxFontSize ?? 64);
}
