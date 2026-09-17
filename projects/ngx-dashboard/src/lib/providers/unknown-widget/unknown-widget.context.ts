import { InjectionToken } from '@angular/core';

/**
 * Everything the library knows about a cell it could not render, handed to the
 * {@link UnknownWidgetResolver} and provided to the resolved component so it
 * can be injected:
 *
 * @example
 * ```typescript
 * @Component({ ... })
 * export class NoPermissionWidgetComponent {
 *   readonly context = inject(UNKNOWN_WIDGET_CONTEXT);
 * }
 * ```
 */
export interface UnknownWidgetContext {
  /**
   * Why the real widget is not being rendered. Currently always
   * `'unregistered'`: no widget type is registered for the type id the
   * dashboard data asked for.
   */
  reason: 'unregistered';
  /** The widget type id the dashboard data asked for. */
  widgetTypeid: string;
  /**
   * The persisted state of the original widget, untouched. The error view must
   * treat it as read-only: it is written back on export as-is, so a cell whose
   * widget type is missing survives a load/save round trip.
   */
  widgetState: unknown;
}

/**
 * Injection token carrying the {@link UnknownWidgetContext} into the component
 * chosen by the {@link UnknownWidgetResolver}.
 */
export const UNKNOWN_WIDGET_CONTEXT = new InjectionToken<UnknownWidgetContext>(
  'UnknownWidgetContext'
);
