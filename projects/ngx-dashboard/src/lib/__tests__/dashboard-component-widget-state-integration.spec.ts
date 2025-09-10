import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal, ViewContainerRef } from '@angular/core';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { DashboardService } from '../services/dashboard.service';
import {
  WidgetFactory,
  DashboardDataDto,
  Widget,
  WidgetMetadata,
} from '../models';

// Mock widget with state that can be modified after initialization
interface TestWidgetState {
  value: string;
  counter: number;
  modified: boolean;
}

@Component({
  selector: 'lib-test-widget',
  template: `
    <div class="test-widget">
      <p>Value: {{ state().value }}</p>
      <p>Counter: {{ state().counter }}</p>
      <p>Modified: {{ state().modified ? 'Yes' : 'No' }}</p>
      <button (click)="updateValue()">Update Value</button>
      <button (click)="incrementCounter()">Increment Counter</button>
    </div>
  `,
})
class TestWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget for state preservation tests',
    svgIcon: '<svg><rect width="10" height="10"/></svg>',
  };

  state = signal<TestWidgetState>({
    value: 'initial',
    counter: 0,
    modified: false,
  });

  dashboardSetState(state?: unknown) {
    if (state) {
      this.state.update((current) => ({
        ...current,
        ...(state as TestWidgetState),
      }));
    }
  }

  dashboardGetState(): TestWidgetState {
    return { ...this.state() };
  }

  // Methods to simulate user interactions that modify widget state
  updateValue() {
    this.state.update((current) => ({
      ...current,
      value: `updated-${Date.now()}`,
      modified: true,
    }));
  }

  incrementCounter() {
    this.state.update((current) => ({
      ...current,
      counter: current.counter + 1,
      modified: true,
    }));
  }
}

describe('DashboardComponent - Widget State Integration', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardService: jasmine.SpyObj<DashboardService>;
  let testWidgetFactory: WidgetFactory;

  beforeEach(async () => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', [
      'getFactory',
      'registerWidgetType',
      'getAllFactories',
    ]);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent, TestWidgetComponent],
      providers: [{ provide: DashboardService, useValue: dashboardServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    dashboardService = TestBed.inject(
      DashboardService
    ) as jasmine.SpyObj<DashboardService>;

    // Setup mock widget factory
    testWidgetFactory = {
      widgetTypeid: 'test-widget',
      name: 'Test Widget',
      description: 'A test widget',
      svgIcon: '<svg><rect width="10" height="10"/></svg>',
      createInstance: jasmine
        .createSpy('createInstance')
        .and.callFake((container: ViewContainerRef, state?: unknown) => {
          const componentRef = container.createComponent(TestWidgetComponent);
          if (state) {
            componentRef.instance.dashboardSetState(state);
          }
          return componentRef;
        }),
    };

    dashboardService.getFactory.and.returnValue(testWidgetFactory);
  });

  describe('Widget state preservation during export', () => {
    it('should export initial widget state without modifications', async () => {
      const initialState: TestWidgetState = {
        value: 'initial',
        counter: 0,
        modified: false,
      };

      // Create dashboard with a widget
      const dashboardData: DashboardDataDto = {
        version: '1.0.0',
        rows: 5,
        columns: 8,
        gutterSize: '1em',
        cells: [
          {
            row: 2,
            col: 3,
            rowSpan: 2,
            colSpan: 3,
            widgetTypeid: 'test-widget',
            widgetState: initialState,
          },
        ],
      };

      // Set the dashboard data
      fixture.componentRef.setInput('dashboardData', dashboardData);
      fixture.detectChanges();

      // Wait for async operations
      await fixture.whenStable();

      // Export dashboard
      const exported = component.exportDashboard();

      expect(exported.cells).toHaveSize(1);
      expect(exported.cells[0].widgetState).toEqual(initialState);
    });

    it('should export live widget state after modifications', async () => {
      const initialState: TestWidgetState = {
        value: 'initial',
        counter: 0,
        modified: false,
      };

      // Create dashboard with a widget
      const dashboardData: DashboardDataDto = {
        version: '1.0.0',
        rows: 5,
        columns: 8,
        gutterSize: '1em',
        cells: [
          {
            row: 1,
            col: 1,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'test-widget',
            widgetState: initialState,
          },
        ],
      };

      // Set the dashboard data
      fixture.componentRef.setInput('dashboardData', dashboardData);
      fixture.detectChanges();

      // Wait for the component to initialize
      await fixture.whenStable();

      // Find the widget component and modify its state
      const widgetElement = fixture.debugElement.query(
        (el) => el.componentInstance instanceof TestWidgetComponent
      );

      if (widgetElement) {
        const widgetComponent =
          widgetElement.componentInstance as TestWidgetComponent;

        // Modify the widget state
        widgetComponent.updateValue();
        widgetComponent.incrementCounter();

        // Detect changes
        fixture.detectChanges();
        await fixture.whenStable();

        // Export dashboard and check if live state is captured
        const exported = component.exportDashboard();

        expect(exported.cells).toHaveSize(1);

        const exportedState = exported.cells[0].widgetState as TestWidgetState;
        expect(exportedState.modified).toBe(true);
        expect(exportedState.counter).toBe(1);
        expect(exportedState.value).toContain('updated-');
        expect(exportedState.value).not.toBe('initial');
      } else {
        fail('Widget component not found in the DOM');
      }
    });

    it('should handle widgets that do not implement dashboardGetState', async () => {
      // Create a widget that doesn't implement dashboardGetState
      @Component({
        selector: 'lib-simple-widget',
        template: '<div>Simple Widget</div>',
      })
      class SimpleWidgetComponent implements Widget {
        // Intentionally not implementing dashboardGetState
      }

      const simpleWidgetFactory: WidgetFactory = {
        widgetTypeid: 'simple-widget',
        name: 'Simple Widget',
        description: 'A simple widget',
        svgIcon: '<svg><circle r="5"/></svg>',
        createInstance: jasmine
          .createSpy('createInstance')
          .and.callFake((container: ViewContainerRef) => {
            return container.createComponent(SimpleWidgetComponent);
          }),
      };

      dashboardService.getFactory.and.returnValue(simpleWidgetFactory);

      const dashboardData: DashboardDataDto = {
        version: '1.0.0',
        rows: 3,
        columns: 4,
        gutterSize: '1em',
        cells: [
          {
            row: 1,
            col: 1,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'simple-widget',
            widgetState: { simple: 'data' },
          },
        ],
      };

      fixture.componentRef.setInput('dashboardData', dashboardData);
      fixture.detectChanges();
      await fixture.whenStable();

      const exported = component.exportDashboard();

      expect(exported.cells).toHaveSize(1);
      expect(exported.cells[0].widgetState).toEqual({ simple: 'data' });
    });

    it('should handle multiple widgets with different state scenarios', async () => {
      const dashboardData: DashboardDataDto = {
        version: '1.0.0',
        rows: 8,
        columns: 8,
        gutterSize: '1em',
        cells: [
          {
            row: 1,
            col: 1,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'test-widget',
            widgetState: { value: 'widget1', counter: 1, modified: false },
          },
          {
            row: 2,
            col: 2,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'test-widget',
            widgetState: { value: 'widget2', counter: 2, modified: false },
          },
          {
            row: 3,
            col: 3,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'test-widget',
            widgetState: { value: 'widget3', counter: 3, modified: false },
          },
        ],
      };

      fixture.componentRef.setInput('dashboardData', dashboardData);
      fixture.detectChanges();
      await fixture.whenStable();

      // Find all widget components (top-level only)
      const widgetElements = fixture.debugElement.queryAll(
        (el) =>
          el.componentInstance instanceof TestWidgetComponent &&
          el.nativeElement.tagName === 'LIB-TEST-WIDGET'
      );

      expect(widgetElements).toHaveSize(3);

      // Modify only the first and third widgets
      if (widgetElements[0]) {
        (
          widgetElements[0].componentInstance as TestWidgetComponent
        ).updateValue();
        (
          widgetElements[0].componentInstance as TestWidgetComponent
        ).incrementCounter();
      }

      if (widgetElements[2]) {
        (
          widgetElements[2].componentInstance as TestWidgetComponent
        ).incrementCounter();
        (
          widgetElements[2].componentInstance as TestWidgetComponent
        ).incrementCounter();
      }

      fixture.detectChanges();
      await fixture.whenStable();

      const exported = component.exportDashboard();

      expect(exported.cells).toHaveSize(3);

      // Check that the modified widgets have live state
      const cell1 = exported.cells.find((c) => c.row === 1 && c.col === 1);
      const cell2 = exported.cells.find((c) => c.row === 2 && c.col === 2);
      const cell3 = exported.cells.find((c) => c.row === 3 && c.col === 3);

      expect(cell1?.widgetState).toEqual(
        jasmine.objectContaining({
          modified: true,
          counter: 2,
        })
      );

      expect(cell2?.widgetState).toEqual(
        jasmine.objectContaining({
          value: 'widget2',
          counter: 2,
          modified: false,
        })
      );

      expect(cell3?.widgetState).toEqual(
        jasmine.objectContaining({
          value: 'widget3',
          counter: 5,
          modified: true,
        })
      );
    });
  });

  describe('Widget state preservation during mode switching', () => {
    it('should preserve widget state when switching from edit to view mode', async () => {
      const initialState: TestWidgetState = {
        value: 'initial',
        counter: 0,
        modified: false,
      };

      // Create dashboard with a widget
      const dashboardData: DashboardDataDto = {
        version: '1.0.0',
        rows: 5,
        columns: 8,
        gutterSize: '1em',
        cells: [
          {
            row: 2,
            col: 3,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'test-widget',
            widgetState: initialState,
          },
        ],
      };

      // Set the dashboard data in edit mode
      fixture.componentRef.setInput('dashboardData', dashboardData);
      fixture.componentRef.setInput('editMode', true);
      fixture.detectChanges();
      await fixture.whenStable();

      // Find the widget component and modify its state in edit mode
      const widgetElementInEdit = fixture.debugElement.query(
        (el) => el.componentInstance instanceof TestWidgetComponent
      );

      expect(widgetElementInEdit).toBeTruthy();

      if (widgetElementInEdit) {
        const widgetComponent =
          widgetElementInEdit.componentInstance as TestWidgetComponent;

        // Modify the widget state
        widgetComponent.updateValue();
        widgetComponent.incrementCounter();

        // Detect changes
        fixture.detectChanges();
        await fixture.whenStable();

        // Verify the state was modified
        const currentState = widgetComponent.dashboardGetState();
        expect(currentState.modified).toBe(true);
        expect(currentState.counter).toBe(1);
        expect(currentState.value).toContain('updated-');

        // Now switch to view mode
        fixture.componentRef.setInput('editMode', false);
        fixture.detectChanges();
        await fixture.whenStable();

        // Find the widget component in view mode
        const widgetElementInView = fixture.debugElement.query(
          (el) => el.componentInstance instanceof TestWidgetComponent
        );

        expect(widgetElementInView).toBeTruthy();

        if (widgetElementInView) {
          const widgetComponentInView =
            widgetElementInView.componentInstance as TestWidgetComponent;

          // Check if the widget state was preserved
          const viewModeState = widgetComponentInView.dashboardGetState();

          // This is the current bug - the state is lost when switching modes
          // The widget gets recreated with the original state from the store
          expect(viewModeState.modified).toBe(true); // This will currently fail
          expect(viewModeState.counter).toBe(1); // This will currently fail
          expect(viewModeState.value).toContain('updated-'); // This will currently fail
        } else {
          fail('Widget component not found in view mode');
        }
      } else {
        fail('Widget component not found in edit mode');
      }
    });

    it('should preserve widget state when switching from view to edit mode', async () => {
      const initialState: TestWidgetState = {
        value: 'initial',
        counter: 5,
        modified: false,
      };

      // Create dashboard with a widget
      const dashboardData: DashboardDataDto = {
        version: '1.0.0',
        rows: 5,
        columns: 8,
        gutterSize: '1em',
        cells: [
          {
            row: 1,
            col: 1,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'test-widget',
            widgetState: initialState,
          },
        ],
      };

      // Set the dashboard data in view mode first
      fixture.componentRef.setInput('dashboardData', dashboardData);
      fixture.componentRef.setInput('editMode', false);
      fixture.detectChanges();
      await fixture.whenStable();

      // Find the widget component and modify its state in view mode
      const widgetElementInView = fixture.debugElement.query(
        (el) => el.componentInstance instanceof TestWidgetComponent
      );

      expect(widgetElementInView).toBeTruthy();

      if (widgetElementInView) {
        const widgetComponent =
          widgetElementInView.componentInstance as TestWidgetComponent;

        // Modify the widget state
        widgetComponent.updateValue();
        widgetComponent.incrementCounter();

        // Detect changes
        fixture.detectChanges();
        await fixture.whenStable();

        // Verify the state was modified
        const currentState = widgetComponent.dashboardGetState();
        expect(currentState.modified).toBe(true);
        expect(currentState.counter).toBe(6);
        expect(currentState.value).toContain('updated-');

        // Now switch to edit mode
        fixture.componentRef.setInput('editMode', true);
        fixture.detectChanges();
        await fixture.whenStable();

        // Find the widget component in edit mode
        const widgetElementInEdit = fixture.debugElement.query(
          (el) => el.componentInstance instanceof TestWidgetComponent
        );

        expect(widgetElementInEdit).toBeTruthy();

        if (widgetElementInEdit) {
          const widgetComponentInEdit =
            widgetElementInEdit.componentInstance as TestWidgetComponent;

          // Check if the widget state was preserved
          const editModeState = widgetComponentInEdit.dashboardGetState();

          // This is the current bug - the state is lost when switching modes
          expect(editModeState.modified).toBe(true); // This will currently fail
          expect(editModeState.counter).toBe(6); // This will currently fail
          expect(editModeState.value).toContain('updated-'); // This will currently fail
        } else {
          fail('Widget component not found in edit mode');
        }
      } else {
        fail('Widget component not found in view mode');
      }
    });
  });
});
