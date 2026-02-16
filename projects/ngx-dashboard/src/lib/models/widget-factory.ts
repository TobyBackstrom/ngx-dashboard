// widget-factory.ts
import { ComponentRef, ViewContainerRef } from '@angular/core';
import {
  Widget,
  WidgetComponentClass,
} from './widget';

/** Sentinel widget type ID for unresolved/unknown widget types */
export const UNKNOWN_WIDGET_TYPEID = '__internal/unknown-widget';

export interface WidgetFactory<
  T extends Widget = Widget
> {
  widgetTypeid: string; // application wide unique ID
  name: string;
  description: string;
  svgIcon: string; // SVG markup as string
  createInstance(container: ViewContainerRef, state?: unknown): ComponentRef<T>;
}

export function createFactoryFromComponent<T extends Widget>(
  component: WidgetComponentClass<T>
): WidgetFactory {
  return {
    ...component.metadata,

    createInstance(
      container: ViewContainerRef,
      state?: unknown
    ): ComponentRef<T> {
      const ref = container.createComponent(component);
      ref.instance.dashboardSetState?.(state);
      return ref;
    },
  };
}
