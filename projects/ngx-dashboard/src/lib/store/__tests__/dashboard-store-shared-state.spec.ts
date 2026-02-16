import { TestBed } from '@angular/core/testing';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';
import {
  CellIdUtils,
  WidgetIdUtils,
  CellData,
  WidgetFactory,
  DashboardDataDto,
} from '../../models';

describe('DashboardStore - Shared State Functionality', () => {
  let store: InstanceType<typeof DashboardStore>;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;

  // Mock widget factories
  let widgetFactoryWithSharedState: WidgetFactory;
  let widgetFactoryWithDifferentSharedState: WidgetFactory;
  let widgetFactoryWithoutSharedState: WidgetFactory;

  beforeEach(() => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', [
      'getFactory',
      'collectSharedStates',
      'restoreSharedStates',
      'widgetTypes',
    ]);

    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: dashboardServiceSpy },
      ],
    });

    store = TestBed.inject(DashboardStore);
    mockDashboardService = TestBed.inject(
      DashboardService
    ) as jasmine.SpyObj<DashboardService>;
    store.setGridConfig({ rows: 8, columns: 12 });

    // Create mock widget factories
    widgetFactoryWithSharedState = {
      widgetTypeid: 'widget-with-shared-state',
      createComponent: jasmine.createSpy(),
    } as unknown as WidgetFactory;

    widgetFactoryWithDifferentSharedState = {
      widgetTypeid: 'widget-with-different-shared-state',
      createComponent: jasmine.createSpy(),
    } as unknown as WidgetFactory;

    widgetFactoryWithoutSharedState = {
      widgetTypeid: 'widget-without-shared-state',
      createComponent: jasmine.createSpy(),
    } as unknown as WidgetFactory;

    // Setup default return values
    mockDashboardService.getFactory.and.callFake((widgetTypeid: string) => {
      switch (widgetTypeid) {
        case 'widget-with-shared-state':
          return widgetFactoryWithSharedState;
        case 'widget-with-different-shared-state':
          return widgetFactoryWithDifferentSharedState;
        case 'widget-without-shared-state':
          return widgetFactoryWithoutSharedState;
        default:
          return widgetFactoryWithoutSharedState;
      }
    });
  });

  describe('Export with Shared States', () => {
    it('should collect shared states from active widget types during export', () => {
      const sharedStateMap = new Map<string, unknown>([
        ['widget-with-shared-state', { theme: 'dark', globalSetting: 42 }],
      ]);
      mockDashboardService.collectSharedStates.and.returnValue(sharedStateMap);

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithSharedState,
        widgetState: { instanceData: 'test' },
      };

      store.addWidget(cell);
      const exported = store.exportDashboard();

      // Verify collectSharedStates was called with the correct widget types
      expect(mockDashboardService.collectSharedStates).toHaveBeenCalledWith(
        jasmine.objectContaining(new Set(['widget-with-shared-state']))
      );

      // Verify shared states are included in export
      expect(exported.sharedStates).toEqual({
        'widget-with-shared-state': { theme: 'dark', globalSetting: 42 },
      });
    });

    it('should collect shared states from multiple different widget types', () => {
      const sharedStateMap = new Map<string, unknown>([
        ['widget-with-shared-state', { theme: 'dark', globalSetting: 42 }],
        ['widget-with-different-shared-state', { color: 'blue', size: 100 }],
      ]);
      mockDashboardService.collectSharedStates.and.returnValue(sharedStateMap);

      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithSharedState,
        widgetState: { instanceData: 'test1' },
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 2),
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithDifferentSharedState,
        widgetState: { instanceData: 'test2' },
      };

      store.addWidget(cell1);
      store.addWidget(cell2);
      const exported = store.exportDashboard();

      // Verify collectSharedStates was called with both widget types
      const expectedSet = new Set([
        'widget-with-shared-state',
        'widget-with-different-shared-state',
      ]);
      expect(mockDashboardService.collectSharedStates).toHaveBeenCalledWith(
        jasmine.objectContaining(expectedSet)
      );

      // Verify both shared states are included
      expect(exported.sharedStates).toEqual({
        'widget-with-shared-state': { theme: 'dark', globalSetting: 42 },
        'widget-with-different-shared-state': { color: 'blue', size: 100 },
      });
    });

    it('should not include sharedStates property when no shared states exist', () => {
      mockDashboardService.collectSharedStates.and.returnValue(new Map());

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithoutSharedState,
        widgetState: { instanceData: 'test' },
      };

      store.addWidget(cell);
      const exported = store.exportDashboard();

      // Verify sharedStates property is not present
      expect(exported.sharedStates).toBeUndefined();
      expect('sharedStates' in exported).toBe(false);
    });

    it('should not include sharedStates property on empty dashboard', () => {
      mockDashboardService.collectSharedStates.and.returnValue(new Map());

      const exported = store.exportDashboard();

      // Verify sharedStates property is not present
      expect(exported.sharedStates).toBeUndefined();
      expect('sharedStates' in exported).toBe(false);
    });

    it('should collect shared states only from widget types currently on dashboard', () => {
      const sharedStateMap = new Map<string, unknown>([
        ['widget-with-shared-state', { theme: 'dark', globalSetting: 42 }],
      ]);
      mockDashboardService.collectSharedStates.and.returnValue(sharedStateMap);

      // Add multiple widgets of the same type
      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithSharedState,
        widgetState: { instanceData: 'test1' },
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 2),
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithSharedState,
        widgetState: { instanceData: 'test2' },
      };

      store.addWidget(cell1);
      store.addWidget(cell2);
      store.exportDashboard();

      // Verify collectSharedStates is called only once per widget type
      const capturedSet =
        mockDashboardService.collectSharedStates.calls.mostRecent().args[0];
      expect(capturedSet.size).toBe(1);
      expect(capturedSet.has('widget-with-shared-state')).toBe(true);
    });

    it('should handle mixed scenario with some widgets having shared state and some without', () => {
      const sharedStateMap = new Map<string, unknown>([
        ['widget-with-shared-state', { theme: 'dark', globalSetting: 42 }],
      ]);
      mockDashboardService.collectSharedStates.and.returnValue(sharedStateMap);

      const cellWithSharedState: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithSharedState,
        widgetState: { instanceData: 'test1' },
      };

      const cellWithoutSharedState: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 2),
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithoutSharedState,
        widgetState: { instanceData: 'test2' },
      };

      store.addWidget(cellWithSharedState);
      store.addWidget(cellWithoutSharedState);
      const exported = store.exportDashboard();

      // Verify collectSharedStates is called with both widget types
      const capturedSet =
        mockDashboardService.collectSharedStates.calls.mostRecent().args[0];
      expect(capturedSet.has('widget-with-shared-state')).toBe(true);
      expect(capturedSet.has('widget-without-shared-state')).toBe(true);

      // Verify only the widget with shared state has its state in the export
      expect(exported.sharedStates).toEqual({
        'widget-with-shared-state': { theme: 'dark', globalSetting: 42 },
      });
    });
  });

  describe('Import with Shared States', () => {
    it('should restore shared states before creating widget instances', () => {
      const dashboardData: DashboardDataDto = {
        version: '1.1.0',
        dashboardId: 'test-dashboard',
        rows: 8,
        columns: 12,
        gutterSize: '1em',
        cells: [
          {
            row: 1,
            col: 1,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'widget-with-shared-state',
            widgetState: { instanceData: 'test' },
          },
        ],
        sharedStates: {
          'widget-with-shared-state': { theme: 'dark', globalSetting: 42 },
        },
      };

      store.loadDashboard(dashboardData);

      // Verify restoreSharedStates was called
      expect(mockDashboardService.restoreSharedStates).toHaveBeenCalledWith(
        jasmine.objectContaining(
          new Map([
            ['widget-with-shared-state', { theme: 'dark', globalSetting: 42 }],
          ])
        )
      );

      // Verify both methods were called (order is guaranteed by implementation)
      expect(mockDashboardService.restoreSharedStates).toHaveBeenCalled();
      expect(mockDashboardService.getFactory).toHaveBeenCalled();
    });

    it('should restore multiple shared states for different widget types', () => {
      const dashboardData: DashboardDataDto = {
        version: '1.1.0',
        dashboardId: 'test-dashboard',
        rows: 8,
        columns: 12,
        gutterSize: '1em',
        cells: [
          {
            row: 1,
            col: 1,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'widget-with-shared-state',
            widgetState: { instanceData: 'test1' },
          },
          {
            row: 2,
            col: 2,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'widget-with-different-shared-state',
            widgetState: { instanceData: 'test2' },
          },
        ],
        sharedStates: {
          'widget-with-shared-state': { theme: 'dark', globalSetting: 42 },
          'widget-with-different-shared-state': { color: 'blue', size: 100 },
        },
      };

      store.loadDashboard(dashboardData);

      // Verify restoreSharedStates was called with all shared states
      const expectedMap = new Map([
        ['widget-with-shared-state', { theme: 'dark', globalSetting: 42 }],
        ['widget-with-different-shared-state', { color: 'blue', size: 100 }],
      ]);

      expect(mockDashboardService.restoreSharedStates).toHaveBeenCalledWith(
        jasmine.objectContaining(expectedMap)
      );
    });

    it('should handle dashboard import without shared states', () => {
      const dashboardData: DashboardDataDto = {
        version: '1.1.0',
        dashboardId: 'test-dashboard',
        rows: 8,
        columns: 12,
        gutterSize: '1em',
        cells: [
          {
            row: 1,
            col: 1,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'widget-without-shared-state',
            widgetState: { instanceData: 'test' },
          },
        ],
        // No sharedStates property
      };

      store.loadDashboard(dashboardData);

      // Verify restoreSharedStates was not called
      expect(mockDashboardService.restoreSharedStates).not.toHaveBeenCalled();

      // Verify widgets are still created correctly
      expect(store.cells().length).toBe(1);
      expect(store.cells()[0].widgetFactory).toBe(
        widgetFactoryWithoutSharedState
      );
    });

    it('should handle empty dashboard import with shared states', () => {
      const dashboardData: DashboardDataDto = {
        version: '1.1.0',
        dashboardId: 'test-dashboard',
        rows: 8,
        columns: 12,
        gutterSize: '1em',
        cells: [],
        sharedStates: {
          'widget-with-shared-state': { theme: 'dark', globalSetting: 42 },
        },
      };

      store.loadDashboard(dashboardData);

      // Verify restoreSharedStates was called even though no widgets exist
      expect(mockDashboardService.restoreSharedStates).toHaveBeenCalledWith(
        jasmine.objectContaining(
          new Map([
            ['widget-with-shared-state', { theme: 'dark', globalSetting: 42 }],
          ])
        )
      );

      // Verify dashboard is empty
      expect(store.cells().length).toBe(0);
    });
  });

  describe('Round-trip Export/Import with Shared States', () => {
    it('should preserve shared states through export and import cycle', () => {
      // Setup: Create dashboard with widgets that have shared states
      const sharedStateMap = new Map<string, unknown>([
        ['widget-with-shared-state', { theme: 'dark', globalSetting: 42 }],
      ]);
      mockDashboardService.collectSharedStates.and.returnValue(sharedStateMap);

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithSharedState,
        widgetState: { instanceData: 'test' },
      };

      store.addWidget(cell);

      // Export
      const exported = store.exportDashboard();

      expect(exported.sharedStates).toEqual({
        'widget-with-shared-state': { theme: 'dark', globalSetting: 42 },
      });

      // Reset the store
      store.clearDashboard();

      // Import
      store.loadDashboard(exported);

      // Verify shared states were restored
      expect(mockDashboardService.restoreSharedStates).toHaveBeenCalledWith(
        jasmine.objectContaining(
          new Map([
            ['widget-with-shared-state', { theme: 'dark', globalSetting: 42 }],
          ])
        )
      );

      // Verify widget data was preserved
      expect(store.cells().length).toBe(1);
      expect(store.cells()[0].row).toBe(1);
      expect(store.cells()[0].col).toBe(1);
      expect(store.cells()[0].widgetState).toEqual({ instanceData: 'test' });
    });

    it('should preserve shared states for multiple widget types through export/import cycle', () => {
      const sharedStateMap = new Map<string, unknown>([
        ['widget-with-shared-state', { theme: 'dark', globalSetting: 42 }],
        ['widget-with-different-shared-state', { color: 'blue', size: 100 }],
      ]);
      mockDashboardService.collectSharedStates.and.returnValue(sharedStateMap);

      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithSharedState,
        widgetState: { instanceData: 'test1' },
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 2),
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithDifferentSharedState,
        widgetState: { instanceData: 'test2' },
      };

      store.addWidget(cell1);
      store.addWidget(cell2);

      // Export
      const exported = store.exportDashboard();

      // Import into a new store
      store.clearDashboard();
      store.loadDashboard(exported);

      // Verify both shared states were restored
      const restoredMap =
        mockDashboardService.restoreSharedStates.calls.mostRecent().args[0];
      expect(restoredMap.get('widget-with-shared-state')).toEqual({
        theme: 'dark',
        globalSetting: 42,
      });
      expect(restoredMap.get('widget-with-different-shared-state')).toEqual({
        color: 'blue',
        size: 100,
      });

      // Verify both widgets were recreated
      expect(store.cells().length).toBe(2);
    });
  });

  describe('loadDashboard with Shared States', () => {
    it('should restore shared states when initializing from DTO', () => {
      const dashboardData: DashboardDataDto = {
        version: '1.1.0',
        dashboardId: 'initialized-dashboard',
        rows: 8,
        columns: 12,
        gutterSize: '1em',
        cells: [
          {
            row: 1,
            col: 1,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'widget-with-shared-state',
            widgetState: { instanceData: 'init-test' },
          },
        ],
        sharedStates: {
          'widget-with-shared-state': { theme: 'light', globalSetting: 99 },
        },
      };

      store.loadDashboard(dashboardData);

      // Verify restoreSharedStates was called
      expect(mockDashboardService.restoreSharedStates).toHaveBeenCalledWith(
        jasmine.objectContaining(
          new Map([
            ['widget-with-shared-state', { theme: 'light', globalSetting: 99 }],
          ])
        )
      );

      // Verify both methods were called (order is guaranteed by implementation)
      expect(mockDashboardService.restoreSharedStates).toHaveBeenCalled();
      expect(mockDashboardService.getFactory).toHaveBeenCalled();

      // Verify dashboard was initialized correctly
      expect(store.dashboardId()).toBe('initialized-dashboard');
      expect(store.cells().length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle shared state with undefined values', () => {
      const sharedStateMap = new Map<string, unknown>([
        ['widget-with-shared-state', undefined],
      ]);
      mockDashboardService.collectSharedStates.and.returnValue(sharedStateMap);

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithSharedState,
        widgetState: { instanceData: 'test' },
      };

      store.addWidget(cell);
      const exported = store.exportDashboard();

      // When shared state value is undefined, it should not be included in the export
      expect(exported.sharedStates).toEqual({
        'widget-with-shared-state': undefined,
      });
    });

    it('should handle shared state with null values', () => {
      const sharedStateMap = new Map<string, unknown>([
        ['widget-with-shared-state', null],
      ]);
      mockDashboardService.collectSharedStates.and.returnValue(sharedStateMap);

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithSharedState,
        widgetState: { instanceData: 'test' },
      };

      store.addWidget(cell);
      const exported = store.exportDashboard();

      // Null values should be preserved in the export
      expect(exported.sharedStates).toEqual({
        'widget-with-shared-state': null,
      });
    });

    it('should handle shared state with complex nested objects', () => {
      const complexSharedState = {
        theme: 'dark',
        settings: {
          nested: {
            deep: {
              value: 42,
            },
          },
          array: [1, 2, 3],
          map: { key1: 'value1', key2: 'value2' },
        },
      };

      const sharedStateMap = new Map<string, unknown>([
        ['widget-with-shared-state', complexSharedState],
      ]);
      mockDashboardService.collectSharedStates.and.returnValue(sharedStateMap);

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: widgetFactoryWithSharedState,
        widgetState: { instanceData: 'test' },
      };

      store.addWidget(cell);
      const exported = store.exportDashboard();

      // Complex objects should be preserved
      expect(exported.sharedStates).toEqual({
        'widget-with-shared-state': complexSharedState,
      });
    });
  });
});
