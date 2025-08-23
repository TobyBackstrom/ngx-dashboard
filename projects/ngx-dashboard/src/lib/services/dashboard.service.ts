// dashboard.service.ts
import { Injectable, signal } from '@angular/core';
import {
  createFactoryFromComponent,
  WidgetComponentClass,
  WidgetFactory,
} from '../models';
import { UnknownWidgetComponent } from '../internal-widgets/unknown-widget/unknown-widget.component';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  readonly #widgetTypes = signal<WidgetComponentClass[]>([]);
  readonly #widgetFactoryMap = new Map<string, WidgetFactory>();
  readonly #unknownWidgetFactory = createFactoryFromComponent(UnknownWidgetComponent);
  readonly widgetTypes = this.#widgetTypes.asReadonly(); // make the widget list available as a readonly signal

  registerWidgetType(widget: WidgetComponentClass) {
    if (
      this.#widgetTypes().some(
        (w) => w.metadata.widgetTypeid === widget.metadata.widgetTypeid
      )
    ) {
      throw new Error(
        `Widget type '${widget.metadata.widgetTypeid}' is already registered`
      );
    }

    this.#widgetFactoryMap.set(
      widget.metadata.widgetTypeid,
      createFactoryFromComponent(widget)
    );

    this.#widgetTypes.set([...this.#widgetTypes(), widget]);
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
}
