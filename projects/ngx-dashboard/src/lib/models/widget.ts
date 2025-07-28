// widget.ts
import { Type } from '@angular/core';

export interface Widget {
  dashboardGetState?(): unknown;
  dashboardSetState?(state?: unknown): void;
  dashboardEditState?(): void;
}

export interface WidgetMetadata {
  widgetTypeid: string; // application wide unique ID
  name: string; // to used in GUI
  description: string; // short description for tooltip / GUI
  svgIcon: string; // SVG markup as string
}

export interface WidgetComponentClass<
  T extends Widget = Widget
> extends Type<T> {
  metadata: WidgetMetadata;
}
