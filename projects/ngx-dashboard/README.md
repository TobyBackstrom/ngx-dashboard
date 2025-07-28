# @dragonworks/ngx-dashboard

Core Angular library for building drag-and-drop grid dashboards with resizable cells and customizable widgets.

## Installation

```bash
npm install @dragonworks/ngx-dashboard
```

## Features

- Grid-based drag and drop with collision detection
- Resizable cells with boundary constraints
- Editor and viewer modes
- NgRx Signals state management
- Context menu with Material Design
- Extensible widget system
- 100% OnPush change detection

## Usage

```typescript
import { DashboardComponent, createEmptyDashboard } from "@dragonworks/ngx-dashboard";
import { provideNgxDashboard } from "@dragonworks/ngx-dashboard";

@Component({
  template: ` <ngx-dashboard [dashboardData]="dashboard" [editMode]="true" (dashboardChange)="onDashboardChange($event)"> </ngx-dashboard> `,
  imports: [DashboardComponent],
  providers: [provideNgxDashboard()],
})
export class MyComponent {
  dashboard = createEmptyDashboard("my-dashboard", 12, 8);
}
```

## Documentation

See the [main repository](https://github.com/TobyBackstrom/ngx-dashboard) for full documentation and examples.

## License

MIT
