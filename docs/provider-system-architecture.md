# Provider System Architecture

## Overview

The ngx-dashboard library implements an **extensible provider pattern** that enables consumers to customize dialog implementations and other UI concerns without modifying the library's core code. This architecture follows SOLID principles and provides maximum flexibility for enterprise applications.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Dialog Provider System](#dialog-provider-system)
- [Creating Custom Providers](#creating-custom-providers)
- [Persistence Provider Pattern](#persistence-provider-pattern)
- [Testing with Providers](#testing-with-providers)
- [Best Practices](#best-practices)
- [Migration Guide](#migration-guide)

## Core Concepts

### What is a Provider?

In ngx-dashboard, a provider is an abstracted service that:

- Defines a contract (interface/abstract class) for specific functionality
- Can be replaced or customized via Angular's dependency injection
- Enables framework-agnostic implementations
- Supports enterprise customization requirements

### Why Use Providers?

1. **Dependency Inversion**: High-level modules don't depend on low-level implementations
2. **Testability**: Easy to mock and test in isolation
3. **Flexibility**: Swap implementations without code changes
4. **Enterprise Ready**: Integrate with existing design systems and frameworks

## Dialog Provider System

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                      │
├─────────────────────────────────────────────────────────────┤
│  CellComponent                                              │
│    └─> inject(CELL_SETTINGS_DIALOG_PROVIDER)                │
│         └─> Uses abstract CellSettingsDialogProvider        │
├─────────────────────────────────────────────────────────────┤
│                     Provider Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Abstract: CellSettingsDialogProvider                       │
│    └─> Contract: openCellSettings(): Promise<...>           │
├─────────────────────────────────────────────────────────────┤
│                  Implementation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  DefaultCellSettingsDialogProvider (Angular Material)       │
│  CustomDialogProvider (Your Implementation)                 │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Abstract Provider Class

```typescript
// projects/ngx-dashboard/src/lib/providers/cell-settings-dialog/cell-settings-dialog.provider.ts
export abstract class CellSettingsDialogProvider {
  /**
   * Open a settings dialog for the given cell.
   * Returns a promise that resolves to the new settings, or undefined if cancelled.
   */
  abstract openCellSettings(data: CellDisplayData): Promise<CellDisplayData | undefined>;
}
```

#### 2. Injection Token

```typescript
// projects/ngx-dashboard/src/lib/providers/cell-settings-dialog/cell-settings-dialog.tokens.ts
export const CELL_SETTINGS_DIALOG_PROVIDER = new InjectionToken<CellSettingsDialogProvider>("CellSettingsDialogProvider", {
  providedIn: "root",
  factory: () => new DefaultCellSettingsDialogProvider(),
});
```

#### 3. Default Implementation

The library provides a Material Design implementation out of the box:

```typescript
@Injectable({ providedIn: "root" })
export class DefaultCellSettingsDialogProvider extends CellSettingsDialogProvider {
  private dialog = inject(MatDialog);

  async openCellSettings(data: CellDisplayData): Promise<CellDisplayData | undefined> {
    const dialogRef = this.dialog.open(CellSettingsDialogComponent, {
      data,
      width: "400px",
      maxWidth: "90vw",
      disableClose: false,
      autoFocus: false,
    });

    return await firstValueFrom(dialogRef.afterClosed());
  }
}
```

### Integration with Components

The CellComponent uses the provider seamlessly:

```typescript
export class CellComponent {
  readonly #dialogProvider = inject(CELL_SETTINGS_DIALOG_PROVIDER);

  async onSettings(): Promise<void> {
    const currentSettings: CellDisplayData = {
      id: CellIdUtils.toString(this.cellId()),
      flat: this.flat(),
    };

    try {
      const result = await this.#dialogProvider.openCellSettings(currentSettings);

      if (result) {
        this.settings.emit({
          id: this.widgetId(),
          flat: result.flat ?? false,
        });
      }
    } catch (error) {
      console.error("Error opening cell settings dialog:", error);
    }
  }
}
```

## Creating Custom Providers

### Example 1: Native Browser Dialog

```typescript
import { Injectable } from "@angular/core";
import { CellSettingsDialogProvider, CellDisplayData } from "@dragonworks/ngx-dashboard";

@Injectable()
export class NativeBrowserDialogProvider extends CellSettingsDialogProvider {
  async openCellSettings(data: CellDisplayData): Promise<CellDisplayData | undefined> {
    const message = `Current mode: ${data.flat ? "Flat" : "Normal"}\n` + "Switch to the other mode?";

    if (confirm(message)) {
      return {
        ...data,
        flat: !data.flat,
      };
    }

    return undefined;
  }
}
```

### Example 2: Custom UI Library Integration

```typescript
import { Injectable, inject } from "@angular/core";
import { CellSettingsDialogProvider, CellDisplayData } from "@dragonworks/ngx-dashboard";
import { NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CustomSettingsModalComponent } from "./custom-settings-modal.component";

@Injectable()
export class NgBootstrapDialogProvider extends CellSettingsDialogProvider {
  private modalService = inject(NgbModal);

  async openCellSettings(data: CellDisplayData): Promise<CellDisplayData | undefined> {
    const modalRef = this.modalService.open(CustomSettingsModalComponent, {
      centered: true,
      backdrop: "static",
    });

    modalRef.componentInstance.data = data;

    try {
      return await modalRef.result;
    } catch {
      // User cancelled
      return undefined;
    }
  }
}
```

### Example 3: Inline Editing Provider

```typescript
import { Injectable, inject } from "@angular/core";
import { CellSettingsDialogProvider, CellDisplayData } from "@dragonworks/ngx-dashboard";
import { Overlay, OverlayRef } from "@angular/cdk/overlay";
import { ComponentPortal } from "@angular/cdk/portal";

@Injectable()
export class InlineEditingProvider extends CellSettingsDialogProvider {
  private overlay = inject(Overlay);

  async openCellSettings(data: CellDisplayData): Promise<CellDisplayData | undefined> {
    // Create overlay positioned near the cell
    const overlayRef = this.createOverlay();
    const portal = new ComponentPortal(InlineSettingsComponent);
    const componentRef = overlayRef.attach(portal);

    componentRef.instance.data = data;

    return new Promise((resolve) => {
      componentRef.instance.save.subscribe((result: CellDisplayData) => {
        overlayRef.dispose();
        resolve(result);
      });

      componentRef.instance.cancel.subscribe(() => {
        overlayRef.dispose();
        resolve(undefined);
      });
    });
  }

  private createOverlay(): OverlayRef {
    const positionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();

    return this.overlay.create({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: "cdk-overlay-transparent-backdrop",
    });
  }
}
```

### Registering Custom Providers

#### Application-Wide Registration

```typescript
// app.config.ts
import { ApplicationConfig } from "@angular/core";
import { CELL_SETTINGS_DIALOG_PROVIDER } from "@dragonworks/ngx-dashboard";
import { CustomDialogProvider } from "./providers/custom-dialog.provider";

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: CELL_SETTINGS_DIALOG_PROVIDER,
      useClass: CustomDialogProvider,
    },
  ],
};
```

#### Component-Level Registration

```typescript
@Component({
  selector: "app-dashboard-page",
  template: `<ngx-dashboard-dashboard ...></ngx-dashboard-dashboard>`,
  providers: [
    {
      provide: CELL_SETTINGS_DIALOG_PROVIDER,
      useClass: CustomDialogProvider,
    },
  ],
})
export class DashboardPageComponent {}
```

#### Module-Level Registration

```typescript
@NgModule({
  imports: [DashboardModule],
  providers: [
    {
      provide: CELL_SETTINGS_DIALOG_PROVIDER,
      useClass: CustomDialogProvider,
    },
  ],
})
export class FeatureModule {}
```

## Persistence Provider Pattern

The demo application extends this pattern for persistence operations:

### Abstract Service

```typescript
export abstract class DashboardPersistenceService {
  abstract exportDashboard(data: DashboardDataDto, filename?: string): Promise<void>;
  abstract importDashboard(): Promise<DashboardDataDto | null>;
  abstract listDashboards?(): Promise<string[]>;
  abstract deleteDashboard?(identifier: string): Promise<void>;
}
```

### File-Based Implementation

```typescript
@Injectable({ providedIn: "root" })
export class FilePersistenceService extends DashboardPersistenceService {
  async exportDashboard(data: DashboardDataDto, filename = "dashboard.json"): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  async importDashboard(): Promise<DashboardDataDto | null> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";

      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          const text = await file.text();
          resolve(JSON.parse(text));
        } else {
          resolve(null);
        }
      };

      input.click();
    });
  }
}
```

### LocalStorage Implementation

```typescript
@Injectable({ providedIn: "root" })
export class LocalStoragePersistenceService extends DashboardPersistenceService {
  private readonly STORAGE_KEY = "dashboard-data";

  async exportDashboard(data: DashboardDataDto): Promise<void> {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  async importDashboard(): Promise<DashboardDataDto | null> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  async listDashboards(): Promise<string[]> {
    return Object.keys(localStorage).filter((key) => key.startsWith("dashboard-"));
  }

  async deleteDashboard(identifier: string): Promise<void> {
    localStorage.removeItem(identifier);
  }
}
```

## Testing with Providers

### Unit Testing

Providers make testing straightforward through dependency injection:

```typescript
describe("CellComponent", () => {
  let component: CellComponent;
  let mockDialogProvider: jasmine.SpyObj<CellSettingsDialogProvider>;

  beforeEach(() => {
    mockDialogProvider = jasmine.createSpyObj("CellSettingsDialogProvider", ["openCellSettings"]);

    TestBed.configureTestingModule({
      imports: [CellComponent],
      providers: [
        {
          provide: CELL_SETTINGS_DIALOG_PROVIDER,
          useValue: mockDialogProvider,
        },
      ],
    });

    component = TestBed.createComponent(CellComponent).componentInstance;
  });

  it("should handle settings dialog", async () => {
    const mockResult = { id: "cell-1", flat: true };
    mockDialogProvider.openCellSettings.and.returnValue(Promise.resolve(mockResult));

    await component.onSettings();

    expect(mockDialogProvider.openCellSettings).toHaveBeenCalled();
  });

  it("should handle dialog cancellation", async () => {
    mockDialogProvider.openCellSettings.and.returnValue(Promise.resolve(undefined));

    spyOn(component.settings, "emit");
    await component.onSettings();

    expect(component.settings.emit).not.toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
describe("Dashboard Integration", () => {
  let dashboardComponent: DashboardComponent;
  let customProvider: CustomDialogProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardModule],
      providers: [
        CustomDialogProvider,
        {
          provide: CELL_SETTINGS_DIALOG_PROVIDER,
          useExisting: CustomDialogProvider,
        },
      ],
    });

    dashboardComponent = TestBed.createComponent(DashboardComponent).componentInstance;
    customProvider = TestBed.inject(CustomDialogProvider);
  });

  it("should use custom dialog provider", async () => {
    spyOn(customProvider, "openCellSettings").and.callThrough();

    // Trigger settings dialog through user interaction
    const cellElement = fixture.debugElement.query(By.css(".cell"));
    cellElement.triggerEventHandler("contextmenu", new MouseEvent("contextmenu"));

    await fixture.whenStable();

    expect(customProvider.openCellSettings).toHaveBeenCalled();
  });
});
```

## Best Practices

### 1. Provider Design

- **Single Responsibility**: Each provider should handle one specific concern
- **Async by Default**: Use Promises/Observables for all operations
- **Error Handling**: Always handle errors gracefully
- **Type Safety**: Leverage TypeScript's type system fully

### 2. Implementation Guidelines

```typescript
@Injectable()
export class CustomProvider extends BaseProvider {
  // Inject dependencies in constructor or use inject()
  private readonly dependency = inject(SomeDependency);

  // Implement all abstract methods
  async operation(data: InputType): Promise<OutputType | undefined> {
    try {
      // Validate input
      if (!this.isValid(data)) {
        throw new Error('Invalid input data');
      }

      // Perform operation
      const result = await this.performOperation(data);

      // Return typed result
      return this.mapResult(result);
    } catch (error) {
      // Log errors for debugging
      console.error('Provider operation failed:', error);

      // Return undefined or rethrow based on requirements
      return undefined;
    }
  }

  // Add helper methods as private
  private isValid(data: InputType): boolean {
    return data != null && /* validation logic */;
  }
}
```

### 3. Configuration Patterns

#### Factory Pattern for Complex Providers

```typescript
export function createDialogProvider(config: DialogConfig): Provider {
  return {
    provide: CELL_SETTINGS_DIALOG_PROVIDER,
    useFactory: () => {
      switch (config.type) {
        case "material":
          return new MaterialDialogProvider(config.options);
        case "bootstrap":
          return new BootstrapDialogProvider(config.options);
        case "native":
          return new NativeDialogProvider();
        default:
          return new DefaultCellSettingsDialogProvider();
      }
    },
    deps: [
      /* any dependencies */
    ],
  };
}

// Usage in app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [createDialogProvider({ type: "bootstrap", options: { size: "lg" } })],
};
```

#### Environment-Based Providers

```typescript
import { environment } from "../environments/environment";

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: CELL_SETTINGS_DIALOG_PROVIDER,
      useClass: environment.production ? ProductionDialogProvider : DevelopmentDialogProvider,
    },
  ],
};
```

### 4. Documentation Requirements

When creating custom providers:

1. **Document the contract**: Clearly specify expected behavior
2. **Provide examples**: Show typical usage patterns
3. **List dependencies**: Note any required packages or services
4. **Include tests**: Demonstrate testing approaches
5. **Version compatibility**: Note compatible ngx-dashboard versions

## Migration Guide

### Migrating from Direct Service Usage

If you were previously using services directly:

#### Before (Tight Coupling)

```typescript
export class CellComponent {
  constructor(private dialog: MatDialog) {}

  openSettings() {
    const dialogRef = this.dialog.open(SettingsComponent, { data });
    // ...
  }
}
```

#### After (Provider Pattern)

```typescript
export class CellComponent {
  readonly #dialogProvider = inject(CELL_SETTINGS_DIALOG_PROVIDER);

  async openSettings() {
    const result = await this.#dialogProvider.openCellSettings(data);
    // ...
  }
}
```

### Creating Backward-Compatible Providers

To maintain compatibility while migrating:

```typescript
@Injectable()
export class LegacyCompatibleProvider extends CellSettingsDialogProvider {
  constructor(private legacyService: LegacyDialogService, @Optional() private newService?: ModernDialogService) {
    super();
  }

  async openCellSettings(data: CellDisplayData): Promise<CellDisplayData | undefined> {
    // Use new service if available, fallback to legacy
    if (this.newService) {
      return this.newService.openModernDialog(data);
    }

    // Adapter pattern for legacy service
    const legacyResult = await this.legacyService.showDialog({
      title: "Cell Settings",
      data: this.mapToLegacyFormat(data),
    });

    return this.mapFromLegacyFormat(legacyResult);
  }

  private mapToLegacyFormat(data: CellDisplayData): LegacyData {
    // Transform data for legacy service
  }

  private mapFromLegacyFormat(result: LegacyResult): CellDisplayData | undefined {
    // Transform legacy result to modern format
  }
}
```

## Advanced Scenarios

### Multi-Provider Configuration

Support multiple dialog types in the same application:

```typescript
// Token for each dialog type
export const CONFIRMATION_DIALOG_PROVIDER = new InjectionToken<DialogProvider>("Confirmation");
export const SETTINGS_DIALOG_PROVIDER = new InjectionToken<DialogProvider>("Settings");
export const WIZARD_DIALOG_PROVIDER = new InjectionToken<DialogProvider>("Wizard");

// Component using multiple providers
export class ComplexComponent {
  readonly #confirmDialog = inject(CONFIRMATION_DIALOG_PROVIDER);
  readonly #settingsDialog = inject(SETTINGS_DIALOG_PROVIDER);
  readonly #wizardDialog = inject(WIZARD_DIALOG_PROVIDER);

  async handleUserAction() {
    // Use appropriate provider for each scenario
    const confirmed = await this.#confirmDialog.open({ message: "Continue?" });
    if (confirmed) {
      const settings = await this.#settingsDialog.open({ current: this.settings });
      const wizardResult = await this.#wizardDialog.open({ steps: this.wizardSteps });
    }
  }
}
```

### State Management Integration

```typescript
@Injectable()
export class StoreIntegratedProvider extends CellSettingsDialogProvider {
  private store = inject(Store);
  private actions$ = inject(Actions);

  async openCellSettings(data: CellDisplayData): Promise<CellDisplayData | undefined> {
    // Dispatch action to open dialog
    this.store.dispatch(openSettingsDialog({ data }));

    // Wait for dialog result through store
    return firstValueFrom(
      this.actions$.pipe(
        ofType(settingsDialogClosed),
        take(1),
        map((action) => action.result)
      )
    );
  }
}
```

### Conditional Provider Loading

```typescript
export function provideDialogSystem(config?: DialogConfig): Provider[] {
  const providers: Provider[] = [];

  // Always provide default
  providers.push({
    provide: CELL_SETTINGS_DIALOG_PROVIDER,
    useClass: config?.customProvider || DefaultCellSettingsDialogProvider,
  });

  // Conditionally add related providers
  if (config?.enableAnalytics) {
    providers.push(DialogAnalyticsService);
  }

  if (config?.enableA11y) {
    providers.push(DialogAccessibilityService);
  }

  return providers;
}

// Usage
export const appConfig: ApplicationConfig = {
  providers: [
    ...provideDialogSystem({
      customProvider: EnterpriseDialogProvider,
      enableAnalytics: true,
      enableA11y: true,
    }),
  ],
};
```

## Summary

The provider pattern in ngx-dashboard offers:

- **Complete UI flexibility** - Use any dialog library or custom implementation
- **Enterprise-ready architecture** - Integrate with existing systems and workflows
- **Testability** - Easy mocking and isolation in tests
- **Type safety** - Full TypeScript support throughout
- **Graceful degradation** - Default implementations with override capability
- **SOLID principles** - Clean, maintainable, extensible code

This architecture ensures that ngx-dashboard can adapt to any application's requirements without forcing specific UI dependencies or patterns.
