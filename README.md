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

## 📦 Libraries

### [@dragonworks/ngx-dashboard](./projects/ngx-dashboard)

Core dashboard library providing:

- **Drag & Drop Grid** - Responsive grid system with real-time collision detection
- **Resizable Cells** - Dynamic resizing with boundary constraints
- **Dual Modes** - Separate editor and viewer components
- **State Management** - NgRx Signals with normalized state
- **Context Menu** - Widget cell context menu
- **Provider Pattern** - Extensible dialog system with Material Dialog integration
- **100% OnPush** - Optimized change detection throughout

### [@dragonworks/ngx-dashboard-widgets](./projects/ngx-dashboard-widgets)

Widget examples with Material Design 3 compliance:

- **Arrow Widget** - Directional indicators with rotation and styling
- **Label Widget** - Text display with responsive sizing
- **Clock Widget** - Dual-mode analog/digital clock with real-time updates

Use these as a base for your own widgets.

### [Demo Application](./projects/demo)

Demonstration app showcasing:

- Dashboard creation and management
- Widget gallery with drag-and-drop
- How to apply Material Design 3 theming to widgets
- Theme colors overview page
- Local storage and file persistence

You can use the demo app as a playground for your own widgets.
The theme switcher makes it easy to verify your widgets works with MD3 themes, both in light and dark mode.

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
import { DashboardComponent, createEmptyDashboard } from "@dragonworks/ngx-dashboard";
import { provideNgxDashboard } from "@dragonworks/ngx-dashboard";

@Component({
  template: ` <ngx-dashboard [dashboardData]="dashboard" [editMode]="true" (dashboardChange)="onDashboardChange($event)"> </ngx-dashboard> `,
  imports: [DashboardComponent],
  providers: [provideNgxDashboard()],
})
export class MyComponent {
  dashboard = createEmptyDashboard("my-dashboard", 12, 8);

  onDashboardChange(data: DashboardData) {
    // Handle dashboard updates
  }
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

## 🏗️ Architecture

### State Management

- **NgRx Signals** - Feature-based store architecture
- **Normalized State** - O(1) widget lookups with `cellsById` mapping
- **Computed Signals** - Automatic memoization for derived state
- **Features**: grid-config, widget-management, drag-drop, resize

### Widget System

- **Factory Pattern** - Dynamic widget instantiation
- **Metadata-Driven** - Self-describing widgets with icons
- **Lifecycle Methods** - Optional state management hooks
- **Type Registration** - Runtime widget type registration

### Component Architecture

- **100% Standalone** - All components use standalone API
- **Signal Inputs** - Modern Angular signal-based inputs
- **OnPush Strategy** - Optimized change detection
- **Minimal RxJS** - Signals-first approach

### Testing

- **370+ Tests** - Comprehensive coverage across libraries
- **User-Focused** - Tests verify behavior, not implementation
- **Integration Tests** - Component-store interaction validation
- **Pattern-Based** - Deterministic testing for time-dependent features

## 📖 Documentation

- [Core Library Documentation](./projects/ngx-dashboard/README.md)
- [Widget Library Documentation](./projects/ngx-dashboard-widgets/README.md)
- [Development Guidelines](./CLAUDE.md)

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

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🔗 Resources

- [Angular](https://angular.dev/)
- [NgRx Signals](https://ngrx.io/guide/signals)
- [Angular Material](https://material.angular.io/)
- [Material Design 3](https://m3.material.io/)
