import { Injectable, inject } from '@angular/core';
import { EmptyCellContextProvider } from './empty-cell-context.provider';
import type { EmptyCellContext } from './empty-cell-context.provider';
import { EmptyCellContextMenuService } from '../../services/empty-cell-context-menu.service';
import type { EmptyCellContextMenuItem } from '../../services/empty-cell-context-menu.service';
import { DashboardService } from '../../services/dashboard.service';
import type { WidgetComponentClass } from '../../models/widget';

/**
 * Context provider that displays a widget list menu when right-clicking on empty cells.
 *
 * This provider shows a Material Design context menu with all available widget types.
 * When a user clicks on a widget in the menu, it's immediately added to the empty cell.
 *
 * @example
 * ```typescript
 * // In your component or app config
 * providers: [
 *   {
 *     provide: EMPTY_CELL_CONTEXT_PROVIDER,
 *     useClass: WidgetListContextMenuProvider
 *   }
 * ]
 * ```
 *
 * @public
 */
@Injectable()
export class WidgetListContextMenuProvider extends EmptyCellContextProvider {
  readonly #menuService = inject(EmptyCellContextMenuService);
  readonly #dashboardService = inject(DashboardService);

  /**
   * Handle empty cell context menu by showing available widgets.
   *
   * @param event - The mouse event from the right-click
   * @param context - Information about the empty cell and dashboard
   */
  handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
    event.preventDefault();

    // Get available widgets from dashboard service
    const widgets = this.#dashboardService.widgetTypes();

    // Create menu items from widgets
    const items = this.#createMenuItems(widgets, context);

    // Show the context menu at mouse coordinates
    this.#menuService.show(event.clientX, event.clientY, items);
  }

  /**
   * Create menu items from available widget types.
   * Each item includes the widget's icon and display name.
   * If a widget was previously selected, it appears first as a quick-repeat option.
   *
   * @param widgets - Array of widget component classes
   * @param context - The empty cell context with createWidget callback
   * @returns Array of menu items ready for display
   */
  #createMenuItems(
    widgets: readonly WidgetComponentClass[],
    context: EmptyCellContext
  ): EmptyCellContextMenuItem[] {
    if (widgets.length === 0) {
      // Show a message if no widgets are registered
      return [
        {
          label: $localize`:@@ngx.dashboard.emptyCellMenu.noWidgets:No widgets available`,
          disabled: true,
          action: () => {
            // No action needed
          },
        },
      ];
    }

    // Build standard menu items with widgetTypeId
    const allItems: EmptyCellContextMenuItem[] = widgets.map(
      (widget: WidgetComponentClass) => ({
        label: widget.metadata.name,
        svgIcon: widget.metadata.svgIcon,
        widgetTypeId: widget.metadata.widgetTypeid,
        action: () => this.#createWidget(widget.metadata.widgetTypeid, context),
      })
    );

    // Check if there's a last selected widget to show as quick-repeat
    const lastSelectedTypeId = this.#menuService.lastSelectedWidgetTypeId();
    if (!lastSelectedTypeId) {
      return allItems;
    }

    // Find the last selected widget in the list
    const lastSelectedWidget = widgets.find(
      (w) => w.metadata.widgetTypeid === lastSelectedTypeId
    );

    if (!lastSelectedWidget) {
      // Last selected widget no longer available, return normal list
      return allItems;
    }

    // Create quick-repeat item (duplicate of the last selected widget)
    const quickRepeatItem: EmptyCellContextMenuItem = {
      label: lastSelectedWidget.metadata.name,
      svgIcon: lastSelectedWidget.metadata.svgIcon,
      widgetTypeId: lastSelectedWidget.metadata.widgetTypeid,
      action: () =>
        this.#createWidget(lastSelectedWidget.metadata.widgetTypeid, context),
    };

    // Create divider
    const divider: EmptyCellContextMenuItem = { divider: true };

    // Return special structure: [quick-repeat, divider, full list]
    return [quickRepeatItem, divider, ...allItems];
  }

  /**
   * Create a widget at the empty cell position.
   * Uses the createWidget callback provided in the context.
   *
   * @param widgetTypeid - The widget type identifier to create
   * @param context - The empty cell context with createWidget callback
   */
  #createWidget(widgetTypeid: string, context: EmptyCellContext): void {
    if (context.createWidget) {
      const success = context.createWidget(widgetTypeid);
      if (!success) {
        console.error(
          `Failed to create widget '${widgetTypeid}' at (${context.row}, ${context.col})`
        );
      }
    } else {
      console.warn(
        'createWidget callback not available in EmptyCellContext. ' +
          'Ensure you are using a compatible version of the dashboard component.'
      );
    }
  }
}
