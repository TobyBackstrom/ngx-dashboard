import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  provideEnvironmentInitializer,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  DashboardService,
  EMPTY_CELL_CONTEXT_PROVIDER,
  WidgetListContextMenuProvider,
} from '@dragonworks/ngx-dashboard';
import {
  ArrowWidgetComponent,
  LabelWidgetComponent,
  ClockWidgetComponent,
  RadialGaugeWidgetComponent,
} from '@dragonworks/ngx-dashboard-widgets';
import { SparklineWidgetComponent } from './widgets/sparkline-widget/sparkline-widget.component';
import { SparkbarWidgetComponent } from './widgets/sparkbar-widget/sparkbar-widget.component';
import { RealtimeGaugeWidgetComponent } from './widgets/realtime-gauge-widget/realtime-gauge-widget.component';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    // Enable context menu on empty cells to show available widgets
    {
      provide: EMPTY_CELL_CONTEXT_PROVIDER,
      useClass: WidgetListContextMenuProvider,
    },
    provideEnvironmentInitializer(() => {
      const dashboardService = inject(DashboardService);
      dashboardService.registerWidgetType(ArrowWidgetComponent);
      dashboardService.registerWidgetType(LabelWidgetComponent);
      dashboardService.registerWidgetType(ClockWidgetComponent);
      dashboardService.registerWidgetType(RadialGaugeWidgetComponent);
      dashboardService.registerWidgetType(RealtimeGaugeWidgetComponent);
      dashboardService.registerWidgetType(SparklineWidgetComponent);
      dashboardService.registerWidgetType(SparkbarWidgetComponent);
    }),
  ],
};
