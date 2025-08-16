import { TestBed } from '@angular/core/testing';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';
import { CellIdUtils, WidgetIdUtils, CellData, WidgetFactory, DashboardDataDto, Widget } from '../../models';

describe('DashboardStore - Export/Import Functionality', () => {
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
    store.setGridConfig({ rows: 8, columns: 12 });
    
    mockWidgetFactory = {
      widgetTypeid: 'test-widget',
      createComponent: jasmine.createSpy()
    } as any;

    mockDashboardService.getFactory.and.returnValue(mockWidgetFactory);
  });

  describe('exportDashboard', () => {
    it('should export empty dashboard', () => {
      const exported = store.exportDashboard();

      expect(exported).toEqual({
        version: '1.0.0',
        dashboardId: '',
        rows: 8,
        columns: 12,
        gutterSize: '0.5em',
        cells: []
      });
    });

    it('should export dashboard with single widget', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 4),
        row: 3,
        col: 4,
        rowSpan: 2,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: { color: 'red' },
        flat: true,
      };

      store.addWidget(cell);
      const exported = store.exportDashboard();

      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0]).toEqual({
        row: 3,
        col: 4,
        rowSpan: 2,
        colSpan: 3,
        flat: true,
        widgetTypeid: 'test-widget',
        widgetState: { color: 'red' },
      });
    });

    it('should export dashboard with multiple widgets', () => {
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
        cellId: CellIdUtils.create(5, 8),
        row: 5,
        col: 8,
        rowSpan: 2,
        colSpan: 4,
        widgetFactory: mockWidgetFactory,
        widgetState: { size: 'large' },
        flat: false,
      };

      store.addWidget(cell1);
      store.addWidget(cell2);
      const exported = store.exportDashboard();

      expect(exported.cells.length).toBe(2);
      expect(exported.cells).toContain(jasmine.objectContaining({
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        flat: undefined,
        widgetTypeid: 'test-widget',
        widgetState: {},
      }));
      expect(exported.cells).toContain(jasmine.objectContaining({
        row: 5,
        col: 8,
        rowSpan: 2,
        colSpan: 4,
        flat: false,
        widgetTypeid: 'test-widget',
        widgetState: { size: 'large' },
      }));
    });

    it('should export custom grid configuration', () => {
      store.setGridConfig({ rows: 20, columns: 30, gutterSize: '2rem' });
      const exported = store.exportDashboard();

      expect(exported.rows).toBe(20);
      expect(exported.columns).toBe(30);
      expect(exported.gutterSize).toBe('2rem');
    });
  });

  describe('loadDashboard', () => {
    it('should load empty dashboard', () => {
      const data: DashboardDataDto = {
        version: '1.0.0',
        dashboardId: 'test-dashboard-1',
        rows: 10,
        columns: 15,
        gutterSize: '1em',
        cells: []
      };

      store.loadDashboard(data);

      expect(store.rows()).toBe(10);
      expect(store.columns()).toBe(15);
      expect(store.gutterSize()).toBe('1em');
      expect(store.cells()).toEqual([]);
    });

    it('should load dashboard with single widget', () => {
      const data: DashboardDataDto = {
        version: '1.0.0',
        dashboardId: 'test-dashboard-2',
        rows: 8,
        columns: 12,
        gutterSize: '0.5em',
        cells: [{
          row: 5,
          col: 7,
          rowSpan: 3,
          colSpan: 2,
          flat: true,
          widgetTypeid: 'test-widget',
          widgetState: { text: 'Hello World' },
        }]
      };

      store.loadDashboard(data);

      expect(store.cells().length).toBe(1);
      const loadedCell = store.cells()[0];
      expect(loadedCell.row).toBe(5);
      expect(loadedCell.col).toBe(7);
      expect(loadedCell.rowSpan).toBe(3);
      expect(loadedCell.colSpan).toBe(2);
      expect(loadedCell.flat).toBe(true);
      expect(loadedCell.widgetFactory).toBe(mockWidgetFactory);
      expect(loadedCell.widgetState).toEqual({ text: 'Hello World' });
      expect(loadedCell.cellId).toEqual(CellIdUtils.create(5, 7));
    });

    it('should load dashboard with multiple widgets', () => {
      const data: DashboardDataDto = {
        version: '1.0.0',
        dashboardId: 'test-dashboard-3',
        rows: 16,
        columns: 16,
        gutterSize: '0.25em',
        cells: [
          {
            row: 2,
            col: 3,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'test-widget',
            widgetState: {},
          },
          {
            row: 8,
            col: 10,
            rowSpan: 4,
            colSpan: 5,
            flat: false,
            widgetTypeid: 'test-widget',
            widgetState: { config: 'advanced' },
          }
        ]
      };

      store.loadDashboard(data);

      expect(store.rows()).toBe(16);
      expect(store.columns()).toBe(16);
      expect(store.gutterSize()).toBe('0.25em');
      expect(store.cells().length).toBe(2);
    });

    it('should create fallback widgets for unknown widget types', () => {
      const consoleSpy = spyOn(console, 'warn');
      const fallbackFactory = {
        widgetTypeid: '__internal/unknown-widget',
        createInstance: jasmine.createSpy()
      } as any;
      
      // Call the real getFactory method which handles fallback logic
      mockDashboardService.getFactory.and.callFake((widgetTypeid: string) => {
        if (widgetTypeid === 'unknown-widget' || widgetTypeid === 'another-unknown-widget') {
          console.warn(`Unknown widget type: ${widgetTypeid}, using fallback error widget`);
          return fallbackFactory;
        }
        return mockWidgetFactory;
      });

      const data: DashboardDataDto = {
        version: '1.0.0',
        dashboardId: 'test-dashboard-4',
        rows: 8,
        columns: 12,
        gutterSize: '0.5em',
        cells: [
          {
            row: 1,
            col: 1,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'unknown-widget',
            widgetState: {},
          },
          {
            row: 5,
            col: 5,
            rowSpan: 2,
            colSpan: 2,
            widgetTypeid: 'another-unknown-widget',
            widgetState: {},
          }
        ]
      };

      store.loadDashboard(data);

      expect(store.cells().length).toBe(2); // Fallback widgets created instead of skipped
      expect(consoleSpy).toHaveBeenCalledWith('Unknown widget type: unknown-widget, using fallback error widget');
      expect(consoleSpy).toHaveBeenCalledWith('Unknown widget type: another-unknown-widget, using fallback error widget');
    });

    it('should load mixed valid and invalid widgets', () => {
      const consoleSpy = spyOn(console, 'warn');
      const fallbackFactory = {
        widgetTypeid: '__internal/unknown-widget',
        createInstance: jasmine.createSpy()
      } as any;
      
      // Mock factory to return fallback for unknown widgets with console warning
      mockDashboardService.getFactory.and.callFake((widgetTypeid: string) => {
        if (widgetTypeid === 'unknown-widget') {
          console.warn(`Unknown widget type: ${widgetTypeid}, using fallback error widget`);
          return fallbackFactory;
        }
        return mockWidgetFactory;
      });

      const data: DashboardDataDto = {
        version: '1.0.0',
        dashboardId: 'test-dashboard-5',
        rows: 8,
        columns: 12,
        gutterSize: '0.5em',
        cells: [
          {
            row: 1,
            col: 1,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'test-widget',
            widgetState: {},
          },
          {
            row: 3,
            col: 3,
            rowSpan: 1,
            colSpan: 1,
            widgetTypeid: 'unknown-widget',
            widgetState: {},
          },
          {
            row: 5,
            col: 5,
            rowSpan: 2,
            colSpan: 2,
            widgetTypeid: 'test-widget',
            widgetState: {},
          }
        ]
      };

      store.loadDashboard(data);

      expect(store.cells().length).toBe(3); // All widgets loaded (2 valid + 1 fallback)
      expect(consoleSpy).toHaveBeenCalledWith('Unknown widget type: unknown-widget, using fallback error widget');
    });

    it('should replace existing dashboard content', () => {
      // Add initial content
      const initialCell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(initialCell);
      expect(store.cells().length).toBe(1);

      // Load new data
      const data: DashboardDataDto = {
        version: '1.0.0',
        dashboardId: 'test-dashboard-6',
        rows: 20,
        columns: 25,
        gutterSize: '3rem',
        cells: [
          {
            row: 10,
            col: 15,
            rowSpan: 3,
            colSpan: 4,
            widgetTypeid: 'test-widget',
            widgetState: { replaced: true },
          }
        ]
      };

      store.loadDashboard(data);

      expect(store.rows()).toBe(20);
      expect(store.columns()).toBe(25);
      expect(store.gutterSize()).toBe('3rem');
      expect(store.cells().length).toBe(1);
      expect(store.cells()[0].row).toBe(10);
      expect(store.cells()[0].col).toBe(15);
      expect(store.cells()[0].widgetState).toEqual({ replaced: true });
    });
  });

  describe('exportDashboard - UnknownWidget filtering', () => {
    let unknownWidgetFactory: WidgetFactory;

    beforeEach(() => {
      unknownWidgetFactory = {
        widgetTypeid: '__internal/unknown-widget',
        name: 'Unknown Widget',
        description: 'Fallback widget',
        svgIcon: '<svg></svg>',
        createInstance: jasmine.createSpy()
      } as any;
    });

    it('should exclude UnknownWidgetComponent from export', () => {
      const validCell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { valid: true },
      };

      const unknownCell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 2),
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: unknownWidgetFactory,
        widgetState: { originalWidgetTypeid: 'missing-widget' },
      };

      store.addWidget(validCell);
      store.addWidget(unknownCell);
      
      expect(store.cells().length).toBe(2); // Both widgets added to store

      const exported = store.exportDashboard();

      expect(exported.cells.length).toBe(1); // Only valid widget exported
      expect(exported.cells[0]).toEqual({
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        flat: undefined,
        widgetTypeid: 'test-widget',
        widgetState: { valid: true },
      });
    });

    it('should export empty dashboard when only unknown widgets present', () => {
      const unknownCell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: unknownWidgetFactory,
        widgetState: { originalWidgetTypeid: 'widget-a' },
      };

      const unknownCell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 3),
        row: 3,
        col: 3,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: unknownWidgetFactory,
        widgetState: { originalWidgetTypeid: 'widget-b' },
      };

      store.addWidget(unknownCell1);
      store.addWidget(unknownCell2);
      
      expect(store.cells().length).toBe(2); // Both unknown widgets added to store

      const exported = store.exportDashboard();

      expect(exported.cells.length).toBe(0); // No widgets exported
      expect(exported.cells).toEqual([]);
    });

    it('should preserve valid widgets while filtering unknown widgets in mixed scenario', () => {
      const validCell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { type: 'first' },
      };

      const unknownCell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 2),
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: unknownWidgetFactory,
        widgetState: { originalWidgetTypeid: 'missing' },
      };

      const validCell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 3),
        row: 3,
        col: 3,
        rowSpan: 2,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: { type: 'second' },
        flat: true,
      };

      store.addWidget(validCell1);
      store.addWidget(unknownCell);
      store.addWidget(validCell2);
      
      expect(store.cells().length).toBe(3); // All widgets added to store

      const exported = store.exportDashboard();

      expect(exported.cells.length).toBe(2); // Only valid widgets exported
      expect(exported.cells).toContain(jasmine.objectContaining({
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        flat: undefined,
        widgetTypeid: 'test-widget',
        widgetState: { type: 'first' },
      }));
      expect(exported.cells).toContain(jasmine.objectContaining({
        row: 3,
        col: 3,
        rowSpan: 2,
        colSpan: 3,
        flat: true,
        widgetTypeid: 'test-widget',
        widgetState: { type: 'second' },
      }));
    });

    it('should filter unknown widgets with live widget states callback', () => {
      const validCell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { stale: 'data' },
      };

      const unknownCell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 2),
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: unknownWidgetFactory,
        widgetState: { originalWidgetTypeid: 'missing' },
      };

      store.addWidget(validCell);
      store.addWidget(unknownCell);

      // Mock live widget states for both valid and unknown widgets
      const liveStates = new Map<string, unknown>();
      liveStates.set('1-1', { live: 'valid-data' });
      liveStates.set('2-2', { live: 'unknown-data' }); // This should be ignored

      const exported = store.exportDashboard(() => liveStates);

      expect(exported.cells.length).toBe(1); // Only valid widget exported
      expect(exported.cells[0]).toEqual({
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        flat: undefined,
        widgetTypeid: 'test-widget',
        widgetState: { live: 'valid-data' }, // Uses live state for valid widget
      });
    });

    it('should maintain grid configuration when filtering unknown widgets', () => {
      store.setGridConfig({ rows: 15, columns: 20, gutterSize: '2em' });

      const unknownCell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: unknownWidgetFactory,
        widgetState: { originalWidgetTypeid: 'gone' },
      };

      store.addWidget(unknownCell);

      const exported = store.exportDashboard();

      expect(exported.rows).toBe(15);
      expect(exported.columns).toBe(20);
      expect(exported.gutterSize).toBe('2em');
      expect(exported.cells.length).toBe(0); // Unknown widget filtered out
    });
  });

  describe('exportDashboard with live widget states', () => {
    let mockWidget: jasmine.SpyObj<Widget>;

    beforeEach(() => {
      mockWidget = jasmine.createSpyObj('Widget', ['dashboardGetState', 'dashboardSetState']);
    });

    it('should export with live widget states when callback provided', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 3),
        row: 2,
        col: 3,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { stale: 'data' }, // This should be ignored
        flat: false,
      };

      store.addWidget(cell);

      // Mock live widget states
      const liveStates = new Map<string, unknown>();
      liveStates.set('2-3', { fresh: 'data', updated: true });

      const exported = store.exportDashboard(() => liveStates);

      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0]).toEqual({
        row: 2,
        col: 3,
        rowSpan: 1,
        colSpan: 1,
        flat: false,
        widgetTypeid: 'test-widget',
        widgetState: { fresh: 'data', updated: true }, // Uses live state
      });
    });

    it('should fall back to stored state when live state not available', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(4, 5),
        row: 4,
        col: 5,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: { fallback: 'state' },
        flat: true,
      };

      store.addWidget(cell);

      // Mock live widget states that don't include this cell
      const liveStates = new Map<string, unknown>();
      liveStates.set('1-1', { other: 'widget' });

      const exported = store.exportDashboard(() => liveStates);

      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0]).toEqual({
        row: 4,
        col: 5,
        rowSpan: 2,
        colSpan: 2,
        flat: true,
        widgetTypeid: 'test-widget',
        widgetState: { fallback: 'state' }, // Uses stored state
      });
    });

    it('should handle mixed live and stored states', () => {
      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { stored: 'state1' },
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(2, 2),
        row: 2,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { stored: 'state2' },
      };

      store.addWidget(cell1);
      store.addWidget(cell2);

      // Only provide live state for one cell
      const liveStates = new Map<string, unknown>();
      liveStates.set('1-1', { live: 'state1', modified: true });

      const exported = store.exportDashboard(() => liveStates);

      expect(exported.cells.length).toBe(2);
      
      const cell1Export = exported.cells.find(c => c.row === 1 && c.col === 1);
      const cell2Export = exported.cells.find(c => c.row === 2 && c.col === 2);
      
      expect(cell1Export?.widgetState).toEqual({ live: 'state1', modified: true });
      expect(cell2Export?.widgetState).toEqual({ stored: 'state2' });
    });

    it('should work without callback (backward compatibility)', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 4),
        row: 3,
        col: 4,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { original: 'state' },
      };

      store.addWidget(cell);

      const exported = store.exportDashboard();

      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0]).toEqual({
        row: 3,
        col: 4,
        rowSpan: 1,
        colSpan: 1,
        flat: undefined,
        widgetTypeid: 'test-widget',
        widgetState: { original: 'state' },
      });
    });

    it('should handle empty live states map', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 2),
        row: 1,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { default: 'state' },
      };

      store.addWidget(cell);

      const exported = store.exportDashboard(() => new Map());

      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetState).toEqual({ default: 'state' });
    });

    it('should handle undefined widget states', () => {
      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 6),
        row: 5,
        col: 6,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { existing: 'state' },
      };

      store.addWidget(cell);

      const liveStates = new Map<string, unknown>();
      liveStates.set('5-6', undefined);

      const exported = store.exportDashboard(() => liveStates);

      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetState).toEqual({ existing: 'state' });
    });
  });
});