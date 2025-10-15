import { TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';
import { CellIdUtils, WidgetIdUtils, CellData, WidgetFactory, Widget, WidgetMetadata } from '../../models';

// Mock widget with changeable state to test state preservation
interface TestWidgetState {
  value: string;
  count: number;
}

@Component({
  selector: 'lib-test-widget',
  template: '<div>{{ state().value }} - {{ state().count }}</div>',
})
class TestWidgetComponent implements Widget {
  static metadata: WidgetMetadata = {
    widgetTypeid: 'test-widget',
    name: 'Test Widget',
    description: 'A test widget',
    svgIcon: '<svg><rect width="10" height="10"/></svg>',
  };

  state = signal<TestWidgetState>({
    value: 'initial',
    count: 0,
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

  // Simulate widget state changes during runtime
  updateState(newValue: string, newCount: number) {
    this.state.set({ value: newValue, count: newCount });
  }
}

describe('DashboardStore - Widget State Preservation Tests', () => {
  let store: InstanceType<typeof DashboardStore>;
  let mockWidgetFactory: WidgetFactory;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;
  let testWidgetComponent: TestWidgetComponent;

  beforeEach(() => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getFactory', 'collectSharedStates', 'restoreSharedStates']);
    
    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: dashboardServiceSpy }
      ]
    });
    
    store = TestBed.inject(DashboardStore);
    mockDashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    store.setGridConfig({ rows: 8, columns: 12 });
    
    // Create a real widget instance for testing
    testWidgetComponent = new TestWidgetComponent();
    
    mockWidgetFactory = {
      widgetTypeid: 'test-widget',
      createInstance: jasmine.createSpy('createInstance').and.returnValue({
        instance: testWidgetComponent,
        destroy: jasmine.createSpy('destroy')
      }),
      createComponent: jasmine.createSpy('createComponent')
    } as unknown as WidgetFactory;

    mockDashboardService.getFactory.and.returnValue(mockWidgetFactory);
      mockDashboardService.collectSharedStates.and.returnValue(new Map());
      mockDashboardService.restoreSharedStates.and.stub();
  });

  describe('Widget state preservation during export', () => {
    it('should preserve initial widget state when no live changes made', () => {
      const initialState: TestWidgetState = { value: 'initial', count: 0 };
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 3),
        row: 2,
        col: 3,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: initialState,
      };

      store.addWidget(cell);

      // Test export without live state callback (backward compatibility)
      const exported = store.exportDashboard();
      
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetState).toEqual(initialState);
    });

    it('should use live widget state when getCurrentWidgetStates callback is provided', () => {
      const initialState: TestWidgetState = { value: 'initial', count: 0 };
      const liveState: TestWidgetState = { value: 'updated', count: 5 };
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 3),
        row: 2,
        col: 3,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: initialState,
      };

      store.addWidget(cell);

      // Simulate widget state change after initial creation
      testWidgetComponent.updateState('updated', 5);

      // Mock the live widget state collection that would come from CellComponent
      const liveWidgetStates = new Map<string, unknown>();
      liveWidgetStates.set('2-3', liveState);

      const exported = store.exportDashboard(() => liveWidgetStates);
      
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetState).toEqual(liveState);
      expect(exported.cells[0].widgetState).not.toEqual(initialState);
    });

    it('should fall back to stored state when live state is unavailable', () => {
      const storedState: TestWidgetState = { value: 'stored', count: 2 };
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(4, 5),
        row: 4,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: storedState,
      };

      store.addWidget(cell);

      // Mock live widget states that don't include this cell
      const liveWidgetStates = new Map<string, unknown>();
      // Intentionally not adding state for cell '4-5'

      const exported = store.exportDashboard(() => liveWidgetStates);
      
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetState).toEqual(storedState);
    });

    it('should handle mixed scenario with some live and some stored states', () => {
      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { value: 'stored1', count: 1 },
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 2),
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { value: 'stored2', count: 2 },
      };

      store.addWidget(cell1);
      store.addWidget(cell2);

      // Only provide live state for first cell
      const liveWidgetStates = new Map<string, unknown>();
      liveWidgetStates.set('1-1', { value: 'live1', count: 10 });

      const exported = store.exportDashboard(() => liveWidgetStates);
      
      expect(exported.cells.length).toBe(2);
      
      const cell1Export = exported.cells.find(c => c.row === 1 && c.col === 1);
      const cell2Export = exported.cells.find(c => c.row === 2 && c.col === 2);
      
      expect(cell1Export?.widgetState).toEqual({ value: 'live1', count: 10 });
      expect(cell2Export?.widgetState).toEqual({ value: 'stored2', count: 2 });
    });

    it('should preserve complex widget states with nested objects', () => {
      const complexState = {
        value: 'complex',
        count: 42,
        config: {
          nested: {
            prop1: 'value1',
            prop2: ['array', 'values'],
            prop3: { deep: true }
          }
        }
      };
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 3),
        row: 3,
        col: 3,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: complexState,
      };

      store.addWidget(cell);

      const liveWidgetStates = new Map<string, unknown>();
      liveWidgetStates.set('3-3', complexState);

      const exported = store.exportDashboard(() => liveWidgetStates);
      
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetState).toEqual(complexState);
    });

    it('should handle undefined live state gracefully', () => {
      const storedState: TestWidgetState = { value: 'stored', count: 3 };
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 6),
        row: 5,
        col: 6,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: storedState,
      };

      store.addWidget(cell);

      const liveWidgetStates = new Map<string, unknown>();
      liveWidgetStates.set('5-6', undefined); // Explicitly set to undefined

      const exported = store.exportDashboard(() => liveWidgetStates);
      
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetState).toEqual(storedState);
    });

    it('should export state correctly after multiple widget updates', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 2),
        row: 1,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { value: 'initial', count: 0 },
      };

      store.addWidget(cell);

      // Simulate multiple widget state changes
      testWidgetComponent.updateState('first-update', 1);
      testWidgetComponent.updateState('second-update', 2);
      testWidgetComponent.updateState('final-state', 99);

      const finalState = testWidgetComponent.dashboardGetState();
      const liveWidgetStates = new Map<string, unknown>();
      liveWidgetStates.set('1-2', finalState);

      const exported = store.exportDashboard(() => liveWidgetStates);
      
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetState).toEqual({
        value: 'final-state',
        count: 99
      });
    });
  });

  describe('Round-trip export/import with widget states', () => {
    it('should preserve widget state through export/import cycle', () => {
      const originalState: TestWidgetState = { value: 'original', count: 42 };
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 3),
        row: 2,
        col: 3,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: originalState,
      };

      store.addWidget(cell);

      // Export dashboard
      const exported = store.exportDashboard();
      
      // Clear dashboard
      store.clearDashboard();
      expect(store.cells().length).toBe(0);

      // Import dashboard
      store.loadDashboard(exported);
      
      expect(store.cells().length).toBe(1);
      const importedCell = store.cells()[0];
      expect(importedCell.widgetState).toEqual(originalState);
      expect(importedCell.row).toBe(2);
      expect(importedCell.col).toBe(3);
    });

    it('should preserve live widget state through export/import cycle', () => {
      const initialState: TestWidgetState = { value: 'initial', count: 0 };
      const liveState: TestWidgetState = { value: 'live-updated', count: 100 };
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: initialState,
      };

      store.addWidget(cell);

      // Simulate live widget state
      const liveWidgetStates = new Map<string, unknown>();
      liveWidgetStates.set('1-1', liveState);

      // Export with live state
      const exported = store.exportDashboard(() => liveWidgetStates);
      
      // Verify exported state is the live state
      expect(exported.cells[0].widgetState).toEqual(liveState);

      // Clear and re-import
      store.clearDashboard();
      store.loadDashboard(exported);
      
      // Verify imported state matches the live state that was exported
      const importedCell = store.cells()[0];
      expect(importedCell.widgetState).toEqual(liveState);
    });
  });
});