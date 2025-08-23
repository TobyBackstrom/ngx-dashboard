import { TestBed } from '@angular/core/testing';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';
import { CellIdUtils, WidgetIdUtils, CellData, WidgetMetadata, WidgetFactory } from '../../models';

describe('DashboardStore - Widget Management', () => {
  let store: InstanceType<typeof DashboardStore>;
  let mockWidgetFactory: WidgetFactory;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;

  beforeEach(() => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getFactory']);
    
    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: dashboardServiceSpy }
      ]
    });
    
    store = TestBed.inject(DashboardStore);
    mockDashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
    store.setGridConfig({ rows: 16, columns: 16 });

    mockWidgetFactory = {
      widgetTypeid: 'test-widget',
      createComponent: jasmine.createSpy()
    } as unknown as WidgetFactory;

    mockDashboardService.getFactory.and.returnValue(mockWidgetFactory);
  });

  describe('addWidget', () => {
    it('should add a widget to empty grid', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);

      expect(store.cells().length).toBe(1);
      expect(store.cells()[0]).toEqual(cell);
    });

    it('should add multiple widgets', () => {
      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 3),
        row: 3,
        col: 3,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell1);
      store.addWidget(cell2);

      expect(store.cells().length).toBe(2);
      expect(store.cells()).toContain(cell1);
      expect(store.cells()).toContain(cell2);
    });

    it('should add widget with custom state', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { customProperty: 'test-value' },
      };

      store.addWidget(cell);

      expect(store.cells()[0].widgetState).toEqual({ customProperty: 'test-value' });
    });
  });

  describe('removeWidget', () => {
    it('should remove existing widget', () => {
      const cellId = CellIdUtils.create(5, 5);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);
      expect(store.cells().length).toBe(1);

      const widget = store.cells().find(c => CellIdUtils.equals(c.cellId, cellId))!; store.removeWidget(widget.widgetId);
      expect(store.cells().length).toBe(0);
    });

    it('should remove specific widget from multiple widgets', () => {
      const cellId1 = CellIdUtils.create(1, 1);
      const cellId2 = CellIdUtils.create(3, 3);
      
      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: cellId1,
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: cellId2,
        row: 3,
        col: 3,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell1);
      store.addWidget(cell2);
      expect(store.cells().length).toBe(2);

      const widget1 = store.cells().find(c => CellIdUtils.equals(c.cellId, cellId1))!; store.removeWidget(widget1.widgetId);
      expect(store.cells().length).toBe(1);
      expect(store.cells()[0].cellId).toEqual(cellId2);
    });

    it('should handle removing non-existent widget gracefully', () => {
      const existingCellId = CellIdUtils.create(5, 5);
      const nonExistentCellId = CellIdUtils.create(10, 10);
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: existingCellId,
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);
      expect(store.cells().length).toBe(1);

      store.removeWidget("non-existent-widget-id" as any);
      expect(store.cells().length).toBe(1); // No change
    });
  });

  describe('updateWidgetPosition', () => {
    it('should update widget position', () => {
      const cellId = CellIdUtils.create(5, 5);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 5,
        col: 5,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);
      const widget = store.cells().find(c => CellIdUtils.equals(c.cellId, cellId))!;
      store.updateWidgetPosition(widget.widgetId, 8, 9);

      expect(store.cells()[0].row).toBe(8);
      expect(store.cells()[0].col).toBe(9);
      expect(store.cells()[0].rowSpan).toBe(2); // unchanged
      expect(store.cells()[0].colSpan).toBe(2); // unchanged
    });

    it('should handle updating non-existent widget gracefully', () => {
      const existingCellId = CellIdUtils.create(5, 5);
      const nonExistentCellId = CellIdUtils.create(10, 10);
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: existingCellId,
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);
      store.updateWidgetPosition("non-existent-widget-id" as any, 8, 9);

      // Original widget should be unchanged
      expect(store.cells()[0].row).toBe(5);
      expect(store.cells()[0].col).toBe(5);
    });
  });

  describe('createWidget', () => {
    it('should create widget with default size', () => {
      store.createWidget(7, 8, mockWidgetFactory);

      expect(store.cells().length).toBe(1);
      expect(store.cells()[0].row).toBe(7);
      expect(store.cells()[0].col).toBe(8);
      expect(store.cells()[0].rowSpan).toBe(1);
      expect(store.cells()[0].colSpan).toBe(1);
      expect(store.cells()[0].widgetFactory).toBe(mockWidgetFactory);
    });

    it('should create widget with custom state', () => {
      const customState = { color: 'red', size: 'large' };
      store.createWidget(7, 8, mockWidgetFactory, customState as any);

      expect(store.cells()[0].widgetState).toBe(customState);
    });

    it('should create widget with undefined state', () => {
      store.createWidget(7, 8, mockWidgetFactory, undefined);

      expect(store.cells()[0].widgetState).toBeUndefined();
    });

    it('should generate correct cellId', () => {
      store.createWidget(12, 15, mockWidgetFactory);

      const expectedCellId = CellIdUtils.create(12, 15);
      expect(store.cells()[0].cellId).toEqual(expectedCellId);
    });
  });

  describe('updateCellSettings', () => {
    it('should update flat property to true', () => {
      const cellId = CellIdUtils.create(5, 5);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
        flat: false,
      };

      store.addWidget(cell);
      const widget = store.cells().find(c => CellIdUtils.equals(c.cellId, cellId))!;
      store.updateCellSettings(widget.widgetId, true);

      expect(store.cells()[0].flat).toBe(true);
    });

    it('should update flat property to false', () => {
      const cellId = CellIdUtils.create(5, 5);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
        flat: true,
      };

      store.addWidget(cell);
      const widget = store.cells().find(c => CellIdUtils.equals(c.cellId, cellId))!;
      store.updateCellSettings(widget.widgetId, false);

      expect(store.cells()[0].flat).toBe(false);
    });

    it('should handle updating non-existent cell gracefully', () => {
      const existingCellId = CellIdUtils.create(5, 5);
      const nonExistentCellId = CellIdUtils.create(10, 10);
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: existingCellId,
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
        flat: false,
      };

      store.addWidget(cell);
      store.updateCellSettings("non-existent-widget-id" as any, true);

      // Original cell should be unchanged
      expect(store.cells()[0].flat).toBe(false);
    });
  });

  describe('updateWidgetSpan', () => {
    it('should update widget span', () => {
      const cellId = CellIdUtils.create(5, 5);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);
      const widget = store.cells().find(c => CellIdUtils.equals(c.cellId, cellId))!;
      store.updateWidgetSpan(widget.widgetId, 3, 4);

      expect(store.cells()[0].rowSpan).toBe(3);
      expect(store.cells()[0].colSpan).toBe(4);
      expect(store.cells()[0].row).toBe(5); // unchanged
      expect(store.cells()[0].col).toBe(5); // unchanged
    });

    it('should handle minimum span values', () => {
      const cellId = CellIdUtils.create(5, 5);
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId,
        row: 5,
        col: 5,
        rowSpan: 3,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);
      const widget = store.cells().find(c => CellIdUtils.equals(c.cellId, cellId))!;
      store.updateWidgetSpan(widget.widgetId, 1, 1);

      expect(store.cells()[0].rowSpan).toBe(1);
      expect(store.cells()[0].colSpan).toBe(1);
    });

    it('should handle updating non-existent widget gracefully', () => {
      const existingCellId = CellIdUtils.create(5, 5);
      const nonExistentCellId = CellIdUtils.create(10, 10);
      
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: existingCellId,
        row: 5,
        col: 5,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);
      store.updateWidgetSpan("non-existent-widget-id" as any, 4, 4);

      // Original widget should be unchanged
      expect(store.cells()[0].rowSpan).toBe(2);
      expect(store.cells()[0].colSpan).toBe(2);
    });
  });

  describe('clearDashboard', () => {
    it('should clear empty dashboard', () => {
      store.clearDashboard();
      expect(store.cells()).toEqual([]);
    });

    it('should clear dashboard with single widget', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);
      expect(store.cells().length).toBe(1);

      store.clearDashboard();
      expect(store.cells()).toEqual([]);
    });

    it('should clear dashboard with multiple widgets', () => {
      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell1);
      store.addWidget(cell2);
      expect(store.cells().length).toBe(2);

      store.clearDashboard();
      expect(store.cells()).toEqual([]);
    });
  });
});