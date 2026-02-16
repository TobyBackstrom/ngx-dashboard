import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Widget, WidgetMetadata, UNKNOWN_WIDGET_TYPEID } from '../../models';

export interface UnknownWidgetState {
  originalWidgetTypeid: string;
}

@Component({
  selector: 'lib-unknown-widget',
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <div class="unknown-widget-container" [matTooltip]="tooltipText()">
      <mat-icon class="unknown-widget-icon">error_outline</mat-icon>
    </div>
  `,
  styles: [
    `
      .unknown-widget-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        background-color: var(--mat-sys-error);
        border-radius: 8px;
        container-type: size;
      }

      .unknown-widget-icon {
        color: var(--mat-sys-on-error);
        font-size: clamp(12px, 75cqmin, 68px);
        width: clamp(12px, 75cqmin, 68px);
        height: clamp(12px, 75cqmin, 68px);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnknownWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: UNKNOWN_WIDGET_TYPEID,
    name: $localize`:@@ngx.dashboard.unknown.widget.name:Unknown Widget`,
    description: $localize`:@@ngx.dashboard.unknown.widget.description:Fallback widget for unknown widget types`,
    svgIcon:
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>',
  };

  readonly state = signal<UnknownWidgetState>({
    originalWidgetTypeid: 'unknown',
  });

  readonly tooltipText = computed(() => `${this.state().originalWidgetTypeid}`);

  dashboardSetState(state?: unknown): void {
    if (state && typeof state === 'object' && 'originalWidgetTypeid' in state) {
      this.state.set(state as UnknownWidgetState);
    }
  }

  dashboardGetState(): UnknownWidgetState {
    return this.state();
  }

  // No edit dialog for error widgets - method intentionally not implemented
}
