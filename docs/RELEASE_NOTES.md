# v22.2.0 Release Notes

## ngx-dashboard (Core Library)

### Features

- **Grid Geometry API**

  - Rows, columns and gutter are now settable at runtime: `gutterSize` / `maxRows` / `maxColumns` inputs, a `setGutterSize()` method, `gridConfig()` / `minGridSize()` / `gridSizeLimits()` signals and a `gridConfigChanged` output
  - New exports: `GridConfig`, `GridSizeLimits`, `DEFAULT_GRID_SIZE_LIMITS`, `GUTTER_SIZE_PRESETS`, `sanitizeGutterSize`
  - Row/column ceiling (default 64 × 128) guards against runaway grids; clamp-to-content still outranks it, so an oversized imported dashboard keeps its widgets
  - The library ships the mechanics only — the editing UI stays with the host

- **Widget Name Badges**

  - `showWidgetNames` input labels each cell with its widget type in a corner tab, for reading a crowded grid
  - A view preference, not dashboard data — it is not written to the exported DTO

- **Widget Groups**

  - Optional `group` on `WidgetMetadata` buckets the widget list into collapsible sections, built on `mat-expansion-panel`
  - Omitting it everywhere renders exactly the previous flat list

- **Searchable Widget List**

  - Opt-in `enableSearchBox` input filters by widget name, description or type id
  - Groups stay expanded while a filter is active so matches are never hidden; the user's own collapsed set is restored when the filter clears

- **Multidirectional Cell Resize**
  - Bottom and corner handles join the existing right handle, so a widget can grow on both axes in a single gesture

### Fixes

- Pressing a resize handle no longer lights up the widget's entire right and bottom edges; the handles hide for the gesture and the `N × M` preview badge carries the feedback
- The corner resize handle is reliably hittable — it was clipped to a sliver by the cell's own overflow and hover lift, so corner drags resized on one axis
- Resize affordances use theme tokens instead of hardcoded colours, so they hold up on dark surfaces
- `loadDashboard()` now validates a DTO's gutter instead of patching it into state unchecked; an unusable value could silently collapse the grid

## ngx-dashboard-widgets (Widget Library)

- Released in lockstep with the core library; no functional changes

## Demo Application

### Features

- Grid settings dialog behind a FAB action — reference implementation for the new geometry API
- FAB toggle for the widget name badges; leaving edit mode clears them, since they are an arranging aid
- Widget palette groups the demo's own widgets (Charts, Sensors) and enables the search box

### Fixes

- Favicon links resolve against `<base href>`, so icons load when the app is served under a sub-path

### Refactoring

- Theme picker rebuilt from `mat-menu-item` rows with `role="menuitemradio"`, removing several `::ng-deep` reaches into Material internals

## Build & Infrastructure

- CI now smoke-tests the dev server, so Vite-path breakage can no longer pass while the AOT build, tests and lint stay green
- The blocking npm audit gate runs with `--omit=dev` — it gates on what consumers actually install — while a full audit still runs non-blocking for visibility

# v22.1.0 Release Notes

## ngx-dashboard (Core Library)

### Features

- **Resizable Grid in the Editor**
  - `setGridSize(rows, columns)` plus right, bottom and corner drag handles with a live preview
  - Clamp-to-content policy: shrinking snaps up to the smallest grid that still holds every widget, so a resize never orphans one
  - `gridResized` output reports the applied size and whether it was clamped; new `GridResizeResult` export

# v22.0.0 Release Notes

## Dependencies

- Both libraries and the demo move to the Angular 22 line (Angular 22.0.x, Material/CDK 22.0.x, TypeScript 6.0)
- Peer dependencies widened to `^22.0.0`

### Breaking Changes

- Consuming applications must be on Angular 22

# v21.2.1 – v21.2.2 Release Notes

## ngx-dashboard (Core Library)

### Features

- **Selection API Refinements**
  - `selectionModifier` input gates the selection overlay behind a modifier key, so widget click and context-menu handlers coexist with drag-to-select
  - `dragThreshold` input (default 4px) stops a stationary click from emitting a 1×1 selection
  - Selection migrated to PointerEvents — touch and pen drag-to-select now work
  - `clearSelection()` drops the selection rectangle imperatively, e.g. once a confirm dialog closes

### Fixes

- Cells leaving the selection rectangle mid-drag no longer flash at full saturation

# v21.1.0 – v21.1.2 Release Notes

## ngx-dashboard (Core Library)

### Features

- **Self-Healing for Late-Registered Widget Types**
  - Widget types registered after `loadDashboard()` now resolve automatically instead of staying unknown, so lazy-loaded widget modules work regardless of registration order

### Fixes

- Shared state is restored for widget types that register after the dashboard is imported
- `loadDashboard()` survives a `dashboardData` re-emission instead of being overwritten by it
- Angular updated for the XSS advisories GHSA-jrmj-c5cx-3cw6 and GHSA-g93w-mfhg-p222

# v21.0.0 Release Notes

## Dependencies

- Both libraries and the demo move to the Angular 21 line; peer dependencies widened to `^21.0.0`

### Breaking Changes

- **Zoneless Change Detection**
  - Production builds no longer ship zone.js. Consuming applications need signal-based patterns for change detection to work
  - Libraries inject `NgZone` optionally, so they still behave correctly in zone-based host applications

### Fixes

- `ResponsiveTextDirective` runs its observer callbacks outside the zone when zone.js is present

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
