import { TestBed } from '@angular/core/testing';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';
import { CellIdUtils, WidgetIdUtils, CellData, WidgetFactory } from '../../models';
import { GridQueryInternalUtils } from '../features/utils/grid-query-internal.utils';

describe('DashboardStore - Grid Query Methods', () => {
  let store: InstanceType<typeof DashboardStore>;
  let mockWidgetFactory: WidgetFactory;

  beforeEach(() => {
    const dashboardServiceSpy = jasmine.createSpyObj('DashboardService', ['getFactory', 'collectSharedStates', 'restoreSharedStates']);
    
    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: dashboardServiceSpy }
      ]
    });
    
    store = TestBed.inject(DashboardStore);
    store.setGridConfig({ rows: 10, columns: 10 });
    
    mockWidgetFactory = {
      widgetTypeid: 'test-widget',
      createComponent: jasmine.createSpy()
    } as unknown as WidgetFactory;
  });

  describe('isCellOccupied', () => {
    it('should return false for empty grid', () => {
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 5, 5)).toBe(false);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 1, 1)).toBe(false);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 10, 10)).toBe(false);
    });

    it('should return true for occupied single cell', () => {
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

      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 5, 5)).toBe(true);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 4, 5)).toBe(false);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 5, 4)).toBe(false);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 6, 5)).toBe(false);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 5, 6)).toBe(false);
    });

    it('should return true for cells within multi-cell widget', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 4),
        row: 3,
        col: 4,
        rowSpan: 3,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);

      // Check all cells within the widget (3,4) to (5,5)
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 3, 4)).toBe(true);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 3, 5)).toBe(true);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 4, 4)).toBe(true);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 4, 5)).toBe(true);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 5, 4)).toBe(true);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 5, 5)).toBe(true);

      // Check boundary cells
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 2, 4)).toBe(false);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 3, 3)).toBe(false);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 6, 4)).toBe(false);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 3, 6)).toBe(false);
    });

    it('should exclude specified widget from occupation check', () => {
      const cellId = CellIdUtils.create(5, 5);
      const widgetId = WidgetIdUtils.generate();
      const cell: CellData = {
        widgetId,
        cellId,
        row: 5,
        col: 5,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);

      // Without exclusion
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 5, 5)).toBe(true);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 6, 6)).toBe(true);

      // With exclusion (now using widgetId instead of cellId)
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 5, 5, widgetId)).toBe(false);
      expect(GridQueryInternalUtils.isCellOccupied(store.cells(), 6, 6, widgetId)).toBe(false);
    });
  });

  describe('isOutOfBounds', () => {
    it('should return false for valid single cell placement', () => {
      expect(GridQueryInternalUtils.isOutOfBounds(1, 1, 1, 1, 10, 10)).toBe(false);
      expect(GridQueryInternalUtils.isOutOfBounds(5, 5, 1, 1, 10, 10)).toBe(false);
      expect(GridQueryInternalUtils.isOutOfBounds(10, 10, 1, 1, 10, 10)).toBe(false);
    });

    it('should return false for valid multi-cell placement', () => {
      expect(GridQueryInternalUtils.isOutOfBounds(1, 1, 3, 3, 10, 10)).toBe(false);
      expect(GridQueryInternalUtils.isOutOfBounds(8, 8, 3, 3, 10, 10)).toBe(false);
      expect(GridQueryInternalUtils.isOutOfBounds(1, 8, 3, 3, 10, 10)).toBe(false);
      expect(GridQueryInternalUtils.isOutOfBounds(8, 1, 3, 3, 10, 10)).toBe(false);
    });

    it('should return true for row out of bounds', () => {
      expect(GridQueryInternalUtils.isOutOfBounds(11, 5, 1, 1, 10, 10)).toBe(true);
      expect(GridQueryInternalUtils.isOutOfBounds(9, 5, 3, 1, 10, 10)).toBe(true); // Spans to row 11
      expect(GridQueryInternalUtils.isOutOfBounds(10, 5, 2, 1, 10, 10)).toBe(true); // Spans to row 11
    });

    it('should return true for column out of bounds', () => {
      expect(GridQueryInternalUtils.isOutOfBounds(5, 11, 1, 1, 10, 10)).toBe(true);
      expect(GridQueryInternalUtils.isOutOfBounds(5, 9, 1, 3, 10, 10)).toBe(true); // Spans to col 11
      expect(GridQueryInternalUtils.isOutOfBounds(5, 10, 1, 2, 10, 10)).toBe(true); // Spans to col 11
    });

    it('should return true for both row and column out of bounds', () => {
      expect(GridQueryInternalUtils.isOutOfBounds(11, 11, 1, 1, 10, 10)).toBe(true);
      expect(GridQueryInternalUtils.isOutOfBounds(9, 9, 3, 3, 10, 10)).toBe(true); // Spans to (11,11)
    });

    it('should handle edge cases at exact boundaries', () => {
      expect(GridQueryInternalUtils.isOutOfBounds(10, 10, 1, 1, 10, 10)).toBe(false); // Exactly at boundary
      expect(GridQueryInternalUtils.isOutOfBounds(8, 8, 3, 3, 10, 10)).toBe(false); // Spans exactly to boundary
      expect(GridQueryInternalUtils.isOutOfBounds(9, 9, 2, 2, 10, 10)).toBe(false); // Spans exactly to boundary
    });
  });

  describe('getCellAt', () => {
    it('should return null for empty grid', () => {
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 5, 5)).toBeNull();
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 1, 1)).toBeNull();
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 10, 10)).toBeNull();
    });

    it('should return cell at exact position', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 7),
        row: 3,
        col: 7,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);

      expect(GridQueryInternalUtils.getCellAt(store.cells(), 3, 7)).toBe(cell);
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 3, 6)).toBeNull();
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 4, 7)).toBeNull();
    });

    it('should return null for cells within multi-cell widget but not at origin', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 3,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);

      // Only origin position should return the cell
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 5, 5)).toBe(cell);
      
      // Other positions within the widget should return null
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 5, 6)).toBeNull();
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 6, 5)).toBeNull();
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 7, 7)).toBeNull();
    });

    it('should handle multiple widgets correctly', () => {
      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 2),
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(8, 8),
        row: 8,
        col: 8,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell1);
      store.addWidget(cell2);

      expect(GridQueryInternalUtils.getCellAt(store.cells(), 2, 2)).toBe(cell1);
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 8, 8)).toBe(cell2);
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 5, 5)).toBeNull();
      expect(GridQueryInternalUtils.getCellAt(store.cells(), 8, 9)).toBeNull(); // Within cell2 but not at origin
    });
  });
});