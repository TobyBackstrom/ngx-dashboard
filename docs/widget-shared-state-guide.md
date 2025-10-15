# Widget Shared State Guide

## Overview

The Widget Shared State feature allows widget families (multiple instances of the same widget type) to share configuration across all instances. This is useful when you have multiple widgets of the same type that should maintain consistent settings, such as theme colors, default configurations, or global preferences.

## When to Use Shared State

Use shared state when:
- Multiple widget instances need to share the same configuration
- You want to avoid duplicating state across many widget instances
- Changes to one widget should affect all widgets of that type
- You need to persist global widget family settings

## Architecture

### Key Components

1. **WidgetSharedStateProvider** - Interface that defines how to get/set shared state
2. **DashboardService** - Manages registration of widgets and their shared state providers
3. **DashboardDataDto** - Extended to include optional `sharedStates` field
4. **Dashboard Store** - Handles collection and restoration of shared states during export/import

### Data Flow

```
Registration → Usage → Serialization → Deserialization
     ↓           ↓            ↓              ↓
  Provider    Inject     Collect        Restore
  Registered  Provider   State          State
```

## Implementation Guide

### Step 1: Create a Shared State Provider

Create a service that implements the `WidgetSharedStateProvider` interface:

```typescript
import { Injectable, signal } from '@angular/core';
import { WidgetSharedStateProvider } from '@dragonworks/ngx-dashboard';

export interface ParkingSpaceSharedConfig {
  color: string;
  pricePerHour: number;
  availabilityThreshold: number;
}

@Injectable({ providedIn: 'root' })
export class ParkingSpaceSharedState implements WidgetSharedStateProvider<ParkingSpaceSharedConfig> {
  private state = signal<ParkingSpaceSharedConfig>({
    color: '#4CAF50',
    pricePerHour: 5,
    availabilityThreshold: 0.8
  });

  // Required by WidgetSharedStateProvider interface
  getSharedState(): ParkingSpaceSharedConfig {
    return this.state();
  }

  // Required by WidgetSharedStateProvider interface
  setSharedState(state: ParkingSpaceSharedConfig): void {
    this.state.set(state);
  }

  // Public API for widget consumption
  readonly config = this.state.asReadonly();

  // Additional helper methods
  updateColor(color: string): void {
    this.state.update(s => ({ ...s, color }));
  }

  updatePricing(pricePerHour: number): void {
    this.state.update(s => ({ ...s, pricePerHour }));
  }
}
```

### Step 2: Create Your Widget Component

Your widget component should inject the shared state provider and use it:

```typescript
import { Component, signal, inject } from '@angular/core';
import { Widget, WidgetMetadata } from '@dragonworks/ngx-dashboard';
import { ParkingSpaceSharedState } from './parking-space-shared-state.service';

export interface ParkingSpaceInstanceState {
  label: string;
  spaceId: string;
  isOccupied: boolean;
}

@Component({
  selector: 'app-parking-space-widget',
  template: `
    <div [style.background-color]="sharedState.config().color">
      <h3>{{ instanceState().label }}</h3>
      <p>Space ID: {{ instanceState().spaceId }}</p>
      <p>Status: {{ instanceState().isOccupied ? 'Occupied' : 'Available' }}</p>
      <p>Rate: ${{ sharedState.config().pricePerHour }}/hour</p>
    </div>
  `
})
export class ParkingSpaceWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: '@app/parking-space',
    name: 'Parking Space',
    description: 'Displays parking space status',
    svgIcon: '<svg>...</svg>'
  };

  // Inject the shared state provider
  readonly sharedState = inject(ParkingSpaceSharedState);

  // Instance-specific state
  private instanceState = signal<ParkingSpaceInstanceState>({
    label: '',
    spaceId: '',
    isOccupied: false
  });

  // Standard Widget interface methods (instance state only)
  dashboardGetState(): ParkingSpaceInstanceState {
    return this.instanceState();
  }

  dashboardSetState(state?: unknown): void {
    if (state) {
      this.instanceState.set(state as ParkingSpaceInstanceState);
    }
  }

  dashboardEditState(): void {
    // Open configuration dialog
  }
}
```

### Step 3: Register Widget with Shared State Provider

In your app configuration, register both the widget and its shared state provider:

```typescript
import { ApplicationConfig, provideEnvironmentInitializer, inject } from '@angular/core';
import { DashboardService } from '@dragonworks/ngx-dashboard';
import { ParkingSpaceWidgetComponent } from './widgets/parking-space-widget.component';
import { ParkingSpaceSharedState } from './services/parking-space-shared-state.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideEnvironmentInitializer(() => {
      const dashboardService = inject(DashboardService);

      // Register widget with its shared state provider
      dashboardService.registerWidgetType(
        ParkingSpaceWidgetComponent,
        ParkingSpaceSharedState  // Pass the service class
      );

      // Widgets without shared state work as before
      dashboardService.registerWidgetType(OtherWidgetComponent);
    })
  ]
};
```

## Serialization Format

When a dashboard is exported, the shared states are included in a separate section:

```json
{
  "version": "1.0.0",
  "dashboardId": "parking-dashboard",
  "rows": 8,
  "columns": 12,
  "gutterSize": "0.5em",
  "cells": [
    {
      "row": 1,
      "col": 1,
      "rowSpan": 1,
      "colSpan": 1,
      "widgetTypeid": "@app/parking-space",
      "widgetState": { "label": "A1", "spaceId": "001", "isOccupied": false }
    },
    {
      "row": 1,
      "col": 2,
      "rowSpan": 1,
      "colSpan": 1,
      "widgetTypeid": "@app/parking-space",
      "widgetState": { "label": "A2", "spaceId": "002", "isOccupied": true }
    }
  ],
  "sharedStates": {
    "@app/parking-space": {
      "color": "#FF5722",
      "pricePerHour": 7.50,
      "availabilityThreshold": 0.75
    }
  }
}
```

## Deserialization Process

When loading a dashboard:

1. **Shared states are restored FIRST** - Before any widget instances are created
2. **Widget instances are created** - They automatically see the restored shared state
3. **Instance states are applied** - Each widget gets its unique state

This ensures that when widgets are instantiated, the shared state is already available.

## Best Practices

### 1. Use Signals for Reactive Updates

```typescript
@Injectable({ providedIn: 'root' })
export class MyWidgetSharedState implements WidgetSharedStateProvider<MyConfig> {
  private state = signal<MyConfig>(defaultConfig);
  readonly config = this.state.asReadonly(); // Expose as readonly

  getSharedState(): MyConfig {
    return this.state();
  }

  setSharedState(state: MyConfig): void {
    this.state.set(state);
  }
}
```

### 2. Separate Instance and Shared State

Keep instance-specific data separate from shared configuration:

```typescript
// ✅ Good: Clear separation
interface InstanceState {
  id: string;
  label: string;
  value: number;
}

interface SharedState {
  theme: string;
  units: string;
  precision: number;
}

// ❌ Bad: Mixed concerns
interface MixedState {
  id: string;          // Instance-specific
  label: string;       // Instance-specific
  theme: string;       // Should be shared
  units: string;       // Should be shared
}
```

### 3. Provide Defaults

Always provide sensible defaults in your shared state provider:

```typescript
private state = signal<Config>({
  color: '#4CAF50',      // Default color
  fontSize: 14,          // Default font size
  autoRefresh: true      // Default behavior
});
```

### 4. Type Safety

Use TypeScript generics for type-safe shared state:

```typescript
export class MySharedState implements WidgetSharedStateProvider<MyConfig> {
  // TypeScript ensures getSharedState returns MyConfig
  // and setSharedState accepts MyConfig
}
```

### 5. Optional Shared State

Not all widgets need shared state. The second parameter to `registerWidgetType` is optional:

```typescript
// Widget with shared state
dashboardService.registerWidgetType(WidgetA, SharedStateA);

// Widget without shared state (works as before)
dashboardService.registerWidgetType(WidgetB);
```

## Advanced Scenarios

### Multiple Shared State Providers

Each widget type can have its own shared state provider:

```typescript
dashboardService.registerWidgetType(ParkingSpaceWidget, ParkingSpaceSharedState);
dashboardService.registerWidgetType(TemperatureWidget, TemperatureSharedState);
dashboardService.registerWidgetType(ChartWidget, ChartSharedState);
```

### Shared State Updates

Update shared state through the provider's methods. All widgets will see the change:

```typescript
// In a settings dialog or toolbar
updateTheme(newColor: string): void {
  const sharedState = inject(ParkingSpaceSharedState);
  sharedState.updateColor(newColor);
  // All ParkingSpace widgets automatically update via signal reactivity
}
```

### Cross-Widget Communication

Shared state providers can be used for cross-widget communication within a widget family:

```typescript
@Injectable({ providedIn: 'root' })
export class WidgetGroupSharedState implements WidgetSharedStateProvider<GroupConfig> {
  private state = signal<GroupConfig>({ selectedId: null });
  readonly config = this.state.asReadonly();

  selectWidget(id: string): void {
    this.state.update(s => ({ ...s, selectedId: id }));
  }

  // Framework methods
  getSharedState() { return this.state(); }
  setSharedState(state: GroupConfig) { this.state.set(state); }
}
```

## API Reference

### WidgetSharedStateProvider<T>

Interface for providing shared state across widget instances.

```typescript
interface WidgetSharedStateProvider<T = unknown> {
  getSharedState(): T | undefined;
  setSharedState(state: T): void;
}
```

### DashboardService.registerWidgetType()

Register a widget type with optional shared state provider.

```typescript
registerWidgetType<T = unknown>(
  widget: WidgetComponentClass,
  sharedStateProvider?: WidgetSharedStateProvider<T> | Type<WidgetSharedStateProvider<T>>
): void
```

**Parameters:**
- `widget` - The widget component class with static metadata
- `sharedStateProvider` - (Optional) Shared state provider service or instance

### DashboardDataDto

Extended to include optional shared states field.

```typescript
interface DashboardDataDto {
  version: string;
  dashboardId: string;
  rows: number;
  columns: number;
  gutterSize: string;
  cells: CellDataDto[];
  sharedStates?: Record<string, unknown>;  // NEW: Widget family shared states
}
```

## Troubleshooting

### Shared State Not Persisting

**Problem:** Shared state changes aren't saved when exporting the dashboard.

**Solution:** Ensure your provider implements both `getSharedState()` and `setSharedState()` correctly:

```typescript
getSharedState() {
  return this.state();  // Return the current state
}
```

### Widget Doesn't See Shared State Updates

**Problem:** Widget doesn't react to shared state changes.

**Solution:** Use signals and computed values in your template:

```typescript
// In widget component
readonly config = this.sharedState.config;  // Signal

// In template
<div [style.color]="config().theme">...</div>
```

### Type Errors During Registration

**Problem:** TypeScript errors when registering widget with shared state.

**Solution:** Ensure your provider implements the interface with correct generic type:

```typescript
export class MySharedState implements WidgetSharedStateProvider<MyConfig> {
  // Must return MyConfig
  getSharedState(): MyConfig { ... }
  // Must accept MyConfig
  setSharedState(state: MyConfig): void { ... }
}
```

## Migration Guide

If you have existing widgets and want to add shared state:

1. **Create shared state provider** - Implement `WidgetSharedStateProvider`
2. **Update widget registration** - Add provider as second parameter
3. **Inject provider in widget** - Use `inject()` to get the provider
4. **Move shared config** - Move shared properties from instance state to shared state
5. **Test serialization** - Ensure export/import works correctly

Existing dashboards without shared states will continue to work. The `sharedStates` field is optional and only included when widgets have registered providers.

## Conclusion

The Widget Shared State feature provides a clean, type-safe way to manage configuration that should be consistent across all instances of a widget type. By separating instance state from shared state, you can build more maintainable and efficient dashboards.