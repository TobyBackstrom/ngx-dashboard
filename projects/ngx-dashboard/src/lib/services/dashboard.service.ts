// dashboard.service.ts
import { Injectable, signal, inject, Type } from '@angular/core';
import {
  createFactoryFromComponent,
  WidgetComponentClass,
  WidgetFactory,
  WidgetSharedStateProvider,
} from '../models';
import { UnknownWidgetComponent } from '../internal-widgets/unknown-widget/unknown-widget.component';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  readonly #widgetTypes = signal<WidgetComponentClass[]>([]);
  readonly #widgetFactoryMap = new Map<string, WidgetFactory>();
  readonly #sharedStateProviders = new Map<string, WidgetSharedStateProvider>();
  readonly #unknownWidgetFactory = createFactoryFromComponent(UnknownWidgetComponent);
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
    }

    this.#widgetTypes.set([...this.#widgetTypes(), widget]);
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

  getFactory(widgetTypeid: string): WidgetFactory {
    const factory = this.#widgetFactoryMap.get(widgetTypeid);

    if (factory) {
      return factory;
    }

    // Return fallback factory for unknown widget types
    console.warn(
      `Unknown widget type: ${widgetTypeid}, using fallback error widget`
    );

    // Create a custom factory that preserves the original widget type ID in state
    return {
      ...this.#unknownWidgetFactory,
      createInstance: (container, state) => {
        const ref = this.#unknownWidgetFactory.createInstance(container, {
          originalWidgetTypeid: widgetTypeid,
          ...(state && typeof state === 'object' ? state as Record<string, unknown> : {}),
        });
        return ref;
      },
    };
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
   * @param activeWidgetTypes Set of widget type IDs that are currently in use
   * @returns Map of widget type IDs to their shared states
   */
  collectSharedStates(activeWidgetTypes: Set<string>): Map<string, unknown> {
    const sharedStates = new Map<string, unknown>();

    for (const widgetTypeid of activeWidgetTypes) {
      const provider = this.#sharedStateProviders.get(widgetTypeid);
      if (provider) {
        const state = provider.getSharedState();
        if (state !== undefined) {
          sharedStates.set(widgetTypeid, state);
        }
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
      }
    }
  }
}
