import { Injectable, signal } from '@angular/core';

/**
 * Menu item for empty cell context menu.
 * Can be either a regular menu item with an action or a divider.
 */
export type EmptyCellContextMenuItem =
  | {
      label: string;
      icon?: string; // Material icon name (e.g., 'widgets', 'add')
      svgIcon?: string; // SVG icon HTML string
      action: () => void;
      disabled?: boolean;
      widgetTypeId?: string; // Widget type identifier for tracking selection
      divider?: false;
    }
  | {
      divider: true;
      label?: never;
      icon?: never;
      svgIcon?: never;
      action?: never;
      disabled?: never;
      widgetTypeId?: never;
    };

/**
 * Service for managing empty cell context menu state.
 * Similar to CellContextMenuService but specifically for empty cells.
 *
 * This service is internal to the library and manages the display state
 * of the context menu that appears when right-clicking on empty dashboard cells.
 */
@Injectable({
  providedIn: 'root',
})
export class EmptyCellContextMenuService {
  #activeMenu = signal<{
    x: number;
    y: number;
    items: EmptyCellContextMenuItem[];
  } | null>(null);

  #lastSelectedWidgetTypeId = signal<string | null>(null);

  activeMenu = this.#activeMenu.asReadonly();
  lastSelectedWidgetTypeId = this.#lastSelectedWidgetTypeId.asReadonly();

  /**
   * Show the context menu at specific coordinates with given items.
   *
   * @param x - X coordinate (clientX from mouse event)
   * @param y - Y coordinate (clientY from mouse event)
   * @param items - Menu items to display
   */
  show(x: number, y: number, items: EmptyCellContextMenuItem[]): void {
    this.#activeMenu.set({ x, y, items });
  }

  /**
   * Hide the context menu.
   */
  hide(): void {
    this.#activeMenu.set(null);
  }

  /**
   * Set the last selected widget type ID for quick-repeat functionality.
   * Pass null to clear the last selection.
   *
   * @param widgetTypeId - The widget type identifier, or null to clear
   */
  setLastSelection(widgetTypeId: string | null): void {
    this.#lastSelectedWidgetTypeId.set(widgetTypeId);
  }
}
