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
npm install @angular/material @angular/cdk
```

### Angular Material Theme Setup

Add a Material Design theme to your `styles.scss`:

```scss
@use '@angular/material' as mat;

@include mat.core();

$primary: mat.define-palette(mat.$indigo-palette);
$accent: mat.define-palette(mat.$pink-palette, A200, A100, A400);
$warn: mat.define-palette(mat.$red-palette);

$theme: mat.define-light-theme((
  color: (
    primary: $primary,
    accent: $accent,
    warn: $warn,
  ),
  typography: mat.define-typography-config(),
  density: 0,
));

@include mat.all-component-themes($theme);
```

## Complete Setup

### 1. Application Configuration

Create or update your `app.config.ts`:

```typescript
import {
  ApplicationConfig,
  provideZoneChangeDetection,
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
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(), // Required for dashboard loading
    
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
   * Optional: Handle widget configuration/settings dialog
   */
  dashboardEditState?(): void {
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
  standalone: true,
  imports: [/* Material form components */],
  template: `
    <h2 mat-dialog-title>Widget Settings</h2>
    <div mat-dialog-content>
      <mat-form-field>
        <mat-label>Message</mat-label>
        <input matInput [(ngModel)]="localState().message">
      </mat-form-field>
      
      <mat-form-field>
        <mat-label>Background Color</mat-label>
        <input matInput type="color" [(ngModel)]="localState().color">
      </mat-form-field>
    </div>
    
    <div mat-dialog-actions>
      <button mat-button (click)="cancel()">Cancel</button>
      <button mat-button cdkFocusInitial (click)="save()">Save</button>
    </div>
  `,
})
export class MyWidgetSettingsDialog {
  private dialogRef = inject(MatDialogRef<MyWidgetSettingsDialog>);
  private data = inject<MyWidgetState>(MAT_DIALOG_DATA);

  localState = signal<MyWidgetState>({ ...this.data });

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.dialogRef.close(this.localState());
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

// Auto-save on changes
effect(() => {
  const data = this.dashboard().exportDashboard();
  saveToLocalStorage(data);
});
```

### HTTP-based Dashboard Loading

```typescript
import { httpResource } from '@angular/common/http';

// Load dashboard from HTTP endpoint
protected dashboardResource = httpResource<DashboardDataDto>({
  url: '/api/dashboards/my-dashboard'
});

constructor() {
  // Auto-load when resource resolves
  effect(() => {
    const dashboardData = this.dashboardResource.value();
    if (dashboardData) {
      this.dashboard().loadDashboard(dashboardData);
    }
  });
}
```

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
      [dashboardData]="currentConfig()"
      [editMode]="editMode()"
    >
    </ngx-dashboard>
  `,
})
export class MultiDashboardComponent {
  dashboardConfigs = [
    createEmptyDashboard('dashboard-1', 8, 12),
    createEmptyDashboard('dashboard-2', 6, 16),
    createEmptyDashboard('dashboard-3', 10, 10),
  ];

  activeDashboard = signal('dashboard-1');
  
  currentConfig = computed(() => 
    this.dashboardConfigs.find(c => c.dashboardId === this.activeDashboard())!
  );

  switchDashboard(dashboardId: string): void {
    this.activeDashboard.set(dashboardId);
  }
}
```

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

**2. Dashboard not responding to changes**
- Use ViewChild and imperative methods (`loadDashboard`, `exportDashboard`)
- Avoid reactive binding to dashboard data

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
- Implement proper widget cleanup in `ngOnDestroy`

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
- Review the [API documentation](./docs/api) for detailed component interfaces
- Consider implementing custom persistence services for your backend