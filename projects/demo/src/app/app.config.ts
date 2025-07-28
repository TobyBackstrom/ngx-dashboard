import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, provideEnvironmentInitializer, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { DashboardService } from '@dragonworks/ngx-dashboard';
import { ArrowWidgetComponent, LabelWidgetComponent, ClockWidgetComponent } from '@dragonworks/ngx-dashboard-widgets';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideEnvironmentInitializer(() => {
      const dashboardService = inject(DashboardService);
      dashboardService.registerWidgetType(ArrowWidgetComponent);
      dashboardService.registerWidgetType(LabelWidgetComponent);
      dashboardService.registerWidgetType(ClockWidgetComponent);
    })
  ]
};
