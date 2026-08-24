// widget-list.component.ts
import {
  Component,
  computed,
  inject,
  Renderer2,
  signal,
  input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DragData, WidgetMetadata } from '../models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DashboardService } from '../services/dashboard.service';
import { DashboardBridgeService } from '../services/dashboard-bridge.service';
import { MatTooltipModule } from '@angular/material/tooltip';

interface WidgetDisplayItem extends WidgetMetadata {
  safeSvgIcon?: SafeHtml;
}

/**
 * A rendered section of the widget list. `label` is undefined for the trailing
 * section holding widgets that declare no `WidgetMetadata.group`; that section
 * is rendered without a heading.
 */
interface WidgetListGroup {
  label?: string;
  widgets: WidgetDisplayItem[];
}

@Component({
  selector: 'ngx-dashboard-widget-list',
  standalone: true,
  imports: [MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './widget-list.component.html',
  styleUrl: './widget-list.component.scss',
})
export class WidgetListComponent {
  readonly #service = inject(DashboardService);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #renderer = inject(Renderer2);
  readonly #bridge = inject(DashboardBridgeService);

  // Input to track collapsed state for tooltip display
  collapsed = input<boolean>(false);

  /**
   * Labels of the groups the user has collapsed. Groups start expanded, and the
   * state is per component instance (not persisted) — the list is a transient
   * editing surface.
   */
  readonly #collapsedGroups = signal<ReadonlySet<string>>(new Set<string>());

  activeWidget = signal<string | null>(null);

  // Get grid cell dimensions from bridge service (uses first available dashboard)
  gridCellDimensions = this.#bridge.availableDimensions;

  widgets = computed(() =>
    this.#service.widgetTypes().map((w) => ({
      ...w.metadata,
      safeSvgIcon: this.#sanitizer.bypassSecurityTrustHtml(w.metadata.svgIcon),
    }))
  );

  /**
   * Widgets bucketed by `WidgetMetadata.group`. Groups keep the order in which
   * they were first seen in the registration order, widgets keep their
   * registration order within a group, and ungrouped widgets trail the labelled
   * groups in a single unlabelled section. With no widget declaring a group the
   * result is one unlabelled section, i.e. the previous flat rendering.
   */
  widgetGroups = computed<WidgetListGroup[]>(() => {
    const labelled: WidgetListGroup[] = [];
    const byLabel = new Map<string, WidgetListGroup>();
    const ungrouped: WidgetDisplayItem[] = [];

    for (const widget of this.widgets()) {
      const label = widget.group?.trim();

      if (!label) {
        ungrouped.push(widget);
        continue;
      }

      let group = byLabel.get(label);
      if (!group) {
        group = { label, widgets: [] };
        byLabel.set(label, group);
        labelled.push(group);
      }
      group.widgets.push(widget);
    }

    return ungrouped.length > 0
      ? [...labelled, { widgets: ungrouped }]
      : labelled;
  });

  /**
   * Whether a group's widgets are shown. Ungrouped widgets have no heading to
   * toggle, so they are always shown.
   */
  isGroupExpanded(label?: string): boolean {
    return !label || !this.#collapsedGroups().has(label);
  }

  /** Toggles a group open/closed. No-op for the unlabelled group. */
  toggleGroup(label?: string): void {
    if (!label) return;

    this.#collapsedGroups.update((collapsed) => {
      const next = new Set(collapsed);
      if (!next.delete(label)) {
        next.add(label);
      }
      return next;
    });
  }

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    this.#renderer.addClass(el, 'drag-ghost');

    // Set dimensions using CSS custom properties for dynamic sizing
    this.#renderer.setStyle(el, 'width', `${dimensions.width}px`);
    this.#renderer.setStyle(el, 'height', `${dimensions.height}px`);

    if (svgIcon) {
      const iconWrapper = this.#renderer.createElement('div');
      this.#renderer.addClass(iconWrapper, 'icon');

      iconWrapper.innerHTML = svgIcon;
      const svg = iconWrapper.querySelector('svg');

      if (svg) {
        // Size the SVG to 80% of the cell dimensions
        svg.setAttribute('width', `${dimensions.width * 0.8}`);
        svg.setAttribute('height', `${dimensions.height * 0.8}`);
        // Remove hardcoded fill and opacity - let CSS handle styling
        svg.removeAttribute('fill');
      }

      el.appendChild(iconWrapper);
    }

    return el;
  }

  getWidgetAriaLabel(widget: WidgetDisplayItem): string {
    // Using $localize for the template pattern
    return $localize`:@@ngx.dashboard.widget.list.item.ariaLabel:${widget.name} widget: ${widget.description}`;
  }
}
