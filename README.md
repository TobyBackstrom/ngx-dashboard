# Angular Dashboard Libraries

A collection of Angular libraries for building performant, modular, and fully reactive grid dashboards with drag-and-drop functionality, resizable grid cells, and customizable widgets.

## 📦 Libraries

### [@dragonworks/ngx-dashboard](./projects/ngx-dashboard)

The core dashboard library providing:

- **Drag & Drop Dashboard** - Intuitive grid-based layout with real-time positioning
- **Resizable Cells** - Dynamic cell resizing with collision detection
- **Dual Modes** - Separate editing and viewing components for optimal UX
- **State Management** - Powered by NgRx Signals with feature-based architecture
- **Zero Dependencies** - Truly framework-agnostic with no external UI library requirements
- **Flexible Dialog System** - Pluggable dialog architecture supporting any UI framework

### [@dragonworks/ngx-dashboard-widgets](./projects/ngx-dashboard-widgets)

A collection of example widgets to get you started, featuring:

- **Arrow Widget** - Directional indicators with customizable styling
- **Label Widget** - Text labels with rich formatting options
- **Extensible Architecture** - Easy to add custom widgets

## 🚀 Quick Start

### Installation

```bash
# Install the core dashboard
npm install @dragonworks/ngx-dashboard

# Install widget collection (optional)
npm install @dragonworks/ngx-dashboard-widgets
```

### Basic Usage

```typescript
import { DashboardComponent, createEmptyDashboard } from "@dragonworks/ngx-dashboard";

@Component({
  template: `
    <ngx-dashboard 
      [dashboardData]="dashboardConfig" 
      [editMode]="true">
    </ngx-dashboard>
  `,
  imports: [DashboardComponent],
})
export class MyComponent {
  // Create dashboard configuration
  dashboardConfig = createEmptyDashboard('my-dashboard-id', 5, 8);
  
  // Uses native browser dialogs by default
}
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- Angular 20+
- npm

### Setup

```bash
# Clone and install dependencies
git clone <repository-url>
cd ngx-dashboard
npm install
```

### Build Commands

```bash
# Build both libraries
npm run build

# Build individual libraries
npm run build:ngx-dashboard
npm run build:ngx-dashboard-widgets
```

### Testing

```bash
# Run all tests
npm test

# Run tests with browser (for debugging)
ng test
```

## 🏗️ Architecture

### Component Naming Convention

- **Public API**: `ngx-dashboard-*` (for library consumers)
- **Internal**: `lib-*` (for internal library use)

### State Management

- **NgRx Signals** - Reactive state management
- **Feature-based Organization** - Modular store features (grid, widgets, drag-drop, resize)
- **Computed Properties** - Efficient reactive updates

### Widget System

- **Factory Pattern** - Pluggable widget architecture
- **Metadata-driven** - Self-describing widgets with icons and descriptions
- **State Management** - Widget-specific state with serialization support

### Dialog System

- **Framework Agnostic** - No built-in UI framework dependencies
- **Works Out of Box** - Native browser dialogs provide immediate functionality
- **Provider Pattern** - Simple dependency injection for custom dialog solutions
- **Material Support** - Separate package available for Angular Material integration

## 📖 Documentation

- [Core Dashboard Documentation](./projects/ngx-dashboard/README.md)
- [Widgets Documentation](./projects/ngx-dashboard-widgets/README.md)
- [Material Dialog Implementation Guide](./MATERIAL_DIALOG_IMPLEMENTATION.md)
- [Development Guide](./CLAUDE.md)

## 🧪 Features

### ✅ Completed

- [x] Drag & drop grid system
- [x] Cell resizing with collision detection
- [x] Widget factory and registration
- [x] Export/import dashboard configurations
- [x] Comprehensive test suite (187 tests)
- [x] Arrow and Label widgets
- [x] Dual editing/viewing modes
- [x] Framework-agnostic dialog system
- [x] Zero external dependencies

### 🚧 Planned

- [ ] Demo application
- [ ] Additional widget types
- [ ] Theme system
- [ ] Accessibility improvements

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Submit a pull request

## 📄 License

[MIT License](LICENSE)

## 🔗 Links

- [Angular](https://angular.dev/)
- [NgRx Signals](https://ngrx.io/guide/signals)
- [Angular Material](https://material.angular.io/) (used in widgets)
