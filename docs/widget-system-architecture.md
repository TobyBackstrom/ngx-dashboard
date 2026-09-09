# Widget System Architecture

## Core Components

### 1. Widget Interface & Metadata (`models/widget.ts`)
- `Widget` interface with optional lifecycle methods:
  - `dashboardGetState()` - retrieves current widget state
  - `dashboardSetState(state)` - sets widget state
  - `dashboardEditState()` - opens widget configuration dialog
  - `dashboardEditSharedState()` - opens the widget family's shared configuration
    dialog. Implementing it is what adds the "Edit Shared State" item to the cell
    context menu, so the menu stays in step with what each widget actually supports
- `WidgetMetadata` with unique `widgetTypeid`, name, description, SVG icon, and an
  optional `group` heading used by the widget list. Grouped widgets render under a
  collapsible heading; ungrouped widgets trail them behind a divider. The
  disclosure is the component's own button plus an `inert` region rather than a
  `mat-expansion-panel` -- the panel's `(opened)`/`(closed)` fire for programmatic
  `[expanded]` changes as well as user gestures, and telling those apart forced a
  filtering guard into the public `setGroupExpanded()`. In the icon-only rail there
  is no room for headings, so sections are separated by dividers only and cannot be
  collapsed. `WidgetListComponent` also takes an opt-in `enableSearchBox` input that
  filters on name, description and widget type id; while a filter is active every
  group is force-expanded so no match hides behind a collapsed heading, and the
  user's own collapsed set is restored when the filter clears.
- `WidgetComponentClass<T>` extends Angular's `Type<T>` with static `metadata` property

### 2. DashboardService (`services/dashboard.service.ts`)
- Central registry for widget types using signals
- `registerWidgetType(widget, sharedStateProvider?)` - registers component classes as
  widgets. The optional second argument is a `WidgetSharedStateProvider`, passed
  either as an instance or as a class token that the service injects. Registering a
  type twice throws
- Maintains internal `widgetFactoryMap` for factory lookup
- `getFactory()` - returns factory for widget instantiation with fallback to
  `UnknownWidgetComponent`. The fallback factory carries the requested
  `widgetTypeid` into the placeholder's state as `originalWidgetTypeid`, so the type
  survives an export→import round trip through a session that could not resolve it
- Exposes `widgetTypes` as readonly signal for UI consumption
- Buffers shared state for types that are not registered yet, see
  [Late Registration](#late-registration) below

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

### Late Registration:
Widget types can register after `loadDashboard()` has already run, which is what
lazy-loaded modules do. Two mechanisms make that order-independent:

- **Factory self-healing** - `CellData.widgetTypeid` keeps the type the DTO asked
  for, independently of the factory that was resolved for it. The `cells` computed
  signal re-resolves any cell still holding the `UNKNOWN_WIDGET_TYPEID` factory
  whenever `widgetTypes()` changes, so a widget that arrives late swaps its
  placeholder for the real component. Healing happens in the computed only --
  `widgetsById` is never mutated -- and the signal skips the `widgetTypes()`
  dependency entirely once every cell is resolved, so a fully-resolved dashboard
  pays nothing for it
- **Shared state buffering** - `restoreSharedStates()` keeps entries it cannot match
  to a registered provider in a pending map, and `registerWidgetType()` drains that
  map when the matching provider shows up

## Widget Implementation Pattern

Each widget component (e.g., `LabelWidgetComponent`) follows this pattern:
1. Implements `Widget` interface
2. Defines static `metadata` property with unique ID
3. Uses signals for internal state management
4. Implements lifecycle methods for state persistence
5. Provides edit dialog via `dashboardEditState()`

Widget state is typed `unknown` throughout the system: the store, the DTO and the
`Widget` lifecycle methods all pass it through opaquely, so a widget is responsible
for validating what it gets back from `dashboardSetState()`.