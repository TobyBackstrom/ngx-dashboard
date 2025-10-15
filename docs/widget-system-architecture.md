# Widget System Architecture Review

## Core Components

### 1. Widget Interface & Metadata (`models/widget.ts`)
- `Widget` interface with optional lifecycle methods:
  - `dashboardGetState()` - retrieves current widget state
  - `dashboardSetState(state)` - sets widget state
  - `dashboardEditState()` - opens widget configuration dialog
- `WidgetMetadata` with unique `widgetTypeid`, name, description, and SVG icon
- `WidgetComponentClass<T>` extends Angular's `Type<T>` with static `metadata` property

### 2. DashboardService (`services/dashboard.service.ts`)
- Central registry for widget types using signals
- `registerWidgetType()` - registers component classes as widgets
- Maintains internal `widgetFactoryMap` for factory lookup
- `getFactory()` - returns factory for widget instantiation with fallback to `UnknownWidgetComponent`
- Exposes `widgetTypes` as readonly signal for UI consumption

### 3. WidgetFactory (`models/widget-factory.ts`)
- Factory pattern for widget instantiation
- `createFactoryFromComponent()` converts component class to factory
- `createInstance()` method creates component in ViewContainerRef and calls `dashboardSetState()`

## Widget Lifecycle

### Registration Flow:
1. App startup uses `provideEnvironmentInitializer()` in `app.config.ts`
2. Each widget component is registered via `dashboardService.registerWidgetType()`
3. Service creates factory and adds to internal map

### Creation Flow:
1. User drags widget from `WidgetListComponent` palette
2. Drag event carries `DragData` with widget metadata
3. Drop on `DropZoneComponent` triggers store's `handleDrop()`
4. Store's `createWidget()` generates unique `WidgetId` (UUID)
5. Widget factory instantiates component in `CellComponent`'s ViewContainerRef
6. Component's `dashboardSetState()` initializes with stored state

## Key Architecture Features

### Dual-ID System:
- `WidgetId` - UUID for widget instance identity (persists across moves)
- `CellId` - Position-based identifier (row, col) that updates on move
- Store uses `widgetsById: Record<string, CellData>` with WidgetId as key
- Prevents collision bugs when widgets move to same positions over time

### State Management:
- NgRx Signals store with feature-based architecture
- `withWidgetManagement()` feature handles widget CRUD
- `withDragDrop()` feature manages drag/drop operations
- State normalized for O(1) lookups and updates

### Component Integration:
- `CellComponent` hosts widget instances via ViewContainerRef
- Effect-based widget creation/destruction on factory/state changes
- `getCurrentWidgetState()` retrieves live state during export
- Proper cleanup with DestroyRef patterns

## Widget Implementation Pattern

Each widget component (e.g., `LabelWidgetComponent`) follows this pattern:
1. Implements `Widget` interface
2. Defines static `metadata` property with unique ID
3. Uses signals for internal state management
4. Implements lifecycle methods for state persistence
5. Provides edit dialog via `dashboardEditState()`

The system is elegantly designed with clear separation of concerns, type safety (except for widget state being `unknown`), and excellent performance through state normalization and signal-based reactivity.