# ngx-dashboard Usage Guide

Complete implementation guide for building dashboard applications with ngx-dashboard and ngx-dashboard-widgets.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Complete Setup](#complete-setup)
- [Basic Dashboard Implementation](#basic-dashboard-implementation)
- [Widget Registration](#widget-registration)
- [Dashboard Component Usage](#dashboard-component-usage)
- [Creating Custom Widgets](#creating-custom-widgets)
- [Advanced Features](#advanced-features)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Dependencies

```bash
# Core dashboard library
npm install @dragonworks/ngx-dashboard

# Widget collection (optional but recommended)
npm install @dragonworks/ngx-dashboard-widgets

# Required peer dependencies
npm install @angular/material @angular/cdk @angular/localize
```

Both libraries declare `@angular/common`, `@angular/core`, `@angular/localize`,
`@angular/material` and `@angular/cdk` as peer dependencies, all at `^22.0.0` — the
libraries track the Angular major. `@angular/localize` is needed because the library
marks its user-facing strings with `$localize`; an app that ships a single language
still needs the package present.

### Angular Material Theme Setup

Add a Material Design theme to your `styles.scss`:

```scss
@use '@angular/material' as mat;

html {
  @include mat.theme((
    color: (
      primary: mat.$azure-palette,
      tertiary: mat.$blue-palette,
    ),
    typography: Roboto,
    density: 0,
  ));
}

body {
  background: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
}
```

`mat.theme()` emits the MD3 system variables (`--mat-sys-*`) that the dashboard and
every bundled widget style against, and follows the user's light/dark preference on
its own. The pre-v3 API (`mat.define-palette()`, `mat.define-light-theme()`,
`mat.all-component-themes()`) is gone from Material 22 — the M2 mixins that remain
are namespaced `mat.m2-*` and are not what these libraries expect.

To generate a palette from your own brand colour:

```bash
ng generate @angular/material:theme-color --primary-color=#37618E --is-scss=true
```

## Complete Setup

### 1. Application Configuration

Create or update your `app.config.ts`:

```typescript
import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideEnvironmentInitializer,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { DashboardService } from '@dragonworks/ngx-dashboard';
import {
  ArrowWidgetComponent,
  LabelWidgetComponent,
  ClockWidgetComponent,
  RadialGaugeWidgetComponent,
} from '@dragonworks/ngx-dashboard-widgets';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Every component in both libraries is OnPush and signal-based, so they run
    // zoneless. zone.js is not required at runtime.
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(), // Only needed if you load dashboards over HTTP
    
    // Register built-in widgets globally
    provideEnvironmentInitializer(() => {
      const dashboardService = inject(DashboardService);
      
      // Register built-in widgets from ngx-dashboard-widgets
      dashboardService.registerWidgetType(ArrowWidgetComponent);
      dashboardService.registerWidgetType(LabelWidgetComponent);
      dashboardService.registerWidgetType(ClockWidgetComponent);
      dashboardService.registerWidgetType(RadialGaugeWidgetComponent);
      
      // Register any custom widgets here
      // dashboardService.registerWidgetType(MyCustomWidgetComponent);
    }),
  ],
};
```

### 2. Main Application Component

Update your `main.ts`:

```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
```

## Basic Dashboard Implementation

### Complete Dashboard Page Component

```typescript
import {
  Component,
  inject,
  viewChild,
  computed,
  ChangeDetectionStrategy,
  signal,
  effect,
} from '@angular/core';
import {
  DashboardComponent as NgxDashboardComponent,
  WidgetListComponent,
  createEmptyDashboard,
  ReservedSpace,
  DashboardDataDto,
} from '@dragonworks/ngx-dashboard';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [NgxDashboardComponent, WidgetListComponent],
  template: `
    <div class="dashboard-viewport-container">
      <div class="dashboard-wrapper">
        <ngx-dashboard
          #dashboard
          [dashboardData]="dashboardConfig"
          [editMode]="editMode()"
          [reservedSpace]="dashboardReservedSpace()"
        >
        </ngx-dashboard>
      </div>

      @if (editMode()) {
        <ngx-dashboard-widget-list class="widget-list"></ngx-dashboard-widget-list>
      }
    </div>

    <!-- Control buttons -->
    <div class="controls">
      <button (click)="toggleEditMode()">
        {{ editMode() ? 'Exit Edit' : 'Edit Dashboard' }}
      </button>
      <button (click)="exportDashboard()">Export</button>
      <button (click)="importDashboard()">Import</button>
      <button (click)="clearDashboard()">Clear</button>
    </div>
  `,
  styles: [
    `
      .dashboard-viewport-container {
        position: relative;
        width: 100%;
        height: 100vh;
        display: flex;
        overflow: hidden;
      }
      
      .dashboard-wrapper {
        flex: 1;
        overflow: hidden;
      }
      
      .widget-list {
        width: 320px;
        border-left: 1px solid var(--mat-sys-outline-variant);
        background: var(--mat-sys-surface);
      }
      
      .controls {
        position: absolute;
        top: 16px;
        right: 16px;
        display: flex;
        gap: 8px;
        z-index: 100;
      }
      
      button {
        padding: 8px 16px;
        border: 1px solid var(--mat-sys-outline);
        background: var(--mat-sys-surface);
        color: var(--mat-sys-on-surface);
        border-radius: 4px;
        cursor: pointer;
      }
      
      button:hover {
        background: var(--mat-sys-surface-variant);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  // Local state
  protected editMode = signal(false);

  // Dashboard configuration
  protected dashboardConfig = createEmptyDashboard(
    'my-dashboard',
    8,    // rows
    12,   // columns
    '0.5em' // gutter size
  );

  // Component reference for imperative API
  dashboard = viewChild.required<NgxDashboardComponent>('dashboard');

  // Reserved space configuration for viewport constraints
  protected readonly dashboardReservedSpace = computed(
    (): ReservedSpace => ({
      top: 64,    // Space for controls
      bottom: 16,
      left: 16,
      right: 16 + (this.editMode() ? 320 + 16 : 0), // Widget list width when in edit mode
    })
  );

  /**
   * Toggle edit mode
   */
  toggleEditMode(): void {
    this.editMode.update((mode) => !mode);
  }

  /**
   * Export dashboard to JSON
   */
  exportDashboard(): void {
    try {
      const data = this.dashboard().exportDashboard();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-dashboard.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting dashboard:', error);
      alert('Failed to export dashboard');
    }
  }

  /**
   * Import dashboard from JSON file
   */
  importDashboard(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          this.dashboard().loadDashboard(data);
        } catch (error) {
          console.error('Error importing dashboard:', error);
          alert('Failed to import dashboard: Invalid JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  /**
   * Clear all widgets from dashboard
   */
  clearDashboard(): void {
    if (confirm('Are you sure you want to clear the dashboard?')) {
      this.dashboard().clearDashboard();
    }
  }
}
```

### Dashboard Template Structure

```html
<!-- dashboard-page.component.html -->
<div class="dashboard-viewport-container">
  <!-- Main dashboard area -->
  <div class="dashboard-wrapper">
    <ngx-dashboard
      #dashboard
      [dashboardData]="dashboardConfig"
      [editMode]="editMode()"
      [reservedSpace]="dashboardReservedSpace()"
    >
    </ngx-dashboard>
  </div>

  <!-- Conditional widget list (only in edit mode) -->
  @if (editMode()) {
    <ngx-dashboard-widget-list class="widget-list"></ngx-dashboard-widget-list>
  }
</div>
```

### Widget List Options

```html
<ngx-dashboard-widget-list
  class="widget-list"
  [collapsed]="isWidgetListCollapsed()"
  [enableSearchBox]="true"
></ngx-dashboard-widget-list>
```

| Input | Default | Description |
| --- | --- | --- |
| `collapsed` | `false` | Renders the list as an icon-only rail. Names, descriptions and the search box are hidden; each widget keeps a tooltip. |
| `enableSearchBox` | `false` | Shows a free-text filter above the list, matching widget name, description and widget type id (case insensitive) |

Widgets are grouped by their optional `WidgetMetadata.group`; grouped sections
can be collapsed, and ungrouped widgets are listed last. While a filter is
active every group stays expanded so matches are never hidden.

## Widget Registration

### Built-in Widgets

All built-in widgets from `@dragonworks/ngx-dashboard-widgets` must be registered:

```typescript
import {
  ArrowWidgetComponent,
  LabelWidgetComponent, 
  ClockWidgetComponent,
  RadialGaugeWidgetComponent,
} from '@dragonworks/ngx-dashboard-widgets';

// In app.config.ts provideEnvironmentInitializer
dashboardService.registerWidgetType(ArrowWidgetComponent);
dashboardService.registerWidgetType(LabelWidgetComponent);
dashboardService.registerWidgetType(ClockWidgetComponent);
dashboardService.registerWidgetType(RadialGaugeWidgetComponent);
```

### Widget Type Information

Each registered widget provides:

- **Arrow Widget**: Directional indicators with rotation and styling options
- **Label Widget**: Text display with responsive sizing and alignment
- **Clock Widget**: Analog/digital dual-mode clock with real-time updates
- **Radial Gauge Widget**: Semi-circular progress indicators with segments

## Dashboard Component Usage

### Imperative API (Recommended)

Use ViewChild to access the dashboard component methods:

```typescript
// Get component reference
dashboard = viewChild.required<NgxDashboardComponent>('dashboard');

// Export current state
const dashboardData = this.dashboard().exportDashboard();

// Load new state  
this.dashboard().loadDashboard(dashboardData);

// Clear all widgets
this.dashboard().clearDashboard();
```

### Reactive Binding vs. loadDashboard

`dashboardData` is a **seed, not a binding**. The component loads the first non-null
value it sees and then ignores the input, so that a re-emission — from a `toSignal()`
over an HTTP observable, say — cannot silently overwrite an imperative
`loadDashboard()` the user just triggered.

```typescript
// Does NOT swap the dashboard after the first load
[dashboardData]="currentConfig()"

// Correct: load imperatively
this.dashboard().loadDashboard(nextConfig);
```

The `dashboardId` follows the same rule: the DTO's id is adopted on the first load
only. Later imports keep the store's id and treat the incoming one as metadata about
where the file came from, so exporting from one dashboard and importing into another
works without rewriting ids by hand.

### Configuration Properties

```typescript
// Dashboard initial configuration
dashboardConfig = createEmptyDashboard(
  'unique-dashboard-id',  // Dashboard identifier
  8,                      // Number of rows
  12,                     // Number of columns  
  '0.5em'                // Gutter size between cells
);

// Reserved space for UI elements
dashboardReservedSpace = computed((): ReservedSpace => ({
  top: 64,     // Toolbar height
  bottom: 16,  // Bottom padding
  left: 16,    // Left padding
  right: editMode() ? 352 : 16, // Right padding + widget list
}));
```

### Inputs

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `dashboardData` | `DashboardDataDto` | *required* | Initial dashboard. Read **once**, on the first non-null value — see [Reactive binding vs. loadDashboard](#reactive-binding-vs-loaddashboard) |
| `editMode` | `boolean` | `false` | Switches between the editor and the viewer |
| `reservedSpace` | `ReservedSpace` | — | Viewport insets, so the grid sizes itself around your own chrome |
| `enableSelection` | `boolean` | `false` | Mounts the snap-to-grid selection overlay (viewer only) |
| `selectionModifier` | `SelectionModifier \| null` | `null` | `'shift' \| 'ctrl' \| 'alt' \| 'meta'`. With `null` the overlay is always armed; with a modifier it arms only while that key is held, so widget clicks keep working |
| `dragThreshold` | `number` | `4` | Minimum pointer travel in CSS pixels before a selection is emitted. `0` restores "every pointerup emits" |
| `gutterSize` | `string` | — | CSS length for the gutter (`px`/`em`/`rem` only). A seed, not a binding: an invalid value is ignored, and a later `loadDashboard()` still wins |
| `maxRows` | `number` | `64` | Ceiling for any resize. The clamp-to-content floor outranks it, so an imported dashboard never loses widgets |
| `maxColumns` | `number` | `128` | As above, for columns |
| `showWidgetNames` | `boolean` | `false` | Corner badge naming each widget's type — a reading aid for crowded grids. A view preference; it is not written to the exported DTO |

### Outputs

| Output | Payload | Fires when |
| --- | --- | --- |
| `selectionComplete` | `GridSelection` | A selection gesture ends above `dragThreshold`. The rectangle stays on screen afterwards so you can render confirm UX over it — call `clearSelection()` when done |
| `gridResized` | `GridResizeResult` | The grid size changes. Carries `clamped`, so you can tell the user they hit a limit |
| `gridConfigChanged` | `GridConfig` | Any committed geometry change, gutter included. The autosave hook — but every intermediate state of a live editor emits, so debounce |

Neither `gridResized` nor `gridConfigChanged` fires for `loadDashboard()`: the host
initiated that itself.

### Methods and Signals

```typescript
const dashboard = viewChild.required<NgxDashboardComponent>('dashboard');

// Data
dashboard().exportDashboard();                  // DashboardDataDto
dashboard().exportDashboard(selection, opts);   // only the selected region
dashboard().loadDashboard(data);
dashboard().clearDashboard();

// Geometry
dashboard().setGridSize(10, 20);                // GridResizeResult, reports clamping
dashboard().setGutterSize('1em');               // returns the gutter actually applied

// Selection
dashboard().clearSelection();                   // drop the rectangle after confirm UX

// Readonly signals
dashboard().gridConfig();                       // committed geometry, never a drag preview
dashboard().minGridSize();                      // clamp-to-content floor
dashboard().gridSizeLimits();                   // ceiling from maxRows / maxColumns
```

`exportDashboard(selection, options)` filters to a region. `SelectionFilterOptions`
takes `useMinimalBounds` (shrink to the tightest box containing the selected widgets,
default `false`) and `padding` (empty cells added on every side afterwards, default
`0`, clamped at the grid origin).

`setGridSize()` and `setGutterSize()` both return what was *actually* applied rather
than what was asked for — a gutter in a rejected unit keeps the previous value, and a
size below the content floor snaps up to it.

## Creating Custom Widgets

### Complete Custom Widget Example

```typescript
import { Component, signal, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';

// Define widget state interface
export interface MyWidgetState {
  message: string;
  count: number;
  color?: string;
}

// Import SVG icon (recommended approach)
const svgIcon = `<svg viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
</svg>`;

@Component({
  selector: 'app-my-widget',
  standalone: true,
  template: `
    <div class="widget-content" [style.background-color]="state().color || 'transparent'">
      <div class="widget-icon" [innerHTML]="safeSvgIcon"></div>
      <h3>{{ state().message || 'Hello Dashboard!' }}</h3>
      <div class="counter">
        <button (click)="decrement()">-</button>
        <span class="count">{{ state().count }}</span>
        <button (click)="increment()">+</button>
      </div>
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
        gap: 12px;
        border-radius: 8px;
        transition: all 200ms ease;
      }
      
      .widget-icon {
        width: 32px;
        height: 32px;
        color: var(--mat-sys-primary);
      }
      
      h3 {
        margin: 0;
        font-size: 1.1em;
        font-weight: 500;
        color: var(--mat-sys-on-surface);
        text-align: center;
      }
      
      .counter {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      
      button {
        width: 32px;
        height: 32px;
        border: 1px solid var(--mat-sys-outline);
        background: var(--mat-sys-surface-variant);
        color: var(--mat-sys-on-surface-variant);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      
      button:hover {
        background: var(--mat-sys-primary);
        color: var(--mat-sys-on-primary);
      }
      
      .count {
        font-size: 1.2em;
        font-weight: bold;
        min-width: 2ch;
        text-align: center;
        color: var(--mat-sys-primary);
      }
    `,
  ],
})
export class MyWidgetComponent implements Widget {
  // Static metadata for widget registration
  static metadata: WidgetMetadata = {
    widgetTypeid: '@custom/my-widget',  // Unique identifier
    name: 'My Custom Widget',          // Display name in widget list
    description: 'A sample custom widget with counter functionality',
    svgIcon,                          // Widget icon for widget list
    group: 'Custom',                  // Optional widget list heading
  };

  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialog = inject(MatDialog);

  // Safe SVG icon for template
  readonly safeSvgIcon: SafeHtml = this.sanitizer.bypassSecurityTrustHtml(svgIcon);

  // Widget state
  readonly state = signal<MyWidgetState>({
    message: 'Hello Dashboard!',
    count: 0,
    color: undefined,
  });

  /**
   * Increment counter
   */
  increment(): void {
    this.state.update((s) => ({ ...s, count: s.count + 1 }));
  }

  /**
   * Decrement counter
   */
  decrement(): void {
    this.state.update((s) => ({ ...s, count: Math.max(0, s.count - 1) }));
  }

  // Widget lifecycle methods

  /**
   * Get current widget state for persistence
   */
  dashboardGetState(): MyWidgetState {
    return this.state();
  }

  /**
   * Set widget state from persisted data
   */
  dashboardSetState(state?: unknown): void {
    if (state && typeof state === 'object') {
      this.state.set({
        message: (state as any).message || 'Hello Dashboard!',
        count: (state as any).count || 0,
        color: (state as any).color,
      });
    }
  }

  /**
   * Optional: Handle widget configuration/settings dialog.
   * The `Widget` interface declares this optional, but an implementation
   * declares it as a normal method - a class member cannot carry `?`.
   */
  dashboardEditState(): void {
    // Open settings dialog
    const dialogRef = this.dialog.open(MyWidgetSettingsDialog, {
      data: this.state(),
      width: '400px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.state.set(result);
      }
    });
  }
}

// Register the widget (in app.config.ts)
// dashboardService.registerWidgetType(MyWidgetComponent);
```

### Widget Settings Dialog (Optional)

```typescript
import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MyWidgetState } from './my-widget.component';

@Component({
  selector: 'app-my-widget-settings',
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Widget Settings</h2>
    <div mat-dialog-content>
      <mat-form-field>
        <mat-label>Message</mat-label>
        <input matInput [value]="message()" (input)="message.set($any($event.target).value)">
      </mat-form-field>

      <mat-form-field>
        <mat-label>Background Color</mat-label>
        <input matInput type="color" [value]="color()" (input)="color.set($any($event.target).value)">
      </mat-form-field>
    </div>

    <div mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-flat-button cdkFocusInitial (click)="save()">Save</button>
    </div>
  `,
})
export class MyWidgetSettingsDialog {
  private dialogRef = inject(MatDialogRef<MyWidgetSettingsDialog>);
  private data = inject<MyWidgetState>(MAT_DIALOG_DATA);

  // One signal per field. `[(ngModel)]="state().message"` does not work: the
  // left-hand side of a two-way binding has to be assignable, and a signal
  // read is a function call.
  readonly message = signal(this.data.message);
  readonly color = signal(this.data.color ?? '#ffffff');

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.dialogRef.close({
      ...this.data,
      message: this.message(),
      color: this.color(),
    });
  }
}
```

## Advanced Features

### Dashboard Persistence

```typescript
// Save to localStorage
const saveToLocalStorage = (dashboard: DashboardDataDto) => {
  localStorage.setItem('my-dashboard', JSON.stringify(dashboard));
};

// Load from localStorage  
const loadFromLocalStorage = (): DashboardDataDto | null => {
  const saved = localStorage.getItem('my-dashboard');
  return saved ? JSON.parse(saved) : null;
};

// Saving on change: an effect around exportDashboard() will NOT work. It reads
// live widget state through a callback rather than a signal, so the effect runs
// once and never again. Save from the events that actually report a change:
constructor() {
  // Geometry changes (size and gutter, handle-driven or programmatic)
  this.dashboard().gridConfigChanged.subscribe(() => this.save());
}

onEditModeExit(): void {
  this.save(); // Widget add/move/resize/delete has no output - save on a
}              // natural boundary such as leaving edit mode, or on a timer

private save(): void {
  saveToLocalStorage(this.dashboard().exportDashboard());
}
```

`gridConfigChanged` emits on every committed change, including the intermediate
states of a settings dialog that applies as the user drags a slider — debounce, or
persist once the value settles.

### HTTP-based Dashboard Loading

```typescript
import { httpResource } from '@angular/common/http';

// The request is a reactive function, not a plain object - read signals inside
// it and the resource refetches when they change.
protected dashboardResource = httpResource<DashboardDataDto>(
  () => ({ url: `/api/dashboards/${this.dashboardId()}` })
);

constructor() {
  effect(() => {
    const data = this.dashboardResource.value();
    // Wait for 'resolved': value() is undefined while loading and on error
    if (data && this.dashboardResource.status() === 'resolved') {
      // queueMicrotask defers past the current change detection pass, so the
      // viewChild is resolved before the imperative call
      queueMicrotask(() => this.dashboard().loadDashboard(data));
    }
  });
}
```

### Cell Selection

The viewer can hand back a rectangle of grid coordinates — the demo uses it to zoom
into a region, but it suits any "act on this area" gesture.

```typescript
@Component({
  template: `
    <ngx-dashboard
      #dashboard
      [dashboardData]="config"
      [enableSelection]="true"
      [selectionModifier]="'shift'"
      [dragThreshold]="4"
      (selectionComplete)="onSelection($event)"
    />
  `,
})
export class SelectableDashboardComponent {
  private readonly dashboard = viewChild.required<NgxDashboardComponent>('dashboard');

  async onSelection(selection: GridSelection): Promise<void> {
    // The rectangle stays visible after the event, so confirm UX can render
    // over it. Nothing clears it for you.
    const confirmed = await this.confirmDialog(selection);
    if (confirmed) {
      // Selection is positional; the options argument is optional
      const region = this.dashboard().exportDashboard(selection, {
        useMinimalBounds: true, // tighten to the widgets actually inside
        padding: 1,             // then add a one-cell margin
      });
      // ...
    }
    this.dashboard().clearSelection();
  }
}
```

`GridSelection` is `{ topLeft: { row, col }, bottomRight: { row, col } }`, normalized
regardless of which way the drag went.

Two inputs keep selection from fighting the widgets underneath it:

- **`selectionModifier`** — with `null` (the default) the overlay is permanently
  armed and swallows clicks meant for widgets. Set `'shift' | 'ctrl' | 'alt' |
  'meta'` and it arms only while that key is held, so widget clicks and context menus
  keep working the rest of the time.
- **`dragThreshold`** — pointer travel, in CSS pixels, below which the gesture is
  discarded. The `4` default matches OS click-vs-drag behaviour and stops a
  stationary click emitting a 1×1 selection.

Selection is pointer-based, so mouse, touch and pen all work. It is viewer-only —
`editMode` takes precedence.

### Grid Geometry at Runtime

Rows, columns and gutter are all settable after load. The library owns the mechanics;
the editing UI is yours.

```typescript
// Apply a size; the result reports what was actually applied
const result: GridResizeResult = this.dashboard().setGridSize(rows, columns);
if (result.clamped) {
  this.notify(`Adjusted to ${result.rows} × ${result.columns}`);
}

// Gutter: px / em / rem only. Returns the gutter in force afterwards, which is
// the previous one when the value was rejected.
const applied = this.dashboard().setGutterSize('1em');

// Bounds for your own controls
const floor = this.dashboard().minGridSize();     // smallest size that still fits every widget
const ceiling = this.dashboard().gridSizeLimits(); // from maxRows / maxColumns
```

Shrinking uses a **clamp-to-content** policy: a size that would push a widget out of
bounds snaps up to the smallest size that still holds every widget, so a resize never
orphans one. That floor also outranks `maxRows`/`maxColumns`, which is why a dashboard
imported with more rows than the cap keeps them.

Percentages and viewport units are rejected for the gutter: the cell size is computed
with container-query arithmetic (`100cqi`), which they break.

### Widget Name Badges

```html
<ngx-dashboard [dashboardData]="config" [showWidgetNames]="editMode()" />
```

Labels each cell with its widget type in a corner tab. There is no imperative setter
and no read-back signal — hold the flag in your own signal and bind it. The badge
text comes from `WidgetMetadata.name`, so it is already localized by whoever
registered the widget. It is a view preference and is never written to the exported
DTO.

### Widget Family Shared State

Register a provider alongside the widget to share configuration across every instance
of that type:

```typescript
dashboardService.registerWidgetType(TemperatureWidgetComponent, TemperatureSharedState);
```

The framework collects shared state on export and restores it before widgets are
instantiated on import — including for widget types that register later, such as
lazy-loaded ones. See the
[Widget Shared State Guide](docs/widget-shared-state-guide.md).

### Multiple Dashboards

```typescript
@Component({
  template: `
    <div class="dashboard-tabs">
      @for (config of dashboardConfigs; track config.dashboardId) {
        <button 
          [class.active]="activeDashboard() === config.dashboardId"
          (click)="switchDashboard(config.dashboardId)"
        >
          {{ config.dashboardId }}
        </button>
      }
    </div>
    
    <ngx-dashboard
      #dashboard
      [dashboardData]="dashboardConfigs[0]"
      [editMode]="editMode()"
    >
    </ngx-dashboard>
  `,
})
export class MultiDashboardComponent {
  private readonly dashboard = viewChild.required<NgxDashboardComponent>('dashboard');

  dashboardConfigs = [
    createEmptyDashboard('dashboard-1', 8, 12),
    createEmptyDashboard('dashboard-2', 6, 16),
    createEmptyDashboard('dashboard-3', 10, 10),
  ];

  activeDashboard = signal('dashboard-1');

  // Switching is imperative. Rebinding [dashboardData] would do nothing - the
  // input seeds the store once and is ignored afterwards.
  switchDashboard(dashboardId: string): void {
    // Keep the outgoing dashboard's edits before swapping it out
    const current = this.dashboard().exportDashboard();
    const index = this.dashboardConfigs.findIndex(
      (c) => c.dashboardId === this.activeDashboard()
    );
    this.dashboardConfigs[index] = current;

    const next = this.dashboardConfigs.find((c) => c.dashboardId === dashboardId)!;
    this.dashboard().loadDashboard(next);
    this.activeDashboard.set(dashboardId);
  }
}
```

Each `<ngx-dashboard>` instance owns one store, so several dashboards can also be
mounted side by side, each with its own `[dashboardData]`.

## Common Patterns

### Responsive Dashboard Layout

```scss
.dashboard-viewport-container {
  display: flex;
  height: 100vh;
  
  @media (max-width: 768px) {
    flex-direction: column;
    
    .widget-list {
      width: 100%;
      height: 200px;
      border-left: none;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }
  }
}
```

### Dashboard with Toolbar

```typescript
@Component({
  template: `
    <mat-toolbar color="primary">
      <span>My Dashboard App</span>
      <div class="spacer"></div>
      <button mat-icon-button (click)="toggleEditMode()">
        <mat-icon>{{ editMode() ? 'done' : 'edit' }}</mat-icon>
      </button>
    </mat-toolbar>
    
    <div class="dashboard-content">
      <ngx-dashboard
        [dashboardData]="dashboardConfig"
        [editMode]="editMode()"
        [reservedSpace]="{ top: 64, bottom: 0, left: 0, right: 0 }"
      >
      </ngx-dashboard>
    </div>
  `,
})
export class DashboardWithToolbarComponent {
  // Implementation...
}
```

### Widget State Validation

```typescript
export class MyWidgetComponent implements Widget {
  dashboardSetState(state?: unknown): void {
    // Validate and sanitize state
    if (!state || typeof state !== 'object') {
      this.state.set(this.getDefaultState());
      return;
    }

    const validatedState: MyWidgetState = {
      message: this.validateString((state as any).message) || 'Default Message',
      count: this.validateNumber((state as any).count) || 0,
      color: this.validateColor((state as any).color),
    };

    this.state.set(validatedState);
  }

  private validateString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  private validateNumber(value: unknown): number | undefined {
    return typeof value === 'number' && !isNaN(value) ? value : undefined;
  }

  private validateColor(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;
    // Basic hex color validation
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : undefined;
  }

  private getDefaultState(): MyWidgetState {
    return {
      message: 'Hello Dashboard!',
      count: 0,
    };
  }
}
```

## Troubleshooting

### Common Issues

**1. Widgets not appearing in widget list**
- Ensure widgets are registered in `app.config.ts` using `provideEnvironmentInitializer()`
- Verify widget metadata has unique `widgetTypeid`

**2. Rebinding `[dashboardData]` does nothing**
- Expected: the input seeds the store once, on the first non-null value, and is
  ignored afterwards so a re-emitting source cannot clobber a user's edits
- Swap dashboards with `dashboard().loadDashboard(data)` instead — see
  [Reactive Binding vs. loadDashboard](#reactive-binding-vs-loaddashboard)

**3. Styling issues**
- Ensure Angular Material theme is properly configured
- Use CSS custom properties for theming compatibility

**4. Widget state not persisting**
- Implement `dashboardGetState()` and `dashboardSetState()` methods
- Ensure state is serializable (no functions, DOM references, etc.)

**5. Layout problems**
- Configure `reservedSpace` to account for toolbars and UI elements
- Ensure container has proper height (e.g., `height: 100vh`)

### Performance Tips

- Use `OnPush` change detection strategy
- Minimize widget state updates
- Use computed signals for derived state
- Clean widgets up with `inject(DestroyRef).onDestroy(...)` — the pattern both
  libraries use in place of `ngOnDestroy`

### Debugging

```typescript
// Enable debug logging
constructor() {
  effect(() => {
    console.log('Dashboard state:', this.dashboard().exportDashboard());
  });
}
```

## Next Steps

- Explore the [demo application](./projects/demo) for complete implementation examples
- Check out advanced widget examples in the widgets library
- [Widget System Architecture](docs/widget-system-architecture.md) — registration, factories, and the widget lifecycle
- [Widget Shared State Guide](docs/widget-shared-state-guide.md) — configuration shared across every instance of a widget type
- [Provider System Architecture](docs/provider-system-architecture.md) — replacing the built-in dialogs
- [Empty Cell Context Provider](docs/empty-cell-context-provider.md) — right-click behaviour on empty cells
- Consider implementing custom persistence services for your backend
