# ngx-dashboard

<!-- Badges -->
<p>
  <!-- CI Status -->
  <a href="https://github.com/TobyBackstrom/ngx-dashboard/actions/workflows/ci.yml">
    <img src="https://github.com/TobyBackstrom/ngx-dashboard/actions/workflows/ci.yml/badge.svg" alt="CI Pipeline">
  </a>
  <!-- npm - core -->
  <a href="https://www.npmjs.com/package/@dragonworks/ngx-dashboard">
    <img src="https://img.shields.io/npm/v/%40dragonworks%2Fngx-dashboard.svg?label=ngx-dashboard&logo=npm&color=cb3837" alt="npm version - ngx-dashboard">
  </a>
  <!-- npm - widgets -->
  <a href="https://www.npmjs.com/package/@dragonworks/ngx-dashboard-widgets">
    <img src="https://img.shields.io/npm/v/%40dragonworks%2Fngx-dashboard-widgets.svg?label=ngx-dashboard-widgets&logo=npm&color=cb3837" alt="npm version - ngx-dashboard-widgets">
  </a>
  <!-- Angular Version -->
  <img src="https://img.shields.io/badge/Angular-22-DD0031.svg?logo=angular" alt="Angular 22">
  <!-- Typescript version -->
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178c6.svg?logo=typescript" alt="TypeScript 6.0">
  <!-- License -->
  <a href="https://github.com/TobyBackstrom/ngx-dashboard/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License">
  </a>
  <!-- PRs Welcome -->
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
</p>

🎯 **[Live Demo](https://dragonworks.dev/ngx-dashboard/)** - Try the interactive demo application

Modern Angular libraries for building drag-and-drop grid dashboards with resizable cells and customizable widgets. Built with Angular 22+ standalone components, NgRx Signals state management, and Material Design 3 design system compliance.

**ngx-dashboard** provides drop-in dashboard functionality for Angular applications. Add interactive grid-based dashboards to existing apps or build dedicated dashboard experiences from scratch. The library handles multiple dashboards within a single application, supports programmatic creation and serialization for persistent storage, and includes a built-in editor for end-user dashboard customization.

Opinionated with flexibility:

- **Explicit grid resolution**: Each dashboard has a row/column grid (8×16 by default) that you set when creating it and can change at runtime through the grid geometry API or the editor's drag handles. Cells resize responsively within that grid, but the layout never reflows itself across breakpoints — for different orientations, create separate dashboard configurations (16×8 for landscape, 8×16 for portrait).
- **Customization**: The library follows Material Design 3 patterns and includes standard Angular i18n support, while allowing customization through MD3 design tokens and dependency injection providers for dialogs, menus, and persistence strategies.

**ngx-dashboard-widgets** provides example widgets to illustrate concepts. Any Angular component can become a dashboard widget by implementing a simple interface and registering with the dashboard service. Widgets must be fully responsive and handle all cell sizes gracefully.

The **demo application** showcases the libraries in action with practical examples. It demonstrates dashboard management with FAB controls, drag-and-drop widget installation, real-time theme switching, custom widget implementations (Sparkline, Sparkbar, Temperature, Realtime Gauge), and both localStorage and file-based persistence strategies.

<br>
Dashboard viewer:

![Dashboard Viewer Screenshot](docs/dashboard-viewer.png)

<br>
Dashboard editor:

![Dashboard Editor Screenshot](docs/dashboard-editor.png)

## 📦 Architecture

This workspace contains three main projects:

### [@dragonworks/ngx-dashboard](./projects/ngx-dashboard)

Core dashboard library providing the fundamental grid and widget management system:

- **Grid System** - Responsive drag-and-drop grid with collision detection and boundary constraints
- **Grid Geometry API** - Rows, columns, and gutter settable at runtime, with clamp-to-content resizing that never orphans a widget
- **Cell Components** - Cells resizable on both axes (right, bottom, and corner handles) with live preview, context menus, and dual flat/elevated appearance modes
- **Cell Selection** - Optional snap-to-grid rectangle selection with modifier-key gating, a click-vs-drag threshold, and pointer support for mouse, touch, and pen
- **Widget Palette** - Collapsible widget groups, an opt-in search box, and optional per-cell name badges for reading a crowded grid
- **Widget Family Shared State** - Configuration shared across every instance of a widget type, serialized alongside the dashboard ([detailed docs](docs/widget-shared-state-guide.md))
- **Extensible Provider System** - Dependency injection-based architecture enabling custom dialog and UI implementations ([detailed docs](docs/provider-system-architecture.md))
- **Error Handling** - Graceful fallback components for unknown widget types with state preservation, self-healing when a type registers late

### [@dragonworks/ngx-dashboard-widgets](./projects/ngx-dashboard-widgets)

Widget collection library implementing Material Design 3 patterns:

- **Arrow Widget** - Directional indicators with rotation, opacity, and background customization
- **Label Widget** - Text display with responsive sizing using canvas-based optimization
- **Clock Widget** - Analog/digital dual-mode clock with real-time updates, configurable formats, and second hand options
- **Radial Gauge Widget** - Semi-circular gauge with a passive/active display system and MD3-compliant styling
- **Radial Gauge Component** - Standalone SVG gauge with dynamic sizing, segment support, and SVG-native text scaling, usable outside a dashboard
- **Responsive Text Directive** - Automatic font scaling with ellipsis-free design and developer-friendly API

### [Demo Application](./projects/demo)

Interactive demonstration showcasing real-world usage patterns:

- **Dashboard Management** - FAB speed dial controls with auto-loading from JSON configuration
- **Grid Settings** - Reference implementation of the grid geometry API, with rows, columns, and gutter editable at runtime
- **Theme System** - Material Design 3 theming with live theme switching and color token extraction
- **Widget Gallery** - Drag-and-drop widget installation from a grouped, searchable palette
- **Custom Widgets** - Sparkline and Sparkbar charts with theme-responsive colors, a Temperature widget demonstrating shared state, and a Realtime Gauge built by composition
- **Selection & Zoom** - Rectangle selection driving a non-destructive zoom into a minimal bounding box
- **Persistence** - localStorage and file system persistence implementations

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

- Angular 22.x.x → ngx-dashboard 22.y.z
- Angular 23.x.x → ngx-dashboard 23.y.z

This ensures compatibility with your Angular version while allowing independent feature releases and bug fixes.

### Usage Guide

For complete setup instructions, implementation examples, and best practices, see our comprehensive **[Usage Guide](USAGE.md)**.

The usage guide includes:

- **Complete Setup** - App configuration, Material theming, and widget registration
- **Dashboard Implementation** - Component usage patterns from the demo app
- **Custom Widget Creation** - Step-by-step widget development guide
- **Advanced Features** - Persistence, context menus, and custom dialogs
- **Troubleshooting** - Common setup issues and solutions

Quick example for getting started:

```typescript
// app.config.ts - Register widgets on startup
export const appConfig: ApplicationConfig = {
  providers: [
    provideEnvironmentInitializer(() => {
      const dashboardService = inject(DashboardService);
      dashboardService.registerWidgetType(LabelWidgetComponent);
    }),
  ],
};
```

### Deeper Documentation

Subsystem deep dives live in [`docs/`](docs):

- [Widget System Architecture](docs/widget-system-architecture.md) - Widget registration, factories, metadata, and lifecycle
- [Widget Shared State Guide](docs/widget-shared-state-guide.md) - Sharing configuration across all instances of a widget type
- [Provider System Architecture](docs/provider-system-architecture.md) - Injection points for dialogs, menus, and persistence
- [Empty Cell Context Provider](docs/empty-cell-context-provider.md) - Customizing right-click behavior on empty cells
- [Release Notes](docs/RELEASE_NOTES.md) - Version history for both libraries

## 🛠️ Development

### Prerequisites

- Node.js 24.15+ (see `engines` in `package.json`; CI runs 24.x)
- Angular 22+
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

# Run tests (800+ test cases)
npm test

# Individual builds
npm run build:ngx-dashboard
npm run build:ngx-dashboard-widgets

# Test with browser debugging
ng test
```

### Testing Strategy

- **User-Focused** - Tests verify public API behavior, not implementation details
- **Integration Tests** - Component-store interaction validation
- **Pattern-Based** - Deterministic testing for time-dependent features using regex patterns
- **Modern Testing Patterns** - Signal-based component testing with `fixture.componentRef.setInput()`

## 🏗️ Technical Foundation

### Modern Angular Architecture

- **Standalone Components** - Complete standalone API adoption throughout
- **NgRx Signals** - Signal-based state management with feature stores and computed arrays
- **Signal-First Design** - Modern reactive patterns with input(), output(), computed(), and effect()
- **OnPush Strategy** - 100% OnPush change detection with optimized performance
- **TypeScript Strict Mode** - Complete type safety with minimal `unknown` usage
- **Tree-Shakeable** - Optimized bundles with proper sideEffects configuration

### Material Design 3 Integration

- **Design Token System** - Comprehensive use of MD3 color tokens, typography, spacing, and motion variables
- **Theme Integration** - Dynamic light/dark mode switching with proper surface hierarchy
- **Component Styling** - Layout-focused CSS that respects Material themes and design patterns
- **Responsive Design** - Container queries and adaptive layouts

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
- [ ] Additional widget examples (charts, data tables)
- [ ] Keyboard navigation enhancements
- [ ] Widget templates

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
