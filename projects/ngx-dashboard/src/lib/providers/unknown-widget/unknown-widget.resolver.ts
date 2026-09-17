import {
  InjectionToken,
  Injector,
  Type,
  runInInjectionContext,
  untracked,
} from '@angular/core';
import { UnknownWidgetComponent } from '../../internal-widgets/unknown-widget/unknown-widget.component';
import {
  UNKNOWN_WIDGET_CONTEXT,
  UnknownWidgetContext,
} from './unknown-widget.context';

/**
 * Picks the component that stands in for a widget the dashboard cannot render.
 *
 * Return `null` or `undefined` to fall back to the library's default error
 * view. The resolver runs in an injection context, so `inject()` may be called
 * inside it as well as in the factory that creates it.
 *
 * The returned component needs no widget metadata and no `Widget` interface —
 * it is a plain component. It receives the {@link UnknownWidgetContext} through
 * `UNKNOWN_WIDGET_CONTEXT`. `Widget` methods it happens to define are ignored:
 * the cell exports its stored state and offers no edit actions.
 */
export type UnknownWidgetResolver = (
  context: UnknownWidgetContext
) => Type<unknown> | null | undefined;

/**
 * Injection token for the resolver that picks the error view for a cell whose
 * widget type is not registered — a widget behind a permission gate, a widget
 * from a feature module that never loaded, or data written by a newer version
 * of the app.
 *
 * Defaults to a resolver that answers `null`, i.e. the library's own error
 * view. That default is also what makes an unresolved type worth a console
 * warning: a type an app deliberately withholds is answered for here, so it is
 * not reported as a fault.
 *
 * @example A single custom error view
 * ```typescript
 * providers: [
 *   { provide: UNKNOWN_WIDGET_RESOLVER, useValue: () => NoPermissionWidgetComponent }
 * ]
 * ```
 *
 * @example Branching on the widget type, with injected dependencies
 * ```typescript
 * providers: [
 *   {
 *     provide: UNKNOWN_WIDGET_RESOLVER,
 *     useFactory: (): UnknownWidgetResolver => {
 *       const permissions = inject(PermissionService);
 *       return (context) =>
 *         permissions.isGated(context.widgetTypeid)
 *           ? NoPermissionWidgetComponent
 *           : null; // null -> the library's default error view
 *     },
 *   },
 * ]
 * ```
 */
export const UNKNOWN_WIDGET_RESOLVER =
  new InjectionToken<UnknownWidgetResolver>('UnknownWidgetResolver', {
    providedIn: 'root',
    factory: () => () => null,
  });

/** What to render for a cell the dashboard cannot show, and who decided it. */
export interface ResolvedErrorView {
  component: Type<unknown>;
  /** Child injector carrying the context to the component. */
  injector: Injector;
  /** False when the resolver declined (or threw) and the default view is used. */
  answeredByApp: boolean;
}

/**
 * Picks the error view for a cell, and builds the injector that carries the
 * context to it.
 *
 * The resolver is read from the caller's injector so a single page or dashboard
 * can provide its own error views, and is called untracked: it picks a
 * component once, and a signal it happens to read must not make the caller
 * (the cell's creation `effect`) depend on it.
 */
export function resolveErrorView(
  injector: Injector,
  context: UnknownWidgetContext
): ResolvedErrorView {
  let component: Type<unknown> | null | undefined;

  try {
    const resolver = injector.get(UNKNOWN_WIDGET_RESOLVER);
    component = untracked(() =>
      runInInjectionContext(injector, () => resolver(context))
    );
  } catch (error) {
    console.error(
      'UNKNOWN_WIDGET_RESOLVER threw, using the default error widget',
      error
    );
  }

  return {
    component: component ?? UnknownWidgetComponent,
    injector: Injector.create({
      parent: injector,
      providers: [{ provide: UNKNOWN_WIDGET_CONTEXT, useValue: context }],
    }),
    answeredByApp: !!component,
  };
}
