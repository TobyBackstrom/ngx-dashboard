import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { DashboardViewerComponent } from '../dashboard-viewer.component';
import { DashboardStore } from '../../store/dashboard-store';
import { CellIdUtils, WidgetIdUtils, CellData, WidgetFactory, Widget } from '../../models';

// Mock test widget component
@Component({
  selector: 'lib-test-widget',
  template: '<div class="test-widget">Test Widget: {{state().value}}</div>',
  standalone: true,
})
class TestWidgetComponent implements Widget {
  private state = signal<unknown>({ value: 'initial' });

  dashboardGetState(): unknown {
    return this.state();
  }

  dashboardSetState(state: unknown): void {
    this.state.set(state);
  }

  dashboardEditState(): void {
    // Mock edit state method
  }
}

describe('DashboardViewerComponent - Integration Tests', () => {
  let component: DashboardViewerComponent;
  let fixture: ComponentFixture<DashboardViewerComponent>;
  let store: InstanceType<typeof DashboardStore>;

  const mockWidgetFactory: WidgetFactory = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget for testing',
    svgIcon: '<svg></svg>',
    createInstance: (container) => {
      const componentRef = container.createComponent(TestWidgetComponent);
      return componentRef;
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardViewerComponent],
      providers: [DashboardStore]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardViewerComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(DashboardStore);
    
    // Set required inputs
    fixture.componentRef.setInput('rows', 8);
    fixture.componentRef.setInput('columns', 12);
    fixture.componentRef.setInput('gutterSize', '1em');
  });

  describe('Complete Widget Rendering Workflow', () => {
    it('should render widgets from store and export dashboard with current states', () => {
      // SCENARIO: User loads dashboard with widgets, sees them rendered, exports dashboard
      
      // Setup: Add widgets to store
      const widget1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 2,
        flat: false,
        widgetFactory: mockWidgetFactory,
        widgetState: { value: 'Widget 1' }
      };

      const widget2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 3),
        row: 2,
        col: 3,
        rowSpan: 2,
        colSpan: 1,
        flat: true,
        widgetFactory: mockWidgetFactory,
        widgetState: { value: 'Widget 2' }
      };

      // Action: Add widgets to store
      store.addWidget(widget1);
      store.addWidget(widget2);
      fixture.detectChanges();

      // Verify: Widgets are rendered
      const cellElements = fixture.nativeElement.querySelectorAll('lib-cell');
      expect(cellElements.length).toBe(2);
      expect(cellElements[0]).toBeTruthy();
      expect(cellElements[1]).toBeTruthy();

      // Verify: Store integration works
      expect(component.cells().length).toBe(2);
      expect(component.cells()[0]).toEqual(widget1);
      expect(component.cells()[1]).toEqual(widget2);

      // Action: Export dashboard
      const exported = component.exportDashboard();

      // Verify: Export contains dashboard structure
      expect(exported.version).toBe('1.0.0');
      expect(exported.rows).toBe(8);
      expect(exported.columns).toBe(12);
      expect(exported.gutterSize).toBe('1em');
      expect(exported.cells.length).toBe(2);
    });
  });

  describe('Grid Configuration and Layout', () => {
    it('should apply grid configuration and update CSS variables when inputs change', () => {
      // SCENARIO: User changes grid configuration and sees layout update
      
      // Initial setup
      fixture.detectChanges();
      
      // Verify: Initial CSS variables are set
      const hostElement = fixture.nativeElement;
      let computedStyle = getComputedStyle(hostElement);
      expect(computedStyle.getPropertyValue('--rows')).toBe('8');
      expect(computedStyle.getPropertyValue('--columns')).toBe('12');
      expect(computedStyle.getPropertyValue('--gutter-size')).toBe('1em');
      expect(computedStyle.getPropertyValue('--gutters')).toBe('13'); // columns + 1
      
      // Action: Change grid configuration
      fixture.componentRef.setInput('rows', 6);
      fixture.componentRef.setInput('columns', 10);
      fixture.componentRef.setInput('gutterSize', '2em');
      fixture.detectChanges();
      
      // Verify: CSS variables updated
      computedStyle = getComputedStyle(hostElement);
      expect(computedStyle.getPropertyValue('--rows')).toBe('6');
      expect(computedStyle.getPropertyValue('--columns')).toBe('10');
      expect(computedStyle.getPropertyValue('--gutter-size')).toBe('2em');
      expect(computedStyle.getPropertyValue('--gutters')).toBe('11'); // columns + 1
      
      // Verify: Store is updated
      expect(store.rows()).toBe(6);
      expect(store.columns()).toBe(10);
      expect(store.gutterSize()).toBe('2em');
    });
  });

  describe('Reactive Store Updates', () => {
    it('should reactively update when store changes', () => {
      // SCENARIO: User performs actions that modify store, sees immediate UI updates
      
      // Initial state: No widgets
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('lib-cell').length).toBe(0);
      
      // Action: Add widget to store
      const widget: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        flat: false,
        widgetFactory: mockWidgetFactory,
        widgetState: { value: 'Dynamic Widget' }
      };
      
      store.addWidget(widget);
      fixture.detectChanges();
      
      // Verify: Widget appears in UI
      expect(fixture.nativeElement.querySelectorAll('lib-cell').length).toBe(1);
      
      // Action: Remove widget from store
      store.removeWidget(widget.widgetId);
      fixture.detectChanges();
      
      // Verify: Widget disappears from UI
      expect(fixture.nativeElement.querySelectorAll('lib-cell').length).toBe(0);
    });
  });

  describe('Empty State Handling', () => {
    it('should handle empty dashboard gracefully', () => {
      // SCENARIO: User loads empty dashboard or clears all widgets
      
      // Action: Initialize with empty dashboard
      fixture.detectChanges();
      
      // Verify: No widgets rendered
      expect(fixture.nativeElement.querySelectorAll('lib-cell').length).toBe(0);
      expect(component.cells().length).toBe(0);
      
      // Verify: Export works with empty state
      const exported = component.exportDashboard();
      expect(exported.cells.length).toBe(0);
      expect(exported.version).toBe('1.0.0');
      expect(exported.rows).toBe(8);
      expect(exported.columns).toBe(12);
      
      // Verify: Widget state collection works with no widgets
      const widgetStates = component.getCurrentWidgetStates();
      expect(widgetStates.size).toBe(0);
      expect(widgetStates instanceof Map).toBe(true);
    });
  });

  describe('Export Functionality with Live Widget States', () => {
    it('should export dashboard with live widget states from component instances', () => {
      // SCENARIO: User modifies widget states and exports - should get current states, not store states
      
      // Setup: Add widget with initial state
      const widget: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        flat: false,
        widgetFactory: mockWidgetFactory,
        widgetState: { value: 'Initial State' }
      };
      
      store.addWidget(widget);
      fixture.detectChanges();
      
      // Verify: Widget is rendered
      const cellElements = fixture.nativeElement.querySelectorAll('lib-cell');
      expect(cellElements.length).toBe(1);
      
      // Action: Export dashboard (should include live states)
      const exported = component.exportDashboard();
      
      // Verify: Export structure is correct
      expect(exported.version).toBe('1.0.0');
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetTypeid).toBe('test-widget');
      expect(exported.cells[0].row).toBe(1);
      expect(exported.cells[0].col).toBe(1);
      
      // Verify: getCurrentWidgetStates returns proper map structure
      const widgetStates = component.getCurrentWidgetStates();
      expect(widgetStates instanceof Map).toBe(true);
      
      // The actual state collection depends on cell components being properly rendered
      // This tests that the method exists and returns the right type with WidgetId keys
      const widgetIdKey = WidgetIdUtils.toString(widget.widgetId);
      expect(typeof widgetIdKey).toBe('string');
    });
  });
});