// widget.ts
import { Type } from '@angular/core';

export interface Widget {
  dashboardGetState?(): unknown;
  dashboardSetState?(state?: unknown): void;
  dashboardEditState?(): void;
  dashboardEditSharedState?(): void;
}

export interface WidgetMetadata {
  widgetTypeid: string; // application wide unique ID
  name: string; // to used in GUI
  description: string; // short description for tooltip / GUI
  svgIcon: string; // SVG markup as string
  /**
   * Optional group heading for the widget list. Widgets sharing a group are
   * rendered together under that heading, in the order the groups were first
   * encountered during registration. Widgets without a group are listed last,
   * without a heading — so omitting this field everywhere renders exactly the
   * flat list as before.
   *
   * The value is displayed verbatim, so callers should pass an already
   * localized string.
   */
  group?: string;
}

export interface WidgetComponentClass<
  T extends Widget = Widget
> extends Type<T> {
  metadata: WidgetMetadata;
}
