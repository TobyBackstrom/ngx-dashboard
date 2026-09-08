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
import { NgTemplateOutlet } from '@angular/common';
import { DragData, WidgetMetadata } from '../models';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DashboardService } from '../services/dashboard.service';
import { DashboardBridgeService } from '../services/dashboard-bridge.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/** Distinguishes the DOM ids of several widget lists mounted at once. */
let nextWidgetListId = 0;

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
  /**
   * Derived display state, memoized with the group rather than recomputed per
   * change-detection pass from the template.
   */
  expanded: boolean;
  /** Target of the heading button's `aria-controls`. */
  sectionId: string;
  /** The heading button's own id, for the region's `aria-labelledby`. */
  headingId: string;
}

@Component({
  selector: 'ngx-dashboard-widget-list',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MatTooltipModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
  ],
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
  enableSearchBox = input<boolean>(false);

  /**
   * Labels of the groups the user has collapsed. Groups start expanded, and the
   * state is per component instance (not persisted) — the list is a transient
   * editing surface.
   */
  readonly #collapsedGroups = signal<ReadonlySet<string>>(new Set<string>());

  readonly #idPrefix = `ngx-dashboard-widget-group-${nextWidgetListId++}`;

  activeWidget = signal<string | null>(null);

  /**
   * Free-text filter over the list. Empty (or whitespace only) means no
   * filtering. Kept per component instance, like the collapsed group state.
   */
  readonly searchTerm = signal('');

  readonly #normalizedSearchTerm = computed(() =>
    this.enableSearchBox() ? this.searchTerm().trim().toLowerCase() : ''
  );

  /** Whether a filter is currently narrowing the list. */
  readonly isFiltering = computed(
    () => this.#normalizedSearchTerm().length > 0
  );

  /** Whether the search box is rendered: the icon-only rail has no room. */
  readonly showSearchBox = computed(
    () => this.enableSearchBox() && !this.collapsed()
  );

  // Get grid cell dimensions from bridge service (uses first available dashboard)
  gridCellDimensions = this.#bridge.availableDimensions;

  readonly #allWidgets = computed(() =>
    this.#service.widgetTypes().map((w) => ({
      ...w.metadata,
      safeSvgIcon: this.#sanitizer.bypassSecurityTrustHtml(w.metadata.svgIcon),
    }))
  );

  /**
   * The widgets the list renders: every registered widget, or those matching
   * `searchTerm`. A widget matches when the term is contained in its name,
   * description or widget type id — the type id so a user who knows what they
   * registered can search by it directly. Matching is case insensitive.
   */
  widgets = computed(() => {
    const term = this.#normalizedSearchTerm();
    if (!term) return this.#allWidgets();

    return this.#allWidgets().filter((widget) =>
      [widget.name, widget.description, widget.widgetTypeid].some((field) =>
        field?.toLowerCase().includes(term)
      )
    );
  });

  /**
   * Widgets bucketed by `WidgetMetadata.group`. Groups keep the order in which
   * they were first seen in the registration order, widgets keep their
   * registration order within a group, and ungrouped widgets trail the labelled
   * groups in a single unlabelled section. With no widget declaring a group the
   * result is one unlabelled section, i.e. a flat list with no heading.
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
        group = {
          label,
          widgets: [],
          expanded: this.isGroupExpanded(label),
          sectionId: `${this.#idPrefix}-${labelled.length}`,
          headingId: `${this.#idPrefix}-${labelled.length}-heading`,
        };
        byLabel.set(label, group);
        labelled.push(group);
      }
      group.widgets.push(widget);
    }

    return ungrouped.length > 0
      ? [
          ...labelled,
          {
            widgets: ungrouped,
            expanded: true,
            sectionId: `${this.#idPrefix}-ungrouped`,
            headingId: `${this.#idPrefix}-ungrouped-heading`,
          },
        ]
      : labelled;
  });

  /**
   * Whether a group's widgets are shown. Ungrouped widgets have no heading to
   * toggle, so they are always shown.
   */
  isGroupExpanded(label?: string): boolean {
    // While filtering, a collapsed group would hide its own matches.
    if (this.isFiltering()) return true;
    return !label || !this.#collapsedGroups().has(label);
  }

  /** Toggles a group open/closed. No-op for the unlabelled group. */
  toggleGroup(label?: string): void {
    if (!label) return;
    // Read the user's own collapsed set rather than `isGroupExpanded()`, which
    // reports every group as expanded while a filter is active -- inverting
    // that would make this a one-way "collapse" for the whole filter.
    this.setGroupExpanded(label, this.#collapsedGroups().has(label));
  }

  /**
   * Records a group's expanded state. Idempotent, so it is safe to drive from
   * the expansion panel's `opened`/`closed` outputs.
   */
  setGroupExpanded(label: string | undefined, expanded: boolean): void {
    if (!label) return;

    this.#collapsedGroups.update((collapsed) => {
      if (collapsed.has(label) === !expanded) return collapsed;

      const next = new Set(collapsed);
      if (expanded) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  /** Clears the filter, restoring the full list. */
  clearSearch(): void {
    this.searchTerm.set('');
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
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
