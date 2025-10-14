# Empty Cell Context Menu Provider

## Overview

The ngx-dashboard library provides an extensible provider system for handling right-click context menu events on empty dashboard cells. This allows applications to customize the behavior when users right-click on unoccupied grid spaces, enabling features like quick widget addition, grid operations, or custom context menus.

## Table of Contents

- [Default Behavior](#default-behavior)
- [User Experience Flow](#user-experience-flow)
- [Provider Architecture](#provider-architecture)
- [Implementation Guide](#implementation-guide)
  - [Basic Custom Provider](#basic-custom-provider)
  - [Material Menu Integration](#material-menu-integration)
  - [CDK Overlay Implementation](#cdk-overlay-implementation)
  - [Native Context Menu](#native-context-menu)
- [Provider Context Data](#provider-context-data)
- [Best Practices](#best-practices)
- [Testing Your Provider](#testing-your-provider)
- [Troubleshooting](#troubleshooting)

## Default Behavior

By default, when the dashboard is in **edit mode** and a user right-clicks on an empty cell:

1. **Browser context menu is prevented** - The native browser menu does not appear
2. **No visual feedback** - No menu or dialog opens
3. **Silent operation** - The click is acknowledged but no action is taken

This default behavior is implemented by the `DefaultEmptyCellContextProvider`:

```typescript
@Injectable({ providedIn: 'root' })
export class DefaultEmptyCellContextProvider extends EmptyCellContextProvider {
  handleEmptyCellContext(): void {
    // Default behavior: do nothing
    // Browser menu prevention is handled by the component
  }
}
```

### Important Notes:
- **Edit mode only** - Context menu handling is ONLY active when `editMode` is true
- **View mode** - In view mode, right-clicks are not intercepted (browser menu appears normally)
- **Occupied cells** - Cells containing widgets use their own context menu system

## User Experience Flow

### Scenario 1: Right-Click Empty Cell (Default Provider)
```
User Action: Right-click empty cell in edit mode
Result: Browser menu prevented, no visual feedback
```

### Scenario 2: Widget Menu Open → Right-Click Empty Cell
```
User Action: Right-click widget (menu opens)
User Action: Right-click empty cell without closing menu
Result: Widget menu closes, browser menu prevented
User Action: Right-click empty cell again
Result: Custom provider executes (if configured)
```

This two-click pattern follows standard UX conventions used by VS Code, Windows Explorer, and other applications. When any context menu is open, clicking elsewhere closes it first.

## Provider Architecture

### Abstract Base Class

```typescript
export interface EmptyCellContext {
  row: number;        // Grid row (1-based)
  col: number;        // Grid column (1-based)
  totalRows: number;  // Total grid rows
  totalColumns: number; // Total grid columns
  gutterSize: string; // CSS gutter size (e.g., '0.5em')
}

export abstract class EmptyCellContextProvider {
  abstract handleEmptyCellContext(
    event: MouseEvent,
    context: EmptyCellContext
  ): void;
}
```

### Injection Token

```typescript
export const EMPTY_CELL_CONTEXT_PROVIDER =
  new InjectionToken<EmptyCellContextProvider>('EmptyCellContextProvider', {
    providedIn: 'root',
    factory: () => new DefaultEmptyCellContextProvider(),
  });
```

## Implementation Guide

### Basic Custom Provider

Here's a simple provider that shows an alert when empty cells are right-clicked:

```typescript
import { Injectable } from '@angular/core';
import { EmptyCellContextProvider, EmptyCellContext } from 'ngx-dashboard';

@Injectable()
export class AlertEmptyCellProvider extends EmptyCellContextProvider {
  handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
    alert(`Empty cell clicked at position (${context.row}, ${context.col})`);
  }
}

// In your app.config.ts or module
export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: EMPTY_CELL_CONTEXT_PROVIDER,
      useClass: AlertEmptyCellProvider
    }
  ]
};
```

### Material Menu Integration

A complete implementation using Angular Material's MatMenu for a context menu:

```typescript
import { Injectable, ApplicationRef, createComponent, EnvironmentInjector } from '@angular/core';
import { EmptyCellContextProvider, EmptyCellContext } from 'ngx-dashboard';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';

@Injectable()
export class MaterialMenuEmptyCellProvider extends EmptyCellContextProvider {
  constructor(
    private appRef: ApplicationRef,
    private injector: EnvironmentInjector
  ) {
    super();
  }

  handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
    // Create menu component dynamically
    const menuComponent = createComponent(EmptyCellMenuComponent, {
      environmentInjector: this.injector,
      hostElement: document.body
    });

    // Pass context data
    menuComponent.instance.context = context;
    menuComponent.instance.x = event.clientX;
    menuComponent.instance.y = event.clientY;

    // Attach to Angular application
    this.appRef.attachView(menuComponent.hostView);

    // Open menu after view is ready
    menuComponent.changeDetectorRef.detectChanges();
    setTimeout(() => {
      menuComponent.instance.openMenu();
    });

    // Clean up when menu closes
    menuComponent.instance.menuClosed.subscribe(() => {
      this.appRef.detachView(menuComponent.hostView);
      menuComponent.destroy();
    });
  }
}

// Menu component
@Component({
  selector: 'app-empty-cell-menu',
  standalone: true,
  imports: [MatMenuModule, MatIconModule, MatButtonModule],
  template: `
    <div [style.position]="'fixed'"
         [style.left.px]="x"
         [style.top.px]="y"
         style="width: 1px; height: 1px; opacity: 0;">
      <button mat-button
              #menuTrigger="matMenuTrigger"
              [matMenuTriggerFor]="contextMenu">
      </button>
    </div>

    <mat-menu #contextMenu="matMenu">
      <button mat-menu-item (click)="addWidget('label')">
        <mat-icon>text_fields</mat-icon>
        <span>Add Label Widget</span>
      </button>
      <button mat-menu-item (click)="addWidget('clock')">
        <mat-icon>schedule</mat-icon>
        <span>Add Clock Widget</span>
      </button>
      <button mat-menu-item (click)="addWidget('gauge')">
        <mat-icon>speed</mat-icon>
        <span>Add Gauge Widget</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="configureGrid()">
        <mat-icon>grid_on</mat-icon>
        <span>Grid Settings</span>
      </button>
      <button mat-menu-item disabled>
        <span>Position: ({{context.row}}, {{context.col}})</span>
      </button>
    </mat-menu>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyCellMenuComponent {
  @ViewChild('menuTrigger', { read: MatMenuTrigger })
  menuTrigger!: MatMenuTrigger;

  context!: EmptyCellContext;
  x = 0;
  y = 0;

  menuClosed = new EventEmitter<void>();

  constructor(
    private dashboardService: DashboardService,
    private dashboardStore: DashboardStore
  ) {}

  ngAfterViewInit() {
    this.menuTrigger.menuClosed.subscribe(() => {
      this.menuClosed.emit();
    });
  }

  openMenu() {
    this.menuTrigger.openMenu();
  }

  addWidget(type: string) {
    // Create widget at the clicked position
    const factory = this.dashboardService.getFactory(type);
    if (factory) {
      this.dashboardStore.createWidget(
        factory,
        this.context.row,
        this.context.col,
        1, // rowSpan
        1  // colSpan
      );
    }
  }

  configureGrid() {
    // Open grid configuration dialog
    console.log('Opening grid settings...');
  }
}
```

### CDK Overlay Implementation

Using Angular CDK Overlay for more control over positioning:

```typescript
import { Injectable } from '@angular/core';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { EmptyCellContextProvider, EmptyCellContext } from 'ngx-dashboard';

@Injectable()
export class CdkOverlayEmptyCellProvider extends EmptyCellContextProvider {
  private overlayRef: OverlayRef | null = null;

  constructor(private overlay: Overlay) {
    super();
  }

  handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
    // Close existing overlay if open
    this.closeOverlay();

    // Configure overlay position
    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({ x: event.clientX, y: event.clientY })
      .withPositions([
        {
          originX: 'start',
          originY: 'top',
          overlayX: 'start',
          overlayY: 'top',
        }
      ]);

    // Create overlay
    const overlayConfig = new OverlayConfig({
      positionStrategy,
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop'
    });

    this.overlayRef = this.overlay.create(overlayConfig);

    // Create component portal
    const portal = new ComponentPortal(EmptyCellOverlayComponent);
    const componentRef = this.overlayRef.attach(portal);

    // Pass context to component
    componentRef.instance.context = context;
    componentRef.instance.close.subscribe(() => this.closeOverlay());

    // Close on backdrop click
    this.overlayRef.backdropClick().subscribe(() => this.closeOverlay());

    // Close on escape key
    this.overlayRef.keydownEvents().subscribe(event => {
      if (event.key === 'Escape') {
        this.closeOverlay();
      }
    });
  }

  private closeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
  }
}

// Overlay component
@Component({
  selector: 'app-empty-cell-overlay',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="empty-cell-menu" @slideIn>
      <h3>Quick Actions</h3>
      <div class="grid-info">
        Position: ({{context.row}}, {{context.col}})<br>
        Grid: {{context.totalRows}}×{{context.totalColumns}}
      </div>

      <div class="actions">
        <button mat-raised-button color="primary" (click)="addWidget()">
          <mat-icon>add</mat-icon>
          Add Widget Here
        </button>

        <button mat-stroked-button (click)="selectArea()">
          <mat-icon>crop_free</mat-icon>
          Select Area
        </button>

        <button mat-stroked-button (click)="close.emit()">
          <mat-icon>close</mat-icon>
          Cancel
        </button>
      </div>
    </div>
  `,
  styles: [`
    .empty-cell-menu {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      min-width: 200px;
    }

    .grid-info {
      font-size: 12px;
      color: #666;
      margin: 8px 0;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class EmptyCellOverlayComponent {
  @Input() context!: EmptyCellContext;
  @Output() close = new EventEmitter<void>();

  addWidget() {
    console.log('Adding widget at', this.context.row, this.context.col);
    this.close.emit();
  }

  selectArea() {
    console.log('Starting area selection from', this.context.row, this.context.col);
    this.close.emit();
  }
}
```

### Native Context Menu

For applications that want to show a custom browser-native context menu:

```typescript
import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { EmptyCellContextProvider, EmptyCellContext } from 'ngx-dashboard';

@Injectable()
export class NativeMenuEmptyCellProvider extends EmptyCellContextProvider {
  private renderer: Renderer2;
  private menuElement: HTMLElement | null = null;

  constructor(rendererFactory: RendererFactory2) {
    super();
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
    // Clean up existing menu
    this.removeMenu();

    // Create custom context menu
    this.menuElement = this.renderer.createElement('div');
    this.renderer.addClass(this.menuElement, 'custom-context-menu');
    this.renderer.setStyle(this.menuElement, 'position', 'fixed');
    this.renderer.setStyle(this.menuElement, 'left', `${event.clientX}px`);
    this.renderer.setStyle(this.menuElement, 'top', `${event.clientY}px`);
    this.renderer.setStyle(this.menuElement, 'z-index', '10000');

    // Create menu items
    const items = [
      { label: 'Add Widget', icon: '➕', action: () => this.handleAddWidget(context) },
      { label: 'Paste', icon: '📋', action: () => this.handlePaste(context) },
      { label: 'Grid Settings', icon: '⚙️', action: () => this.handleGridSettings() },
      { divider: true },
      { label: `Position: (${context.row}, ${context.col})`, disabled: true }
    ];

    items.forEach(item => {
      if (item.divider) {
        const divider = this.renderer.createElement('hr');
        this.renderer.addClass(divider, 'menu-divider');
        this.renderer.appendChild(this.menuElement!, divider);
      } else {
        const menuItem = this.renderer.createElement('div');
        this.renderer.addClass(menuItem, 'menu-item');
        if (item.disabled) {
          this.renderer.addClass(menuItem, 'disabled');
        }

        const text = this.renderer.createText(
          item.icon ? `${item.icon} ${item.label}` : item.label
        );
        this.renderer.appendChild(menuItem, text);

        if (item.action && !item.disabled) {
          this.renderer.listen(menuItem, 'click', () => {
            item.action!();
            this.removeMenu();
          });
        }

        this.renderer.appendChild(this.menuElement!, menuItem);
      }
    });

    // Add menu to document
    this.renderer.appendChild(document.body, this.menuElement);

    // Close menu on outside click or escape
    const removeListeners: (() => void)[] = [];

    const clickOutside = this.renderer.listen('document', 'click', (e: MouseEvent) => {
      if (!this.menuElement?.contains(e.target as Node)) {
        this.removeMenu();
      }
    });
    removeListeners.push(clickOutside);

    const escapeKey = this.renderer.listen('document', 'keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.removeMenu();
      }
    });
    removeListeners.push(escapeKey);

    // Store cleanup functions
    (this.menuElement as any).__removeListeners = removeListeners;
  }

  private removeMenu(): void {
    if (this.menuElement) {
      // Clean up event listeners
      const removeListeners = (this.menuElement as any).__removeListeners;
      if (removeListeners) {
        removeListeners.forEach((fn: () => void) => fn());
      }

      // Remove from DOM
      this.renderer.removeChild(document.body, this.menuElement);
      this.menuElement = null;
    }
  }

  private handleAddWidget(context: EmptyCellContext): void {
    console.log('Add widget at', context.row, context.col);
  }

  private handlePaste(context: EmptyCellContext): void {
    console.log('Paste at', context.row, context.col);
  }

  private handleGridSettings(): void {
    console.log('Open grid settings');
  }
}
```

Add these styles to your global styles:

```css
.custom-context-menu {
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.15);
  padding: 4px 0;
  min-width: 150px;
  font-size: 14px;
}

.custom-context-menu .menu-item {
  padding: 8px 16px;
  cursor: pointer;
  user-select: none;
}

.custom-context-menu .menu-item:hover:not(.disabled) {
  background-color: #f0f0f0;
}

.custom-context-menu .menu-item.disabled {
  color: #999;
  cursor: default;
}

.custom-context-menu .menu-divider {
  margin: 4px 0;
  border: none;
  border-top: 1px solid #e0e0e0;
}
```

## Provider Context Data

The `EmptyCellContext` interface provides comprehensive information about the clicked position:

```typescript
interface EmptyCellContext {
  row: number;        // Current cell row (1-based indexing)
  col: number;        // Current cell column (1-based indexing)
  totalRows: number;  // Total number of rows in the grid
  totalColumns: number; // Total number of columns in the grid
  gutterSize: string; // CSS gutter size (e.g., '0.5em', '10px')
}
```

### Usage Examples:

```typescript
handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
  // Check if clicked near grid edges
  const isEdgeCell = context.row === 1 ||
                     context.row === context.totalRows ||
                     context.col === 1 ||
                     context.col === context.totalColumns;

  // Calculate available space for a widget
  const availableRows = context.totalRows - context.row + 1;
  const availableColumns = context.totalColumns - context.col + 1;

  // Convert gutter size for calculations
  const gutterPixels = this.parseGutterSize(context.gutterSize);

  if (isEdgeCell) {
    this.showEdgeMenu(event, context);
  } else {
    this.showStandardMenu(event, context, availableRows, availableColumns);
  }
}
```

## Best Practices

### 1. Always Check Edit Mode

While the provider is only called in edit mode, it's good practice to verify:

```typescript
handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
  // Additional safety check (optional)
  if (!this.dashboardStore.editMode()) {
    return;
  }

  // Your implementation
}
```

### 2. Clean Up Resources

Always clean up dynamically created elements and event listeners:

```typescript
private activeMenu: ComponentRef<any> | null = null;

handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
  // Clean up previous menu
  this.cleanup();

  // Create new menu
  this.activeMenu = this.createMenu(event, context);
}

ngOnDestroy(): void {
  this.cleanup();
}

private cleanup(): void {
  if (this.activeMenu) {
    this.activeMenu.destroy();
    this.activeMenu = null;
  }
}
```

### 3. Handle Rapid Clicks

Users might right-click multiple times quickly:

```typescript
private debounceTimer: any;

handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
  clearTimeout(this.debounceTimer);

  this.debounceTimer = setTimeout(() => {
    this.showMenu(event, context);
  }, 50); // Small delay to handle rapid clicks
}
```

### 4. Accessibility

Ensure your custom menus are accessible:

```typescript
template: `
  <div role="menu"
       [attr.aria-label]="'Context menu for empty cell at row ' + context.row + ', column ' + context.col">
    <button role="menuitem"
            [attr.aria-disabled]="item.disabled"
            (click)="executeAction(item)">
      {{ item.label }}
    </button>
  </div>
`
```

### 5. Respect Dashboard State

Check if operations are valid before offering them:

```typescript
handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
  const menuItems = [];

  // Only offer "Add Widget" if there's space
  const hasSpace = this.checkAvailableSpace(context);
  if (hasSpace) {
    menuItems.push({ label: 'Add Widget', action: () => this.addWidget(context) });
  }

  // Only offer "Paste" if there's something to paste
  if (this.clipboard.hasContent()) {
    menuItems.push({ label: 'Paste', action: () => this.paste(context) });
  }

  this.showMenu(event, menuItems);
}
```

## Testing Your Provider

### Unit Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { EmptyCellContext } from 'ngx-dashboard';
import { CustomEmptyCellProvider } from './custom-empty-cell-provider';

describe('CustomEmptyCellProvider', () => {
  let provider: CustomEmptyCellProvider;
  let mockContext: EmptyCellContext;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomEmptyCellProvider]
    });

    provider = TestBed.inject(CustomEmptyCellProvider);
    mockContext = {
      row: 3,
      col: 4,
      totalRows: 8,
      totalColumns: 16,
      gutterSize: '0.5em'
    };
  });

  it('should handle context menu event', () => {
    const event = new MouseEvent('contextmenu', {
      clientX: 100,
      clientY: 200
    });

    spyOn(provider, 'showMenu');

    provider.handleEmptyCellContext(event, mockContext);

    expect(provider.showMenu).toHaveBeenCalledWith(event, mockContext);
  });

  it('should clean up resources on destroy', () => {
    // Create a menu
    const event = new MouseEvent('contextmenu');
    provider.handleEmptyCellContext(event, mockContext);

    // Verify cleanup
    spyOn(provider as any, 'cleanup');
    provider.ngOnDestroy();

    expect(provider['cleanup']).toHaveBeenCalled();
  });

  it('should handle rapid successive clicks', fakeAsync(() => {
    const event1 = new MouseEvent('contextmenu');
    const event2 = new MouseEvent('contextmenu');

    spyOn(provider, 'showMenu');

    provider.handleEmptyCellContext(event1, mockContext);
    provider.handleEmptyCellContext(event2, mockContext);

    tick(100);

    // Should only show menu once for the last click
    expect(provider.showMenu).toHaveBeenCalledTimes(1);
    expect(provider.showMenu).toHaveBeenCalledWith(event2, mockContext);
  }));
});
```

### Integration Testing

```typescript
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent, EMPTY_CELL_CONTEXT_PROVIDER } from 'ngx-dashboard';
import { CustomEmptyCellProvider } from './custom-empty-cell-provider';

@Component({
  template: `
    <ngx-dashboard
      [editMode]="true"
      [rows]="8"
      [columns]="16">
    </ngx-dashboard>
  `
})
class TestHostComponent {}

describe('Empty Cell Context Integration', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let provider: CustomEmptyCellProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardComponent],
      declarations: [TestHostComponent],
      providers: [
        {
          provide: EMPTY_CELL_CONTEXT_PROVIDER,
          useClass: CustomEmptyCellProvider
        }
      ]
    });

    fixture = TestBed.createComponent(TestHostComponent);
    provider = TestBed.inject(EMPTY_CELL_CONTEXT_PROVIDER) as CustomEmptyCellProvider;
    fixture.detectChanges();
  });

  it('should trigger custom provider on empty cell right-click', () => {
    spyOn(provider, 'handleEmptyCellContext');

    // Find an empty drop-zone element
    const dropZone = fixture.nativeElement.querySelector('.drop-zone');
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 100,
      clientY: 200
    });

    dropZone.dispatchEvent(event);

    expect(provider.handleEmptyCellContext).toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(true);
  });
});
```

## Troubleshooting

### Menu Not Appearing

**Problem:** Custom provider is registered but menu doesn't appear.

**Solutions:**
1. Verify the dashboard is in edit mode: `[editMode]="true"`
2. Check that you're clicking on empty cells, not widgets
3. Ensure provider is properly registered in app config
4. Check browser console for errors

### Browser Context Menu Still Appears

**Problem:** Native browser menu shows despite custom provider.

**Cause:** The component already prevents default behavior. If you're seeing the browser menu, the event might not be reaching the drop-zone component.

**Solutions:**
1. Check if another element is capturing the event
2. Verify no other event handlers are interfering
3. Ensure the dashboard is in edit mode

### Menu Appears in Wrong Position

**Problem:** Context menu appears offset from mouse position.

**Solutions:**
```typescript
// Use clientX/clientY for viewport-relative positioning
const x = event.clientX;
const y = event.clientY;

// Account for page scroll if using absolute positioning
const x = event.pageX;
const y = event.pageY;

// For fixed positioning (recommended)
element.style.position = 'fixed';
element.style.left = `${event.clientX}px`;
element.style.top = `${event.clientY}px`;
```

### Multiple Menus Appearing

**Problem:** Multiple context menus stack on top of each other.

**Solution:** Always clean up previous menus:
```typescript
private activeMenu: any;

handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
  // Clean up previous menu
  if (this.activeMenu) {
    this.activeMenu.close();
    this.activeMenu = null;
  }

  // Create new menu
  this.activeMenu = this.createMenu(event, context);
}
```

### Widget Menu Conflicts

**Problem:** Widget context menu interferes with empty cell menu.

**Understanding the Flow:**
1. When a widget menu is open and you right-click an empty cell:
   - The widget menu closes automatically
   - The browser menu is prevented
   - You need to right-click again to trigger the empty cell provider

This is intentional behavior following standard UX patterns. If you need different behavior, consider using a global context menu manager that coordinates between widget and empty cell menus.

## Advanced Scenarios

### Coordinating with Widget Menus

```typescript
@Injectable()
export class CoordinatedMenuProvider extends EmptyCellContextProvider {
  constructor(
    private cellMenuService: CellContextMenuService
  ) {
    super();
  }

  handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
    // Check if a widget menu is currently open
    if (this.cellMenuService.activeMenu()) {
      // Widget menu will auto-close, don't show empty cell menu
      // User will need to click again
      return;
    }

    // Show empty cell menu
    this.showEmptyContextMenu(event, context);
  }
}
```

### State-Aware Menus

```typescript
@Injectable()
export class StateAwareMenuProvider extends EmptyCellContextProvider {
  constructor(
    private dashboardStore: DashboardStore,
    private clipboardService: ClipboardService
  ) {
    super();
  }

  handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
    const menuItems = this.buildContextMenuItems(context);

    if (menuItems.length === 0) {
      // No valid actions available
      this.showTooltip('No actions available at this position');
      return;
    }

    this.showMenu(event, menuItems);
  }

  private buildContextMenuItems(context: EmptyCellContext): MenuItem[] {
    const items: MenuItem[] = [];

    // Check if position is available for widget placement
    const isOccupied = this.checkCellOccupancy(context.row, context.col);
    if (!isOccupied) {
      items.push({
        label: 'Add Widget',
        icon: 'add',
        action: () => this.addWidget(context)
      });
    }

    // Add paste option if clipboard has content
    if (this.clipboardService.hasWidget()) {
      const widgetData = this.clipboardService.getWidget();
      const canPaste = this.canPasteWidget(widgetData, context);

      items.push({
        label: 'Paste Widget',
        icon: 'content_paste',
        disabled: !canPaste,
        action: () => this.pasteWidget(context)
      });
    }

    // Add grid operations
    items.push(
      { divider: true },
      {
        label: 'Select Area',
        icon: 'crop_free',
        action: () => this.startAreaSelection(context)
      },
      {
        label: 'Fill Empty Cells',
        icon: 'grid_on',
        action: () => this.fillEmptyCells(context)
      }
    );

    return items;
  }
}
```

### Keyboard Navigation Support

```typescript
@Injectable()
export class AccessibleMenuProvider extends EmptyCellContextProvider {
  private menuComponent: ComponentRef<ContextMenuComponent> | null = null;

  handleEmptyCellContext(event: MouseEvent, context: EmptyCellContext): void {
    this.createAccessibleMenu(event, context);
  }

  private createAccessibleMenu(event: MouseEvent, context: EmptyCellContext): void {
    // Create menu with keyboard support
    this.menuComponent = this.createComponent(ContextMenuComponent, {
      inputs: {
        x: event.clientX,
        y: event.clientY,
        context: context,
        items: this.getMenuItems(context)
      }
    });

    // Set up keyboard navigation
    const menuElement = this.menuComponent.location.nativeElement;
    menuElement.focus();

    this.renderer.listen(menuElement, 'keydown', (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowDown':
          this.focusNextItem();
          e.preventDefault();
          break;
        case 'ArrowUp':
          this.focusPreviousItem();
          e.preventDefault();
          break;
        case 'Enter':
        case ' ':
          this.activateCurrentItem();
          e.preventDefault();
          break;
        case 'Escape':
          this.closeMenu();
          e.preventDefault();
          break;
      }
    });
  }

  private focusNextItem(): void {
    // Implementation for focusing next menu item
  }

  private focusPreviousItem(): void {
    // Implementation for focusing previous menu item
  }

  private activateCurrentItem(): void {
    // Implementation for activating focused menu item
  }

  private closeMenu(): void {
    if (this.menuComponent) {
      this.menuComponent.destroy();
      this.menuComponent = null;
    }
  }
}
```

## Summary

The Empty Cell Context Provider system offers complete flexibility for customizing right-click behavior on empty dashboard cells. Whether you need simple actions, complex menus, or coordinated multi-component interactions, the provider pattern enables clean, maintainable implementations that integrate seamlessly with the ngx-dashboard library.

Key takeaways:
- Default behavior prevents browser menu with no visual feedback
- Custom providers can implement any UI pattern (Material, CDK, native)
- The system respects edit mode and coordinates with widget menus
- Following Angular best practices ensures maintainable, testable code
- The two-click pattern when widget menus are open is intentional and follows standard UX conventions

For more examples and the latest updates, visit the [ngx-dashboard repository](https://github.com/your-repo/ngx-dashboard).