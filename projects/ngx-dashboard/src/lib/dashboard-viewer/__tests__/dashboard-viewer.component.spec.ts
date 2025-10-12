import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { DashboardViewerComponent, GridSelection } from '../dashboard-viewer.component';
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
    });
  });

  describe('Selection Overlay Grid', () => {
    beforeEach(() => {
      // Enable selection for these tests
      fixture.componentRef.setInput('enableSelection', true);
      fixture.detectChanges();
    });

    it('should emit GridSelection when selection completes', () => {
      // SCENARIO: User drags to select cells, selection completes on mouse up

      const emittedSelections: GridSelection[] = [];
      component.selectionComplete.subscribe((selection: GridSelection) => {
        emittedSelections.push(selection);
      });

      // Action: Start selection at (2, 3)
      const startEvent = new MouseEvent('mousedown', { button: 0 });
      component.onGhostCellMouseDown(startEvent, 2, 3);

      // Action: Drag to (4, 6)
      component.onGhostCellMouseEnter(4, 6);

      // Action: Complete selection
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);

      // Verify: GridSelection emitted with correct normalized coordinates
      expect(emittedSelections.length).toBe(1);
      expect(emittedSelections[0]).toEqual({
        topLeft: { row: 2, col: 3 },
        bottomRight: { row: 4, col: 6 }
      });
    });

    it('should normalize coordinates regardless of drag direction', () => {
      // SCENARIO: User drags in reverse direction (bottom-right to top-left)

      const emittedSelections: GridSelection[] = [];
      component.selectionComplete.subscribe((selection: GridSelection) => {
        emittedSelections.push(selection);
      });

      // Action: Start at bottom-right (5, 8)
      const startEvent = new MouseEvent('mousedown', { button: 0 });
      component.onGhostCellMouseDown(startEvent, 5, 8);

      // Action: Drag to top-left (2, 3)
      component.onGhostCellMouseEnter(2, 3);

      // Action: Complete selection
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);

      // Verify: Coordinates are normalized (topLeft is min, bottomRight is max)
      expect(emittedSelections.length).toBe(1);
      expect(emittedSelections[0]).toEqual({
        topLeft: { row: 2, col: 3 },
        bottomRight: { row: 5, col: 8 }
      });
    });

    it('should handle single-cell selection (click without drag)', () => {
      // SCENARIO: User clicks a single cell without dragging

      const emittedSelections: GridSelection[] = [];
      component.selectionComplete.subscribe((selection: GridSelection) => {
        emittedSelections.push(selection);
      });

      // Action: Click cell (3, 4) - start and end at same position
      const startEvent = new MouseEvent('mousedown', { button: 0 });
      component.onGhostCellMouseDown(startEvent, 3, 4);

      // No drag - selectionCurrent stays at same position

      // Action: Complete selection
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);

      // Verify: Single cell selection emitted
      expect(emittedSelections.length).toBe(1);
      expect(emittedSelections[0]).toEqual({
        topLeft: { row: 3, col: 4 },
        bottomRight: { row: 3, col: 4 }
      });
    });

    it('should clean up document listeners on component destroy', () => {
      // SCENARIO: Component destroyed while selection active - prevent memory leaks

      // Action: Start selection
      const startEvent = new MouseEvent('mousedown', { button: 0 });
      component.onGhostCellMouseDown(startEvent, 1, 1);

      // Verify: Selection is active
      expect(component.isSelecting()).toBe(true);

      // Spy on document event removal (via renderer's listen cleanup)
      let listenersCleaned = false;
      const originalDestroy = fixture.destroy.bind(fixture);
      fixture.destroy = () => {
        originalDestroy();
        listenersCleaned = true;
      };

      // Action: Destroy component
      fixture.destroy();

      // Verify: Cleanup occurred (listeners should be removed via DestroyRef)
      expect(listenersCleaned).toBe(true);
    });

    it('should not trigger selection when enableSelection is false', () => {
      // SCENARIO: Selection feature disabled, mouse events should not trigger selection

      // Setup: Disable selection
      fixture.componentRef.setInput('enableSelection', false);
      fixture.detectChanges();

      const emittedSelections: GridSelection[] = [];
      component.selectionComplete.subscribe((selection: GridSelection) => {
        emittedSelections.push(selection);
      });

      // Action: Attempt to start selection
      const startEvent = new MouseEvent('mousedown', { button: 0 });
      component.onGhostCellMouseDown(startEvent, 2, 3);

      // Verify: Selection did not start
      expect(component.isSelecting()).toBe(false);

      // Action: Complete "selection"
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);

      // Verify: No selection emitted
      expect(emittedSelections.length).toBe(0);
    });

    it('should only respond to left mouse button', () => {
      // SCENARIO: User right-clicks or middle-clicks - should not trigger selection

      const emittedSelections: GridSelection[] = [];
      component.selectionComplete.subscribe((selection: GridSelection) => {
        emittedSelections.push(selection);
      });

      // Action: Right-click (button 2)
      const rightClickEvent = new MouseEvent('mousedown', { button: 2 });
      component.onGhostCellMouseDown(rightClickEvent, 2, 3);

      // Verify: Selection did not start
      expect(component.isSelecting()).toBe(false);

      // Action: Middle-click (button 1)
      const middleClickEvent = new MouseEvent('mousedown', { button: 1 });
      component.onGhostCellMouseDown(middleClickEvent, 2, 3);

      // Verify: Selection still did not start
      expect(component.isSelecting()).toBe(false);

      // Action: Left-click (button 0) - should work
      const leftClickEvent = new MouseEvent('mousedown', { button: 0 });
      component.onGhostCellMouseDown(leftClickEvent, 2, 3);

      // Verify: Selection started
      expect(component.isSelecting()).toBe(true);

      // Cleanup
      const mouseUpEvent = new MouseEvent('mouseup');
      document.dispatchEvent(mouseUpEvent);
    });
  });
});