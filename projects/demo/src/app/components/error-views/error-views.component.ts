import {
  ChangeDetectionStrategy,
  Component,
  Type,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import {
  DashboardComponent as NgxDashboardComponent,
  DashboardService,
  UNKNOWN_WIDGET_RESOLVER,
  UnknownWidgetResolver,
  Widget,
  WidgetMetadata,
} from '@dragonworks/ngx-dashboard';
import { ERROR_VIEWS_DASHBOARD } from './error-views.dashboard-data';
import { ModuleMissingWidgetComponent } from './module-missing-widget.component';
import { RestrictedWidgetComponent } from './restricted-widget.component';
import {
  REVENUE_BREAKDOWN_TYPEID,
  RevenueBreakdownWidgetComponent,
  RevenueForecastWidgetComponent,
  SITE_MAP_TYPEID,
  SiteMapWidgetComponent,
} from './demo-widgets';

type DemoWidgetClass = Type<Widget> & { metadata: WidgetMetadata };

@Component({
  selector: 'app-error-views',
  imports: [
    NgxDashboardComponent,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
  ],
  // Page-scoped: the resolver is read through the cell's injector, so this
  // dashboard has its own error views without changing anything for the rest
  // of the app.
  providers: [
    {
      provide: UNKNOWN_WIDGET_RESOLVER,
      useValue: ((context) => {
        switch (context.widgetTypeid) {
          case REVENUE_BREAKDOWN_TYPEID:
            return RestrictedWidgetComponent; // withheld from this session
          case SITE_MAP_TYPEID:
            return ModuleMissingWidgetComponent; // feature module not loaded
          default:
            return null; // null -> the library's default error view
        }
      }) as UnknownWidgetResolver,
    },
  ],
  templateUrl: './error-views.component.html',
  styleUrl: './error-views.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorViewsComponent {
  readonly #dashboardService = inject(DashboardService);
  private readonly dashboard = viewChild.required(NgxDashboardComponent);

  protected readonly dashboardData = ERROR_VIEWS_DASHBOARD;

  /** One per board cell: the widget type its button loads and unloads. */
  protected readonly widgets: DemoWidgetClass[] = [
    RevenueBreakdownWidgetComponent,
    SiteMapWidgetComponent,
    RevenueForecastWidgetComponent,
  ];

  /**
   * The registry is the state: a type is either registered - and its cell shows
   * the real widget - or missing, and the cell shows an error view. Nothing is
   * mirrored in a local flag, so returning to the page shows whichever side
   * each toggle was left on.
   */
  protected readonly registered = computed(
    () =>
      new Set(
        this.#dashboardService
          .widgetTypes()
          .map((type) => type.metadata.widgetTypeid)
      )
  );

  protected readonly exportedJson = signal<string | null>(null);

  protected isLoaded(widget: DemoWidgetClass): boolean {
    return this.registered().has(widget.metadata.widgetTypeid);
  }

  protected label(widget: DemoWidgetClass): string {
    const name = widget.metadata.name;

    return this.isLoaded(widget)
      ? $localize`:@@demo.errorViews.unload:Unload "${name}:WIDGET_NAME:"`
      : $localize`:@@demo.errorViews.load:Load "${name}:WIDGET_NAME:"`;
  }

  protected toggle(widget: DemoWidgetClass): void {
    // Both directions run through the registry and heal the cell in place:
    // registering late swaps the error view for the real widget, unregistering
    // puts the error view back - with the state the cell was loaded with.
    if (this.isLoaded(widget)) {
      this.#dashboardService.unregisterWidgetType(widget.metadata.widgetTypeid);
    } else {
      this.#dashboardService.registerWidgetType(widget);
    }

    // The exported JSON describes the board before the toggle.
    this.exportedJson.set(null);
  }

  protected exportDashboard(): void {
    this.exportedJson.set(
      JSON.stringify(this.dashboard().exportDashboard(), null, 2)
    );
  }
}
