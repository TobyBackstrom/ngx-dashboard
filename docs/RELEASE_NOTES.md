# v20.3.2 Release Notes

## ngx-dashboard (Core Library)

### Features

- **Widget Shared State Context Menu**
  - Added optional `dashboardEditSharedState()` method to Widget interface
  - CellComponent conditionally displays "Edit Shared State" menu item when widget implements method
  - Maintains separation of concerns (UI in components, data in services)
  - Fully backward compatible with no breaking changes

## ngx-dashboard-widgets (Widget Library)

## Demo Application

### Features

- **GitHub Repository Link**

  - Added repository link to toolbar using CSS Grid layout
  - Reactive dark mode support via style binding
  - i18n and accessibility support

- **Temperature Widget Shared State Integration**
  - Direct shared state editing via context menu
  - Removed nested dialog pattern from instance settings

### Refactoring

- Zoom functionality now uses zoom icon instead of previous icon
- Adjusted Temperature Widget font sizes and styles for improved readability

## Documentation

- Updated README to clarify dashboard viewer and editor sections
- Added new screenshots (`dashboard-editor.png`, `dashboard-viewer.png`)
- Removed old screenshot (`dashboard.png`)

# v20.3.1 Release Notes

## ngx-dashboard (Core Library)

### Features

- **Widget Family Shared State System**

  - Centralized configuration sharing across widget type instances
  - `WidgetSharedStateProvider<T>` interface with framework-managed serialization
  - Optional feature with full backward compatibility

- **Empty Cell Context Menu System**

  - Extensible provider-based architecture for empty cell interactions
  - `WidgetListContextMenuProvider` implementation with Material menu integration
  - Quick-repeat widget selection support

- **Cell Selection and Export**

  - Grid-based cell selection with snap-to-grid overlay
  - Selection-based dashboard export with boundary filtering
  - Zoom functionality with automatic minimal bounding box calculation
  - Optional padding parameter for exports

- **Empty Cell Context Provider System**
  - Abstract provider pattern for custom empty cell handlers
  - Default and widget-list implementations included

## ngx-dashboard-widgets (Widget Library)

### Features

- Tooltips for widget icons in collapsed mode

## Demo Application

### Features

- **Temperature Widget**

  - First widget demonstrating shared state usage

- **Collapsible Widget List**

  - Expand/collapse functionality with clickable header
  - Dual width states: 320px (full) / 64px (icon-only)
  - Dynamic FAB positioning based on widget list state
  - Keyboard shortcut (Ctrl+B / Cmd+B)

- **Selection and Zoom UX**

  - Cell selection dialog with persistent highlighting
  - Enhanced selection mode with FAB hiding and snackbar feedback

- **Library Version Display**

  - Version information displayed in main content area

- **Internationalization**
  - Comprehensive i18n support across entire demo application
  - Includes app shell, navigation, widgets, theme controls, and demo pages

### Refactoring

- Command map pattern in `DashboardFabComponent`
- Improved FAB architecture with mode exclusivity
- Simplified cell selection dialog to action buttons only

## Build & Infrastructure

### Features

- **Automated Version Exports**

  - Pre-build hooks generate version constants from package.json
  - `NGX_DASHBOARD_VERSION` and `NGX_DASHBOARD_WIDGETS_VERSION` exports

- **i18n Pipeline**
  - Reconfigured with XLIFF 2.0 format
  - Replaced xliffmerge with ng-extract-i18n-merge
  - Simplified extraction workflow

### Dependency Updates

- Angular CLI and build dependencies → 20.3.2
- Vite override → 7.1.11 (security vulnerability fix)

## Documentation

- Provider system architecture documentation
- Empty cell context provider system documentation
- `WidgetListContextMenuProvider` documentation
- Removed unused screenshot file
