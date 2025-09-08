# @dragonworks/ngx-dashboard

Core Angular library for building drag-and-drop grid dashboards with resizable cells and customizable widgets.

## Installation

```bash
npm install @dragonworks/ngx-dashboard
```

## Features

- **Grid-based Drag & Drop**: Collision detection and boundary constraints
- **Resizable Cells**: Dynamic resizing with minimum size constraints
- **Dual-Mode Display**: Editor mode for configuration, viewer mode for presentation
- **NgRx Signals State Management**: Reactive state with normalized widget storage
- **Material Design 3 Integration**: Full MD3 compliance with theme tokens
- **Context Menu System**: Right-click operations with Material menu
- **Extensible Widget System**: Factory pattern for custom widget types
- **Performance Optimized**: 100% OnPush change detection strategy
- **Provider Pattern**: Extensible dialog and settings providers

## Requirements

- Angular 20.2.0+
- Angular Material 20.2.0+
- Angular CDK 20.2.0+

## Basic Usage

```typescript
import { Component } from "@angular/core";
import { DashboardComponent, createEmptyDashboard } from "@dragonworks/ngx-dashboard";
import type { DashboardData } from "@dragonworks/ngx-dashboard";

@Component({
  selector: "app-dashboard-page",
  standalone: true,
  imports: [DashboardComponent],
  template: ` <ngx-dashboard [dashboardData]="dashboard" [editMode]="true" (dashboardChange)="onDashboardChange($event)"> </ngx-dashboard> `,
})
export class DashboardPageComponent {
  dashboard = createEmptyDashboard("my-dashboard", 12, 8);

  onDashboardChange(data: DashboardData) {
    // Handle dashboard updates
    console.log("Dashboard changed:", data);
  }
}
```

## Widget Registration

Register custom widgets with the `DashboardService`:

```typescript
import { Injectable } from "@angular/core";
import { DashboardService } from "@dragonworks/ngx-dashboard";
import { MyCustomWidget } from "./widgets/my-custom-widget.component";

@Injectable({ providedIn: "root" })
export class WidgetSetupService {
  constructor(private dashboardService: DashboardService) {
    this.registerWidgets();
  }

  private registerWidgets() {
    this.dashboardService.registerWidgetType(MyCustomWidget.metadata);
  }
}
```

## Components

### Main Components

- `DashboardComponent` - Main dashboard component with automatic mode switching
- `DashboardEditorComponent` - Editor mode with drag & drop
- `DashboardViewerComponent` - Viewer mode for presentation
- `WidgetListComponent` - Widget palette for drag & drop

### Services

- `DashboardService` - Widget registration and management

### Models & Utilities

- `createEmptyDashboard()` - Create new dashboard configuration
- `DashboardData` - Dashboard configuration interface
- `CellData` - Individual cell/widget data
- `WidgetMetadata` - Widget type definition

### Widget State Management

Widgets can implement optional lifecycle methods:

```typescript
export interface DashboardWidgetComponent {
  dashboardGetState?(): unknown;
  dashboardSetState?(state: unknown): void;
  dashboardEditState?(): void;
}
```

## Documentation

See the [main repository](https://github.com/TobyBackstrom/ngx-dashboard) for full documentation, examples, and demo application.

## License

MIT
