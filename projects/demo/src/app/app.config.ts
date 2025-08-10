import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideEnvironmentInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from '@dragonworks/ngx-dashboard';
import { ArrowWidgetComponent, LabelWidgetComponent, ClockWidgetComponent } from '@dragonworks/ngx-dashboard-widgets';
import { SparklineWidgetComponent } from './widgets/sparkline-widget/sparkline-widget.component';
import { SparkbarWidgetComponent } from './widgets/sparkbar-widget/sparkbar-widget.component';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideEnvironmentInitializer(() => {
      const dashboardService = inject(DashboardService);
      dashboardService.registerWidgetType(ArrowWidgetComponent);
      dashboardService.registerWidgetType(LabelWidgetComponent);
      dashboardService.registerWidgetType(ClockWidgetComponent);
      dashboardService.registerWidgetType(SparklineWidgetComponent);
      dashboardService.registerWidgetType(SparkbarWidgetComponent);
    })
  ]
};
