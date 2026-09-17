// dashboard.service.ts
import {
  ComponentRef,
  Injectable,
  Type,
  ViewContainerRef,
  inject,
  signal,
} from '@angular/core';
import {
  createFactoryFromComponent,
  Widget,
  WidgetComponentClass,
  WidgetFactory,
  WidgetSharedStateProvider,
} from '../models';
import { UnknownWidgetComponent } from '../internal-widgets/unknown-widget/unknown-widget.component';
import {
  UnknownWidgetContext,
  resolveErrorView,
} from '../providers/unknown-widget';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  readonly #widgetTypes = signal<WidgetComponentClass[]>([]);
  readonly #widgetFactoryMap = new Map<string, WidgetFactory>();
  readonly #sharedStateProviders = new Map<string, WidgetSharedStateProvider>();
  readonly #pendingSharedStates = new Map<string, unknown>();
  readonly #unknownWidgetFactories = new Map<string, WidgetFactory>();
  readonly #warnedUnknownWidgetTypes = new Set<string>();
  readonly widgetTypes = this.#widgetTypes.asReadonly(); // make the widget list available as a readonly signal

  registerWidgetType<T = unknown>(
    widget: WidgetComponentClass,
    sharedStateProvider?: WidgetSharedStateProvider<T> | Type<WidgetSharedStateProvider<T>>
  ) {
    const widgetTypeid = widget.metadata.widgetTypeid;

    if (
      this.#widgetTypes().some(
        (w) => w.metadata.widgetTypeid === widgetTypeid
      )
    ) {
      throw new Error(
        `Widget type '${widgetTypeid}' is already registered`
      );
    }

    // Register widget factory
    this.#widgetFactoryMap.set(
      widgetTypeid,
      createFactoryFromComponent(widget)
    );

    // Register shared state provider if provided
    if (sharedStateProvider) {
      const provider = this.#resolveProvider(sharedStateProvider);
      this.#sharedStateProviders.set(widgetTypeid, provider);

      // Drain state buffered while the type had no provider: loaded before a
      // lazy module registered it, or kept when the type was unregistered.
      if (this.#pendingSharedStates.has(widgetTypeid)) {
        provider.setSharedState(this.#pendingSharedStates.get(widgetTypeid) as T);
        this.#pendingSharedStates.delete(widgetTypeid);
      }
    }

    this.#widgetTypes.set([...this.#widgetTypes(), widget]);
  }

  /**
   * Remove a widget type again, for a session that loses access to it: a
   * revoked role, a disabled feature flag, an unloaded feature module.
   *
   * Every cell of that type shows the error view again with its stored state
   * intact. The type's shared state moves to the pending buffer, so export
   * keeps writing it back and registering the type again restores it.
   *
   * @returns true if the type was registered
   */
  unregisterWidgetType(widgetTypeid: string): boolean {
    if (!this.#widgetFactoryMap.delete(widgetTypeid)) {
      return false;
    }

    const state = this.#sharedStateProviders.get(widgetTypeid)?.getSharedState();
    if (state !== undefined) {
      this.#pendingSharedStates.set(widgetTypeid, state);
    }
    this.#sharedStateProviders.delete(widgetTypeid);

    this.#widgetTypes.set(
      this.#widgetTypes().filter(
        (widget) => widget.metadata.widgetTypeid !== widgetTypeid
      )
    );

    return true;
  }

  #resolveProvider<T>(
    provider: WidgetSharedStateProvider<T> | Type<WidgetSharedStateProvider<T>>
  ): WidgetSharedStateProvider<T> {
    // If it's a class/service, inject it
    if (typeof provider === 'function') {
      return inject(provider as Type<WidgetSharedStateProvider<T>>);
    }
    return provider;
  }

  /**
   * The factory for a widget type, or a fallback that renders an error view
   * when the type is not registered.
   *
   * Returns the same object for a type until that type's registration changes.
   * Callers rely on it: the store's `cells` computed and `CellComponent` compare
   * factories by reference, and a new factory rebuilds the cell's widget.
   */
  getFactory(widgetTypeid: string): WidgetFactory {
    const factory = this.#widgetFactoryMap.get(widgetTypeid);

    if (factory) {
      return factory;
    }

    // Keeps the library's sentinel metadata, so export, the widget list and the
    // cell treat it as unresolved, while the rendered component comes from
    // UNKNOWN_WIDGET_RESOLVER. Cached per type for the identity guarantee above.
    let fallback = this.#unknownWidgetFactories.get(widgetTypeid);

    if (!fallback) {
      fallback = {
        ...UnknownWidgetComponent.metadata,
        createInstance: (container, state) =>
          this.#createUnknownWidget(container, {
            widgetTypeid,
            widgetState: state,
          }),
      };
      this.#unknownWidgetFactories.set(widgetTypeid, fallback);
    }

    return fallback;
  }

  /**
   * Render the error view for a cell the dashboard cannot resolve.
   *
   * The context is provided to the component instead of being pushed through
   * `dashboardSetState`, so the error view never has to implement the `Widget`
   * contract - and the cell's original widget state stays untouched for export.
   *
   * An app that withholds widget types on purpose - a permission model, a
   * feature flag - answers with its own error view, and that is not a fault to
   * report. Only a type nothing answered for is warned about, once.
   */
  #createUnknownWidget(
    container: ViewContainerRef,
    context: UnknownWidgetContext
  ): ComponentRef<Widget> {
    const view = resolveErrorView(container.injector, context);

    if (!view.answeredByApp) {
      this.#warnUnresolvedOnce(context.widgetTypeid);
    }

    return container.createComponent(view.component as Type<Widget>, {
      injector: view.injector,
    });
  }

  /** Once per type: an unresolved type recurs for every cell that uses it. */
  #warnUnresolvedOnce(widgetTypeid: string): void {
    if (this.#warnedUnknownWidgetTypes.has(widgetTypeid)) {
      return;
    }
    this.#warnedUnknownWidgetTypes.add(widgetTypeid);
    console.warn(
      `Unknown widget type: ${widgetTypeid}, using fallback error widget`
    );
  }

  /**
   * Get the shared state provider for a specific widget type.
   *
   * @param widgetTypeid The widget type identifier
   * @returns The shared state provider, or undefined if none is registered
   */
  getSharedStateProvider(widgetTypeid: string): WidgetSharedStateProvider | undefined {
    return this.#sharedStateProviders.get(widgetTypeid);
  }

  /**
   * Collect shared states for all widget types currently on the dashboard.
   * Called during dashboard export/serialization.
   *
   * A type with no provider contributes the state still buffered for it, so a
   * session that never registers a type - or unregistered it - does not drop
   * that type's shared state when it saves.
   *
   * @param activeWidgetTypes Set of widget type IDs that are currently in use
   * @returns Map of widget type IDs to their shared states
   */
  collectSharedStates(activeWidgetTypes: Set<string>): Map<string, unknown> {
    const sharedStates = new Map<string, unknown>();

    for (const widgetTypeid of activeWidgetTypes) {
      const provider = this.#sharedStateProviders.get(widgetTypeid);
      const state = provider
        ? provider.getSharedState()
        : this.#pendingSharedStates.get(widgetTypeid);
      if (state !== undefined) {
        sharedStates.set(widgetTypeid, state);
      }
    }

    return sharedStates;
  }

  /**
   * Restore shared states for widget types.
   * Called during dashboard import/deserialization, before widget instances are created.
   *
   * @param states Map of widget type IDs to their shared states
   */
  restoreSharedStates(states: Map<string, unknown>): void {
    for (const [widgetTypeid, state] of states) {
      const provider = this.#sharedStateProviders.get(widgetTypeid);
      if (provider) {
        provider.setSharedState(state);
        this.#pendingSharedStates.delete(widgetTypeid);
      } else {
        // Buffer for a widget type that hasn't been registered yet. Replaces
        // any prior buffered value so a second loadDashboard wins.
        this.#pendingSharedStates.set(widgetTypeid, state);
      }
    }
  }
}
