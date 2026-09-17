import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UNKNOWN_WIDGET_CONTEXT } from '@dragonworks/ngx-dashboard';

/**
 * Error view for a widget whose feature module has not been loaded - the same
 * resolver, a different answer, because "you may not see this" and "this part
 * of the app is not here yet" deserve different wording.
 */
@Component({
  selector: 'app-module-missing-widget',
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <div class="module-missing" [matTooltip]="tooltip">
      <mat-icon>extension_off</mat-icon>
      <span i18n="@@demo.errorViews.moduleMissingLabel">Module not loaded</span>
    </div>
  `,
  styles: [
    `
      .module-missing {
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
        background: var(--mat-sys-surface-container);
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
        text-align: center;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModuleMissingWidgetComponent {
  readonly #context = inject(UNKNOWN_WIDGET_CONTEXT);

  protected readonly tooltip = $localize`:@@demo.errorViews.moduleMissingTooltip:${this.#context.widgetTypeid}:INTERPOLATION: ships with a feature module this session has not loaded`;
}
