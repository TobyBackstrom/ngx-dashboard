# @dragonworks/ngx-dashboard-widgets

Widget collection for ngx-dashboard with Material Design 3 compliance.

## Installation

```bash
npm install @dragonworks/ngx-dashboard-widgets @dragonworks/ngx-dashboard
```

## Included Widgets

- **Arrow Widget** - Directional indicators with rotation
- **Label Widget** - Text display with responsive sizing
- **Clock Widget** - Analog/digital clock with real-time updates
- **ResponsiveText Directive** - Canvas-optimized text sizing

## Usage

```typescript
import { DashboardService } from "@dragonworks/ngx-dashboard";
import { ArrowWidgetComponent } from "@dragonworks/ngx-dashboard-widgets";

export class AppComponent {
  constructor(dashboardService: DashboardService) {
    // Register widgets
    dashboardService.registerWidgetType(ArrowWidgetComponent);
  }
}
```

## Creating Custom Widgets

```typescript
@Component({
  selector: "my-widget",
  template: `<div>{{ state?.text }}</div>`,
  standalone: true,
})
export class MyWidgetComponent {
  state = signal<any>({});

  static readonly metadata = {
    widgetTypeId: "my-widget",
    displayName: "My Widget",
    iconName: "star",
    description: "Custom widget example",
  };
}
```

## Documentation

See the [main repository](https://github.com/TobyBackstrom/ngx-dashboard) for full documentation.

## License

MIT
