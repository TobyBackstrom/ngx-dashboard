/**
 * Keyboard modifier that gates drag-to-select.
 *
 * When set on `DashboardComponent.selectionModifier`, the selection overlay
 * is mounted but transparent to pointer events until the modifier is held
 * (or a drag started while the modifier was held is in progress).
 */
export type SelectionModifier = 'shift' | 'ctrl' | 'alt' | 'meta';
