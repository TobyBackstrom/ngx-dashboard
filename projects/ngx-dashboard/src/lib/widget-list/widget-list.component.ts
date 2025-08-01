// widget-list.component.ts
import {
  Component,
  computed,
  inject,
  Renderer2,
  signal,
  ChangeDetectionStrategy,
  afterNextRender,
} from '@angular/core';
import { DragData, WidgetMetadata } from '../models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DashboardService } from '../services/dashboard.service';
import { DashboardBridgeService } from '../services/dashboard-bridge.service';

interface WidgetDisplayItem extends WidgetMetadata {
  safeSvgIcon?: SafeHtml;
}

@Component({
  selector: 'ngx-dashboard-widget-list',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './widget-list.component.html',
  styleUrl: './widget-list.component.scss',
})
export class WidgetListComponent {
  readonly #service = inject(DashboardService);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #renderer = inject(Renderer2);
  readonly #bridge = inject(DashboardBridgeService);

  activeWidget = signal<string | null>(null);

  // Get grid cell dimensions from bridge service (uses first available dashboard)
  gridCellDimensions = this.#bridge.availableDimensions;

  widgets = computed(() =>
    this.#service.widgetTypes().map((w) => ({
      ...w.metadata,
      safeSvgIcon: this.#sanitizer.bypassSecurityTrustHtml(w.metadata.svgIcon),
    }))
  );

  onDragStart(event: DragEvent, widget: WidgetDisplayItem) {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = 'copy';

    const dragData: DragData = {
      kind: 'widget',
      content: widget,
    };

    this.activeWidget.set(widget.widgetTypeid);
    this.#bridge.startDrag(dragData);

    // Create custom drag ghost for better UX
    const ghost = this.#createDragGhost(widget.svgIcon);
    document.body.appendChild(ghost);

    // Force reflow to ensure element is rendered
    const _reflow = ghost.offsetHeight;

    event.dataTransfer.setDragImage(ghost, 10, 10);

    // Delay removal to ensure browser has time to snapshot the drag image
    setTimeout(() => ghost.remove());
  }

  onDragEnd(): void {
    this.activeWidget.set(null);
    this.#bridge.endDrag();
  }

  #createDragGhost(svgIcon: string | undefined): HTMLElement {
    const dimensions = this.gridCellDimensions();

    const el = this.#renderer.createElement('div');
    el.classList.add('drag-ghost');

    if (svgIcon) {
      const iconWrapper = this.#renderer.createElement('div');
      this.#renderer.addClass(iconWrapper, 'icon');

      iconWrapper.innerHTML = svgIcon;
      const svg = iconWrapper.querySelector('svg');

      if (svg) {
        svg.setAttribute('width', `${dimensions.width * 0.8}`);
        svg.setAttribute('height', `${dimensions.height * 0.8}`);
        svg.setAttribute('fill', '#000000');
        svg.setAttribute('opacity', '0.3');
      }

      el.appendChild(iconWrapper);
    }

    Object.assign(el.style, {
      boxSizing: 'border-box',
      position: 'absolute',
      top: '0',
      left: '0',
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      zIndex: '9999',
      margin: '0',
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      pointerEvents: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.7,
    });

    return el;
  }
}
