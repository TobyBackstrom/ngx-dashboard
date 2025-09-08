# @dragonworks/ngx-dashboard-widgets

Example widget collection for ngx-dashboard with Material Design 3 compliance and advanced features.
You can use these widgets as inspiration or as a base for your own implementations.

## Installation

```bash
npm install @dragonworks/ngx-dashboard-widgets @dragonworks/ngx-dashboard
```

## Requirements

- Angular 20.2.0+
- @dragonworks/ngx-dashboard 20.0.0+

## Included Example Widgets

### ArrowWidget

- **Directional indicators** with 360° rotation control
- **Configurable appearance**: Size, color, rotation angle
- **Material Design icons** with currentColor theme support
- **Settings dialog** for interactive configuration

### LabelWidget

- **Text display** with rich formatting options
- **Responsive sizing** with alignment controls
- **Background customization** with theme-aware colors
- **Font size controls** with min/max constraints

### ClockWidget

- **Dual-mode display**: Analog and digital formats
- **Real-time updates** with automatic timer management
- **Configurable formats**: 12h/24h time, seconds display
- **Component composition**: Separate analog/digital components

### RadialGaugeWidget

- **Semi-circular gauge** for value visualization
- **Responsive text rendering**: SVG-native with BBox scaling
- **Theme integration** with MD3 color tokens
- **Performance optimized** with signal-based updates

## Components & Utilities

### RadialGaugeComponent

Standalone SVG gauge component:

- **Dynamic sizing** with ResizeObserver integration
- **Mathematical positioning** using computed transforms
- **Reference text system** for consistent measurements
- **Configurable display**: Value labels, legends, colors
- **Accessibility features** with ARIA attributes

### ResponsiveTextDirective

Text sizing directive:

- **Automatic font scaling** to fit container
- **Performance optimized** with canvas measurement
- **Developer-friendly API**: minFontSize/maxFontSize inputs
- **Ellipsis-free design** for clean appearance

## Usage

### Basic Widget Registration

```typescript
// app.config.ts - Register widgets on startup
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
      dashboardService.registerWidgetType(RadialGaugeWidgetComponent);
      dashboardService.registerWidgetType(RealtimeGaugeWidgetComponent);
      dashboardService.registerWidgetType(SparklineWidgetComponent);
      dashboardService.registerWidgetType(SparkbarWidgetComponent);
    }),
  ],
};
```

### Using RadialGaugeComponent Standalone

```typescript
import { Component } from "@angular/core";
import { RadialGaugeComponent } from "@dragonworks/ngx-dashboard-widgets";

@Component({
  selector: "app-metrics",
  standalone: true,
  imports: [RadialGaugeComponent],
  template: ` <ngx-dashboard-radial-gauge [value]="cpuUsage" [minValue]="0" [maxValue]="100" [label]="'CPU Usage'" [unit]="'%'" [showValueLabel]="true"> </ngx-dashboard-radial-gauge> `,
})
export class MetricsComponent {
  cpuUsage = 75;
}
```

### Using ResponsiveText Directive

```typescript
import { Component } from "@angular/core";
import { ResponsiveTextDirective } from "@dragonworks/ngx-dashboard-widgets";

@Component({
  selector: "app-display",
  standalone: true,
  imports: [ResponsiveTextDirective],
  template: `
    <div class="container">
      <span ngxDashboardResponsiveText [minFontSize]="12" [maxFontSize]="48"> Responsive Text </span>
    </div>
  `,
})
export class DisplayComponent {}
```

## Creating Custom Widgets

```typescript
import { Component, signal } from "@angular/core";
import { Widget, WidgetMetadata } from "@dragonworks/ngx-dashboard";

interface MyWidgetState {
  text: string;
  color: string;
}

@Component({
  selector: "my-custom-widget",
  standalone: true,
  template: `
    <div [style.color]="state().color">
      {{ state().text }}
    </div>
  `,
  styleUrl: "./my-custom-widget.component.scss",
})
export class MyCustomWidgetComponent implements Widget {
  static readonly metadata: WidgetMetadata = {
    widgetTypeid: "@myapp/my-custom-widget",
    name: "My Custom Widget",
    description: "A custom widget example",
    svgIcon: "<svg>...</svg>", // Your SVG icon
  };

  state = signal<MyWidgetState>({
    text: "Hello World",
    color: "var(--mat-sys-primary)",
  });

  // Optional: Implement widget state methods
  dashboardGetState(): MyWidgetState {
    return this.state();
  }

  dashboardSetState(state?: unknown): void {
    if (state) {
      this.state.set(state as MyWidgetState);
    }
  }

  dashboardEditState(): void {
    // Open settings dialog
  }
}
```

## Design Patterns

- **Settings Dialogs**: Each widget includes MD3-compliant configuration dialogs
- **Responsive Sizing**: All widgets adapt to container dimensions
- **State Management**: Signal-based state with lifecycle handling
- **SVG Rendering**: Vector graphics with currentColor support

## Documentation

See the [main repository](https://github.com/TobyBackstrom/ngx-dashboard) for complete documentation, examples, and demo application.

## License

MIT
