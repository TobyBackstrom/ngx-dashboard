import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UNKNOWN_WIDGET_CONTEXT } from '@dragonworks/ngx-dashboard';

/**
 * Error view for a widget type this session is not meant to use.
 *
 * Note what it is not: no widget metadata, no `Widget` interface, no state
 * handling. It is a plain component that reads UNKNOWN_WIDGET_CONTEXT.
 */
@Component({
  selector: 'app-restricted-widget',
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <div class="restricted" [matTooltip]="tooltip">
      <mat-icon>visibility_off</mat-icon>
      <span i18n="@@demo.errorViews.restrictedLabel">Not available here</span>
    </div>
  `,
  styles: [
    `
      .restricted {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 100%;
        height: 100%;
        padding: 8px;
        box-sizing: border-box;
        border: 1px dashed var(--mat-sys-outline);
        border-radius: 8px;
        background: var(--mat-sys-surface-container-high);
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
        text-align: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestrictedWidgetComponent {
  readonly #context = inject(UNKNOWN_WIDGET_CONTEXT);

  protected readonly tooltip = $localize`:@@demo.errorViews.restrictedTooltip:This session cannot use ${this.#context.widgetTypeid}:INTERPOLATION:`;
}
