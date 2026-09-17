import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';

export const REVENUE_BREAKDOWN_TYPEID = '@demo/revenue-breakdown';
export const SITE_MAP_TYPEID = '@demo/site-map';
export const REVENUE_FORECAST_TYPEID = '@demo/revenue-forecast';

const barChartIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960" fill="currentColor"><path d="M640-160v-280h160v280H640Zm-240 0v-640h160v640H400Zm-240 0v-440h160v440H160Z"/></svg>';

/**
 * The widgets behind the three error views on this page. None of them is
 * registered in `app.config.ts`: the page registers and unregisters them as the
 * demo is toggled, the way an app that withholds widget types from a session
 * would.
 *
 * They are deliberately plain - what the page demonstrates is what a cell shows
 * when its widget type is *missing*.
 */

export interface RevenueChannel {
  label: string;
  amount: number;
}

export interface RevenueBreakdownWidgetState {
  currency: string;
  channels: RevenueChannel[];
}

@Component({
  selector: 'app-revenue-breakdown-widget',
  template: `
    <div class="panel revenue">
      <div class="channels">
        @for (channel of channels(); track channel.label) {
        <div class="channel">
          <span class="label">{{ channel.label }}</span>
          <span class="bar-track">
            <span class="bar" [style.width.%]="channel.share"></span>
          </span>
          <span class="amount">{{ channel.formatted }}</span>
        </div>
        }
      </div>
      <div class="total">
        <span class="label" i18n="@@demo.errorViews.revenueTotal">Total</span>
        <span class="amount">{{ total() }}</span>
      </div>
    </div>
  `,
  styleUrl: './demo-widgets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueBreakdownWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: REVENUE_BREAKDOWN_TYPEID,
    name: $localize`:@@demo.errorViews.revenueWidgetName:Revenue Breakdown`,
    description: $localize`:@@demo.errorViews.revenueWidgetDescription:Revenue per sales channel`,
    svgIcon: barChartIcon,
    group: $localize`:@@demo.errorViews.revenueWidgetGroup:Finance`,
  };

  readonly state = signal<RevenueBreakdownWidgetState>({
    currency: 'EUR',
    channels: [],
  });

  readonly #currency = computed(() => this.state().currency);

  readonly #formatter = computed(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: this.#currency(),
        maximumFractionDigits: 0,
      })
  );

  protected readonly channels = computed(() => {
    const channels = this.state().channels;
    const largest = Math.max(1, ...channels.map((c) => Math.abs(c.amount)));

    return channels.map((channel) => ({
      label: channel.label,
      share: (Math.abs(channel.amount) / largest) * 100,
      formatted: this.#formatter().format(channel.amount),
    }));
  });

  protected readonly total = computed(() =>
    this.#formatter().format(
      this.state().channels.reduce((sum, channel) => sum + channel.amount, 0)
    )
  );

  dashboardSetState(state?: unknown): void {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as RevenueBreakdownWidgetState),
      }));
    }
  }

  dashboardGetState(): RevenueBreakdownWidgetState {
    return this.state();
  }
}

export interface SiteMapWidgetState {
  zones: { label: string; size: number }[];
}

@Component({
  selector: 'app-site-map-widget',
  template: `
    <div class="panel site-map">
      @for (zone of state().zones; track zone.label) {
      <span class="zone" [style.flex]="zone.size">{{ zone.label }}</span>
      }
    </div>
  `,
  styleUrl: './demo-widgets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteMapWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: SITE_MAP_TYPEID,
    name: $localize`:@@demo.errorViews.siteMapWidgetName:Site Map`,
    description: $localize`:@@demo.errorViews.siteMapWidgetDescription:Store floor zones`,
    svgIcon: barChartIcon,
  };

  readonly state = signal<SiteMapWidgetState>({ zones: [] });

  dashboardSetState(state?: unknown): void {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as SiteMapWidgetState),
      }));
    }
  }

  dashboardGetState(): SiteMapWidgetState {
    return this.state();
  }
}

export interface RevenueForecastWidgetState {
  points: number[];
}

@Component({
  selector: 'app-revenue-forecast-widget',
  template: `
    <div class="panel forecast">
      @for (point of state().points; track $index) {
      <span class="bar" [style.height.%]="point"></span>
      }
    </div>
  `,
  styleUrl: './demo-widgets.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueForecastWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: REVENUE_FORECAST_TYPEID,
    name: $localize`:@@demo.errorViews.forecastWidgetName:Revenue Forecast`,
    description: $localize`:@@demo.errorViews.forecastWidgetDescription:Projected revenue per week`,
    svgIcon: barChartIcon,
    group: $localize`:@@demo.errorViews.revenueWidgetGroup:Finance`,
  };

  readonly state = signal<RevenueForecastWidgetState>({ points: [] });

  dashboardSetState(state?: unknown): void {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as RevenueForecastWidgetState),
      }));
    }
  }

  dashboardGetState(): RevenueForecastWidgetState {
    return this.state();
  }
}
