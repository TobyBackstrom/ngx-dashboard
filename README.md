# ngx-dashboard

<!-- Badges -->
<p>
  <!-- CI Status -->
  <a href="https://github.com/TobyBackstrom/ngx-dashboard/actions/workflows/ci.yml">
    <img src="https://github.com/TobyBackstrom/ngx-dashboard/actions/workflows/ci.yml/badge.svg" alt="CI Pipeline">
  </a>
  <!-- Typescript version -->
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue.svg?logo=typescript" alt="TypeScript 5.8">
  <!-- Angular Version -->
  <img src="https://img.shields.io/badge/Angular-v20-dd0031.svg?logo=angular" alt="Angular 20">
  <!-- License -->
  <a href="https://github.com/TobyBackstrom/ngx-dashboard/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
  <!-- PRs Welcome -->
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

Angular libraries for building drag-and-drop grid dashboards with resizable cells and customizable widgets. Built with modern Angular patterns, NgRx Signals state management, and Material Design 3 compliance.

🎯 **[Live Demo](https://dragonworks.dev/ngx-dashboard/)** - Try the interactive demo application to see how the dashboard components are used in an Angular application

## 📦 Libraries

### [@dragonworks/ngx-dashboard](./projects/ngx-dashboard) v20.0.4

Core dashboard library providing:

- **Drag & Drop Grid** - Responsive grid system with real-time collision detection
- **Resizable Cells** - Dynamic resizing with boundary constraints and live preview
- **Dual Modes** - Separate editor and viewer components for different use cases
- **Context Menu** - Material-based widget context menu with precise positioning
- **Provider Pattern** - Extensible dialog system with Material Dialog integration
- **Error Resilience** - Fallback component for unknown widget types with state preservation
- **100% OnPush** - Optimized change detection strategy throughout

### [@dragonworks/ngx-dashboard-widgets](./projects/ngx-dashboard-widgets) v20.0.4

Widget collection with Material Design 3 compliance:

- **Arrow Widget** - Directional indicators with rotation and customizable styling
- **Label Widget** - Text display with responsive sizing and typography
- **Clock Widget** - Dual-mode analog/digital clock with real-time updates and configurable formats

### [Demo Application](./projects/demo)

Interactive demonstration showcasing:

- Dashboard creation and management with FAB speed dial controls
- Widget gallery with drag-and-drop installation
- Material Design 3 theming with live theme switching
- MD3 color tokens overview with real-time extraction
- Persistence options (localStorage and file system)
- Responsive design with mobile support

## 🚀 Quick Start

### Installation

```bash
# Core dashboard
npm install @dragonworks/ngx-dashboard

# Widget collection (optional)
npm install @dragonworks/ngx-dashboard-widgets

# Material Design support
npm install @angular/material @angular/cdk
```

### Versioning

The libraries maintain major version parity with Angular. While major versions are aligned, minor and patch versions may differ.

For example:

- Angular 20.x.x → ngx-dashboard 20.y.z
- Angular 21.x.x → ngx-dashboard 21.y.z

This ensures compatibility with your Angular version while allowing independent feature releases and bug fixes.

### Basic Usage

```typescript
import { Component, signal, inject } from "@angular/core";
import { DashboardComponent, WidgetListComponent, createEmptyDashboard, provideNgxDashboard, DashboardService, type DashboardData } from "@dragonworks/ngx-dashboard";

@Component({
  selector: "app-dashboard-page",
  standalone: true,
  imports: [DashboardComponent, WidgetListComponent],
  providers: [provideNgxDashboard()],
  template: `
    <div class="dashboard-container">
      <!-- Widget palette for drag-and-drop -->
      <ngx-dashboard-widget-list [widgetTypes]="widgetTypes()" />

      <!-- Main dashboard -->
      <ngx-dashboard [dashboardData]="dashboard()" [editMode]="editMode()" (dashboardChange)="onDashboardChange($event)" />
    </div>
  `,
})
export class DashboardPageComponent {
  private dashboardService = inject(DashboardService);

  dashboard = signal(createEmptyDashboard("my-dashboard", 12, 8));
  editMode = signal(true);
  widgetTypes = this.dashboardService.widgetTypes;

  onDashboardChange(data: DashboardData) {
    this.dashboard.set(data);
    // Save to backend or localStorage
  }
}
```

### Creating Custom Widgets

```typescript
import { Component, input } from "@angular/core";
import { type WidgetComponent, type WidgetMetadata } from "@dragonworks/ngx-dashboard";

@Component({
  selector: "app-my-widget",
  standalone: true,
  template: `
    <div class="widget-content">
      <h3>My Widget</h3>
      <p>{{ state().message }}</p>
    </div>
  `,
  styles: [
    `
      .widget-content {
        padding: 16px;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class MyWidgetComponent implements WidgetComponent {
  // Widget inputs
  widgetId = input.required<string>();
  state = input<any>({});

  // Widget metadata
  static metadata: WidgetMetadata = {
    widgetTypeId: "my-widget",
    displayName: "My Custom Widget",
    iconName: "widgets",
    description: "A custom widget example",
    factory: () => import("./my-widget.component").then((m) => m.MyWidgetComponent),
  };

  // Optional: Return current state
  dashboardGetState() {
    return this.state();
  }

  // Optional: Handle state updates
  dashboardSetState(state: any) {
    // Update internal state if needed
  }
}

// Register the widget type
export function registerMyWidget(dashboardService: DashboardService) {
  dashboardService.registerWidgetType(MyWidgetComponent.metadata);
}
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- Angular 20+
- npm or yarn

### Setup

```bash
git clone <repository-url>
cd ngx-dashboard
npm install
```

### Commands

```bash
# Development server
npm run start

# Build all projects
npm run build

# Run tests (370+ test cases)
npm test

# Individual builds
npm run build:ngx-dashboard
npm run build:ngx-dashboard-widgets

# Test with browser debugging
ng test
```

### Testing Strategy

- **370+ Tests** - Comprehensive coverage across all libraries (290 dashboard + 80 widgets)
- **User-Focused** - Tests verify public API behavior, not implementation details
- **Integration Tests** - Component-store interaction validation
- **Pattern-Based** - Deterministic testing for time-dependent features using regex patterns
- **Modern Testing Patterns** - Signal-based component testing with `fixture.componentRef.setInput()`

## 🎨 Material Design 3 Compliance

The libraries follow Material Design 3 specifications where justified:

- **Design Tokens** - Systematic use of MD3 color tokens, typography, spacing, and motion
- **Theme Integration** - Full support for light/dark modes with dynamic theme switching
- **Surface Hierarchy** - Proper elevation and surface tinting following MD3 guidelines
- **Responsive Patterns** - Container queries and adaptive layouts for all screen sizes
- **Component Styling** - Layout-focused styles that respect Material theme

## 🚀 Key Features

### Modern Angular Patterns

- **Standalone Components** - All components use Angular's standalone API
- **Signal Inputs/Outputs** - Modern signal-based component communication
- **Computed & Effects** - Reactive programming with Angular signals
- **TypeScript Strict Mode** - Full type safety with no `any` types
- **Tree-Shakeable** - Optimized bundle sizes with proper sideEffects configuration
- **Extensible Architecture** - Provider pattern for custom implementations
- **Comprehensive Testing** - Behavior-driven tests with high coverage

## 📖 Documentation

- [Core Library Documentation](./projects/ngx-dashboard/README.md)
- [Widget Library Documentation](./projects/ngx-dashboard-widgets/README.md)
- [Development Guidelines](./CLAUDE.md)
- [Live Demo](https://dragonworks.dev/ngx-dashboard/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Ensure tests pass (`npm test`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Guidelines

- Follow existing code patterns
- Use modern Angular APIs (signals, standalone)
- Add tests for new features
- Update documentation as needed

## 🗺️ Roadmap

### Near Term

- [ ] Widget state type safety improvements
- [ ] Additional widget examples (charts, gauges, data tables)
- [ ] Keyboard navigation enhancements
- [ ] Widget grouping and templates

### Future Considerations

- [ ] Advanced layout algorithms
- [ ] Performance monitoring widgets
- [ ] Dashboard versioning and history

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Resources

- [Angular](https://angular.dev/)
- [NgRx Signals](https://ngrx.io/guide/signals)
- [Angular Material](https://material.angular.io/)
- [Material Design 3](https://m3.material.io/)
- [GitHub Repository](https://github.com/TobyBackstrom/ngx-dashboard)
- [NPM Package - Core](https://www.npmjs.com/package/@dragonworks/ngx-dashboard)
- [NPM Package - Widgets](https://www.npmjs.com/package/@dragonworks/ngx-dashboard-widgets)
