import { TestBed } from '@angular/core/testing';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardStore } from '../dashboard-store';
import {
  CellIdUtils,
  WidgetIdUtils,
  CellData,
  WidgetFactory,
  DashboardDataDto,
  GridSelection,
  UNKNOWN_WIDGET_TYPEID,
} from '../../models';

describe('DashboardStore - Export/Import Functionality', () => {
  let store: InstanceType<typeof DashboardStore>;
  let mockWidgetFactory: WidgetFactory;
  let mockDashboardService: jasmine.SpyObj<DashboardService>;

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

    mockWidgetFactory = {
      widgetTypeid: 'test-widget',
      createComponent: jasmine.createSpy(),
    } as unknown as WidgetFactory;

    mockDashboardService.getFactory.and.returnValue(mockWidgetFactory);
    mockDashboardService.collectSharedStates.and.returnValue(new Map());
    mockDashboardService.restoreSharedStates.and.stub();
  });

  describe('exportDashboard', () => {
    it('should export empty dashboard', () => {
      const exported = store.exportDashboard();

      expect(exported).toEqual({
        version: '1.1.0',
        dashboardId: '',
        rows: 8,
        columns: 12,
        gutterSize: '0.5em',
        cells: [],
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
      expect(exported.cells).toContain(
        jasmine.objectContaining({
          row: 1,
          col: 1,
          rowSpan: 1,
          colSpan: 1,
          flat: undefined,
          widgetTypeid: 'test-widget',
          widgetState: {},
        })
      );
      expect(exported.cells).toContain(
        jasmine.objectContaining({
          row: 5,
          col: 8,
          rowSpan: 2,
          colSpan: 4,
          flat: false,
          widgetTypeid: 'test-widget',
          widgetState: { size: 'large' },
        })
      );
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
        version: '1.1.0',
        dashboardId: 'test-dashboard-1',
        rows: 10,
        columns: 15,
        gutterSize: '1em',
        cells: [],
      };

      store.loadDashboard(data);

      expect(store.rows()).toBe(10);
      expect(store.columns()).toBe(15);
      expect(store.gutterSize()).toBe('1em');
      expect(store.cells()).toEqual([]);
    });

    it('should load dashboard with single widget', () => {
      const data: DashboardDataDto = {
        version: '1.1.0',
        dashboardId: 'test-dashboard-2',
        rows: 8,
        columns: 12,
        gutterSize: '0.5em',
        cells: [
          {
            row: 5,
            col: 7,
            rowSpan: 3,
            colSpan: 2,
            flat: true,
            widgetTypeid: 'test-widget',
            widgetState: { text: 'Hello World' },
          },
        ],
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
        version: '1.1.0',
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
          },
        ],
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
        widgetTypeid: UNKNOWN_WIDGET_TYPEID,
        createInstance: jasmine.createSpy(),
      } as unknown as WidgetFactory;

      // Call the real getFactory method which handles fallback logic
      mockDashboardService.getFactory.and.callFake((widgetTypeid: string) => {
        if (
          widgetTypeid === 'unknown-widget' ||
          widgetTypeid === 'another-unknown-widget'
        ) {
          console.warn(
            `Unknown widget type: ${widgetTypeid}, using fallback error widget`
          );
          return fallbackFactory;
        }
        return mockWidgetFactory;
      });

      const data: DashboardDataDto = {
        version: '1.1.0',
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
          },
        ],
      };

      store.loadDashboard(data);

      expect(store.cells().length).toBe(2); // Fallback widgets created instead of skipped
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown widget type: unknown-widget, using fallback error widget'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown widget type: another-unknown-widget, using fallback error widget'
      );
    });

    it('should load mixed valid and invalid widgets', () => {
      const consoleSpy = spyOn(console, 'warn');
      const fallbackFactory = {
        widgetTypeid: UNKNOWN_WIDGET_TYPEID,
        createInstance: jasmine.createSpy(),
      } as unknown as WidgetFactory;

      // Mock factory to return fallback for unknown widgets with console warning
      mockDashboardService.getFactory.and.callFake((widgetTypeid: string) => {
        if (widgetTypeid === 'unknown-widget') {
          console.warn(
            `Unknown widget type: ${widgetTypeid}, using fallback error widget`
          );
          return fallbackFactory;
        }
        return mockWidgetFactory;
      });

      const data: DashboardDataDto = {
        version: '1.1.0',
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
          },
        ],
      };

      store.loadDashboard(data);

      expect(store.cells().length).toBe(3); // All widgets loaded (2 valid + 1 fallback)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Unknown widget type: unknown-widget, using fallback error widget'
      );
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
        version: '1.1.0',
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
          },
        ],
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
        widgetTypeid: UNKNOWN_WIDGET_TYPEID,
        name: 'Unknown Widget',
        description: 'Fallback widget',
        svgIcon: '<svg></svg>',
        createInstance: jasmine.createSpy(),
      } as unknown as WidgetFactory;
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
      expect(exported.cells).toContain(
        jasmine.objectContaining({
          row: 1,
          col: 1,
          rowSpan: 1,
          colSpan: 1,
          flat: undefined,
          widgetTypeid: 'test-widget',
          widgetState: { type: 'first' },
        })
      );
      expect(exported.cells).toContain(
        jasmine.objectContaining({
          row: 3,
          col: 3,
          rowSpan: 2,
          colSpan: 3,
          flat: true,
          widgetTypeid: 'test-widget',
          widgetState: { type: 'second' },
        })
      );
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

      const cell1Export = exported.cells.find(
        (c) => c.row === 1 && c.col === 1
      );
      const cell2Export = exported.cells.find(
        (c) => c.row === 2 && c.col === 2
      );

      expect(cell1Export?.widgetState).toEqual({
        live: 'state1',
        modified: true,
      });
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

  describe('exportDashboard with GridSelection (selection export)', () => {
    it('should export empty selection with correct dimensions', () => {
      store.setGridConfig({ rows: 8, columns: 16 });

      const selection: GridSelection = {
        topLeft: { row: 2, col: 3 },
        bottomRight: { row: 4, col: 6 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.rows).toBe(3); // 4 - 2 + 1 = 3
      expect(exported.columns).toBe(4); // 6 - 3 + 1 = 4
      expect(exported.cells).toEqual([]);
    });

    it('should export single widget completely within selection', () => {
      store.setGridConfig({ rows: 8, columns: 16 });

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 5),
        row: 3,
        col: 5,
        rowSpan: 1,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: { color: 'blue' },
        flat: true,
      };

      store.addWidget(cell);

      const selection: GridSelection = {
        topLeft: { row: 2, col: 4 },
        bottomRight: { row: 5, col: 8 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.rows).toBe(4); // 5 - 2 + 1
      expect(exported.columns).toBe(5); // 8 - 4 + 1
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0]).toEqual({
        row: 2, // 3 - (2 - 1) = 2
        col: 2, // 5 - (4 - 1) = 2
        rowSpan: 1,
        colSpan: 2,
        flat: true,
        widgetTypeid: 'test-widget',
        widgetState: { color: 'blue' },
      });
    });

    it('should exclude widget that starts outside selection', () => {
      store.setGridConfig({ rows: 8, columns: 16 });

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 3),
        row: 1,
        col: 3,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);

      // Selection starts at row 2, but widget starts at row 1
      const selection: GridSelection = {
        topLeft: { row: 2, col: 2 },
        bottomRight: { row: 5, col: 6 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.cells.length).toBe(0);
    });

    it('should exclude widget that extends outside selection', () => {
      store.setGridConfig({ rows: 8, columns: 16 });

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 5),
        row: 3,
        col: 5,
        rowSpan: 3,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };

      store.addWidget(cell);

      // Widget extends from row 3 to row 5 (inclusive), but selection ends at row 4
      const selection: GridSelection = {
        topLeft: { row: 2, col: 4 },
        bottomRight: { row: 4, col: 8 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.cells.length).toBe(0);
    });

    it('should export multiple widgets within selection with correct coordinate transformation', () => {
      store.setGridConfig({ rows: 10, columns: 12 });

      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 4),
        row: 3,
        col: 4,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { id: 'widget1' },
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 7),
        row: 5,
        col: 7,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: { id: 'widget2' },
        flat: true,
      };

      const cell3: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(4, 5),
        row: 4,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { id: 'widget3' },
      };

      store.addWidget(cell1);
      store.addWidget(cell2);
      store.addWidget(cell3);

      const selection: GridSelection = {
        topLeft: { row: 3, col: 4 },
        bottomRight: { row: 6, col: 8 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.rows).toBe(4); // 6 - 3 + 1
      expect(exported.columns).toBe(5); // 8 - 4 + 1
      expect(exported.cells.length).toBe(3);

      // Check coordinate transformations
      const widget1 = exported.cells.find(
        (c) => (c.widgetState as any).id === 'widget1'
      );
      expect(widget1).toEqual({
        row: 1, // 3 - (3 - 1) = 1
        col: 1, // 4 - (4 - 1) = 1
        rowSpan: 1,
        colSpan: 1,
        flat: undefined,
        widgetTypeid: 'test-widget',
        widgetState: { id: 'widget1' },
      });

      const widget2 = exported.cells.find(
        (c) => (c.widgetState as any).id === 'widget2'
      );
      expect(widget2).toEqual({
        row: 3, // 5 - (3 - 1) = 3
        col: 4, // 7 - (4 - 1) = 4
        rowSpan: 2,
        colSpan: 2,
        flat: true,
        widgetTypeid: 'test-widget',
        widgetState: { id: 'widget2' },
      });

      const widget3 = exported.cells.find(
        (c) => (c.widgetState as any).id === 'widget3'
      );
      expect(widget3).toEqual({
        row: 2, // 4 - (3 - 1) = 2
        col: 2, // 5 - (4 - 1) = 2
        rowSpan: 1,
        colSpan: 1,
        flat: undefined,
        widgetTypeid: 'test-widget',
        widgetState: { id: 'widget3' },
      });
    });

    it('should handle 1x1 selection (single cell)', () => {
      store.setGridConfig({ rows: 8, columns: 16 });

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 7),
        row: 5,
        col: 7,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { single: true },
      };

      store.addWidget(cell);

      const selection: GridSelection = {
        topLeft: { row: 5, col: 7 },
        bottomRight: { row: 5, col: 7 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.rows).toBe(1);
      expect(exported.columns).toBe(1);
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0]).toEqual({
        row: 1, // 5 - (5 - 1) = 1
        col: 1, // 7 - (7 - 1) = 1
        rowSpan: 1,
        colSpan: 1,
        flat: undefined,
        widgetTypeid: 'test-widget',
        widgetState: { single: true },
      });
    });

    it('should handle full dashboard selection (same as no selection)', () => {
      store.setGridConfig({ rows: 4, columns: 6 });

      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { pos: 'top-left' },
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(4, 6),
        row: 4,
        col: 6,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { pos: 'bottom-right' },
      };

      store.addWidget(cell1);
      store.addWidget(cell2);

      const selection: GridSelection = {
        topLeft: { row: 1, col: 1 },
        bottomRight: { row: 4, col: 6 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.rows).toBe(4);
      expect(exported.columns).toBe(6);
      expect(exported.cells.length).toBe(2);

      // Coordinates should remain the same when selection matches full dashboard
      expect(exported.cells).toContain(
        jasmine.objectContaining({
          row: 1,
          col: 1,
          widgetState: { pos: 'top-left' },
        })
      );
      expect(exported.cells).toContain(
        jasmine.objectContaining({
          row: 4,
          col: 6,
          widgetState: { pos: 'bottom-right' },
        })
      );
    });

    it('should handle widget spanning multiple cells within selection', () => {
      store.setGridConfig({ rows: 10, columns: 12 });

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 5),
        row: 3,
        col: 5,
        rowSpan: 3,
        colSpan: 4,
        widgetFactory: mockWidgetFactory,
        widgetState: { large: true },
        flat: false,
      };

      store.addWidget(cell);

      const selection: GridSelection = {
        topLeft: { row: 2, col: 4 },
        bottomRight: { row: 7, col: 10 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.rows).toBe(6); // 7 - 2 + 1
      expect(exported.columns).toBe(7); // 10 - 4 + 1
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0]).toEqual({
        row: 2, // 3 - (2 - 1) = 2
        col: 2, // 5 - (4 - 1) = 2
        rowSpan: 3,
        colSpan: 4,
        flat: false,
        widgetTypeid: 'test-widget',
        widgetState: { large: true },
      });
    });

    it('should exclude widgets outside selection bounds', () => {
      store.setGridConfig({ rows: 10, columns: 12 });

      const widgetInside: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(4, 5),
        row: 4,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { position: 'inside' },
      };

      const widgetAbove: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 5),
        row: 1,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { position: 'above' },
      };

      const widgetBelow: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(8, 5),
        row: 8,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { position: 'below' },
      };

      const widgetLeft: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(4, 2),
        row: 4,
        col: 2,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { position: 'left' },
      };

      const widgetRight: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(4, 9),
        row: 4,
        col: 9,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { position: 'right' },
      };

      store.addWidget(widgetInside);
      store.addWidget(widgetAbove);
      store.addWidget(widgetBelow);
      store.addWidget(widgetLeft);
      store.addWidget(widgetRight);

      const selection: GridSelection = {
        topLeft: { row: 3, col: 4 },
        bottomRight: { row: 6, col: 8 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetState).toEqual({ position: 'inside' });
    });

    it('should export selection with live widget states', () => {
      store.setGridConfig({ rows: 8, columns: 12 });

      const cell1: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 4),
        row: 3,
        col: 4,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { stale: 'data1' },
      };

      const cell2: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(5, 6),
        row: 5,
        col: 6,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { stale: 'data2' },
      };

      store.addWidget(cell1);
      store.addWidget(cell2);

      const liveStates = new Map<string, unknown>();
      liveStates.set('3-4', { fresh: 'live1' });
      liveStates.set('5-6', { fresh: 'live2' });

      const selection: GridSelection = {
        topLeft: { row: 3, col: 4 },
        bottomRight: { row: 6, col: 8 },
      };

      const exported = store.exportDashboard(() => liveStates, selection);

      expect(exported.cells.length).toBe(2);
      expect(exported.cells[0].widgetState).toEqual({ fresh: 'live1' });
      expect(exported.cells[1].widgetState).toEqual({ fresh: 'live2' });
    });

    it('should filter unknown widgets when exporting selection', () => {
      store.setGridConfig({ rows: 8, columns: 12 });

      const unknownWidgetFactory: WidgetFactory = {
        widgetTypeid: UNKNOWN_WIDGET_TYPEID,
        createInstance: jasmine.createSpy(),
      } as unknown as WidgetFactory;

      const validCell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 4),
        row: 3,
        col: 4,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { valid: true },
      };

      const unknownCell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(4, 5),
        row: 4,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: unknownWidgetFactory,
        widgetState: { unknown: true },
      };

      store.addWidget(validCell);
      store.addWidget(unknownCell);

      const selection: GridSelection = {
        topLeft: { row: 2, col: 3 },
        bottomRight: { row: 6, col: 8 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0].widgetState).toEqual({ valid: true });
    });

    it('should preserve gutterSize when exporting selection', () => {
      store.setGridConfig({ rows: 10, columns: 15, gutterSize: '2.5rem' });

      const selection: GridSelection = {
        topLeft: { row: 3, col: 5 },
        bottomRight: { row: 7, col: 10 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.gutterSize).toBe('2.5rem');
      expect(exported.rows).toBe(5);
      expect(exported.columns).toBe(6);
    });

    it('should handle selection export with widgets at exact boundaries', () => {
      store.setGridConfig({ rows: 8, columns: 12 });

      const topLeftWidget: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(3, 4),
        row: 3,
        col: 4,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { corner: 'top-left' },
      };

      const bottomRightWidget: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(6, 8),
        row: 6,
        col: 8,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { corner: 'bottom-right' },
      };

      store.addWidget(topLeftWidget);
      store.addWidget(bottomRightWidget);

      const selection: GridSelection = {
        topLeft: { row: 3, col: 4 },
        bottomRight: { row: 6, col: 8 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.rows).toBe(4);
      expect(exported.columns).toBe(5);
      expect(exported.cells.length).toBe(2);

      expect(exported.cells).toContain(
        jasmine.objectContaining({
          row: 1,
          col: 1,
          widgetState: { corner: 'top-left' },
        })
      );

      expect(exported.cells).toContain(
        jasmine.objectContaining({
          row: 4,
          col: 5,
          widgetState: { corner: 'bottom-right' },
        })
      );
    });

    it('should handle inverted selection coordinates (bottomRight < topLeft)', () => {
      store.setGridConfig({ rows: 8, columns: 12 });

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(4, 5),
        row: 4,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { test: 'inverted-region' },
      };

      store.addWidget(cell);

      // Invalid selection: bottomRight coordinates less than topLeft
      const selection: GridSelection = {
        topLeft: { row: 6, col: 8 },
        bottomRight: { row: 3, col: 4 },
      };

      const exported = store.exportDashboard(undefined, selection);

      // Implementation produces negative dimensions and no widgets
      expect(exported.rows).toBeLessThan(0);
      expect(exported.columns).toBeLessThan(0);
      expect(exported.cells.length).toBe(0);
    });

    it('should handle selection extending beyond grid boundaries', () => {
      store.setGridConfig({ rows: 8, columns: 12 });

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(7, 11),
        row: 7,
        col: 11,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: { edge: true },
      };

      store.addWidget(cell);

      // Selection extends beyond grid (grid is 8x12, selection goes to 10x15)
      const selection: GridSelection = {
        topLeft: { row: 6, col: 10 },
        bottomRight: { row: 10, col: 15 },
      };

      const exported = store.exportDashboard(undefined, selection);

      // Should calculate dimensions regardless of grid bounds
      expect(exported.rows).toBe(5); // 10 - 6 + 1
      expect(exported.columns).toBe(6); // 15 - 10 + 1
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0]).toEqual({
        row: 2, // 7 - (6 - 1) = 2
        col: 2, // 11 - (10 - 1) = 2
        rowSpan: 1,
        colSpan: 1,
        flat: undefined,
        widgetTypeid: 'test-widget',
        widgetState: { edge: true },
      });
    });

    it('should handle empty 1x1 selection with no widgets', () => {
      store.setGridConfig({ rows: 8, columns: 12 });

      // No widgets added

      const selection: GridSelection = {
        topLeft: { row: 4, col: 6 },
        bottomRight: { row: 4, col: 6 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.rows).toBe(1);
      expect(exported.columns).toBe(1);
      expect(exported.cells).toEqual([]);
    });

    it('should handle selection starting at origin (row/col 1) with no offset', () => {
      store.setGridConfig({ rows: 8, columns: 12 });

      const cell: CellData = {
        widgetId: WidgetIdUtils.generate(),
        cellId: CellIdUtils.create(1, 1),
        row: 1,
        col: 1,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: { position: 'origin' },
      };

      store.addWidget(cell);

      const selection: GridSelection = {
        topLeft: { row: 1, col: 1 },
        bottomRight: { row: 3, col: 3 },
      };

      const exported = store.exportDashboard(undefined, selection);

      expect(exported.rows).toBe(3);
      expect(exported.columns).toBe(3);
      expect(exported.cells.length).toBe(1);
      expect(exported.cells[0]).toEqual({
        row: 1, // 1 - (1 - 1) = 1 (no offset)
        col: 1, // 1 - (1 - 1) = 1 (no offset)
        rowSpan: 2,
        colSpan: 2,
        flat: undefined,
        widgetTypeid: 'test-widget',
        widgetState: { position: 'origin' },
      });
    });
  });

  describe('exportDashboard with SelectionFilterOptions (useMinimalBounds)', () => {
    let unknownWidgetFactory: WidgetFactory;

    beforeEach(() => {
      store.setGridConfig({ rows: 12, columns: 16 });
      unknownWidgetFactory = {
        widgetTypeid: UNKNOWN_WIDGET_TYPEID,
        name: 'Unknown Widget',
        description: 'Fallback widget',
        svgIcon: '<svg></svg>',
        createInstance: jasmine.createSpy(),
      } as unknown as WidgetFactory;
    });

    describe('Basic parameter variations', () => {
      it('should use selection bounds exactly when useMinimalBounds is false', () => {
        const cell1: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(3, 5),
          row: 3,
          col: 5,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: { id: 'widget1' },
        };

        const cell2: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(7, 10),
          row: 7,
          col: 10,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: { id: 'widget2' },
        };

        store.addWidget(cell1);
        store.addWidget(cell2);

        // Large selection with gaps between widgets
        const selection: GridSelection = {
          topLeft: { row: 2, col: 4 },
          bottomRight: { row: 10, col: 12 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: false,
        });

        // Should use full selection bounds, not minimal
        expect(exported.rows).toBe(9); // 10 - 2 + 1
        expect(exported.columns).toBe(9); // 12 - 4 + 1
        expect(exported.cells.length).toBe(2);

        // Verify coordinates use full selection bounds
        const widget1 = exported.cells.find(
          (c) => (c.widgetState as any).id === 'widget1'
        );
        const widget2 = exported.cells.find(
          (c) => (c.widgetState as any).id === 'widget2'
        );

        expect(widget1?.row).toBe(2); // 3 - (2 - 1)
        expect(widget1?.col).toBe(2); // 5 - (4 - 1)
        expect(widget2?.row).toBe(6); // 7 - (2 - 1)
        expect(widget2?.col).toBe(7); // 10 - (4 - 1)
      });

      it('should shrink to minimal bounding box when useMinimalBounds is true', () => {
        const cell1: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(3, 5),
          row: 3,
          col: 5,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: { id: 'widget1' },
        };

        const cell2: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(7, 10),
          row: 7,
          col: 10,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: { id: 'widget2' },
        };

        store.addWidget(cell1);
        store.addWidget(cell2);

        // Large selection with gaps between widgets
        const selection: GridSelection = {
          topLeft: { row: 2, col: 4 },
          bottomRight: { row: 10, col: 12 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // Should shrink to minimal bounds (3-7 rows, 5-10 cols)
        expect(exported.rows).toBe(5); // 7 - 3 + 1
        expect(exported.columns).toBe(6); // 10 - 5 + 1
        expect(exported.cells.length).toBe(2);

        // Verify coordinates use minimal bounds
        const widget1 = exported.cells.find(
          (c) => (c.widgetState as any).id === 'widget1'
        );
        const widget2 = exported.cells.find(
          (c) => (c.widgetState as any).id === 'widget2'
        );

        expect(widget1?.row).toBe(1); // 3 - (3 - 1)
        expect(widget1?.col).toBe(1); // 5 - (5 - 1)
        expect(widget2?.row).toBe(5); // 7 - (3 - 1)
        expect(widget2?.col).toBe(6); // 10 - (5 - 1)
      });

      it('should behave identically to default when useMinimalBounds is false', () => {
        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(4, 6),
          row: 4,
          col: 6,
          rowSpan: 2,
          colSpan: 3,
          widgetFactory: mockWidgetFactory,
          widgetState: { test: 'data' },
          flat: true,
        };

        store.addWidget(cell);

        const selection: GridSelection = {
          topLeft: { row: 3, col: 5 },
          bottomRight: { row: 8, col: 10 },
        };

        const exportedDefault = store.exportDashboard(undefined, selection);
        const exportedExplicitFalse = store.exportDashboard(
          undefined,
          selection,
          { useMinimalBounds: false }
        );

        // Should produce identical results
        expect(exportedExplicitFalse.rows).toBe(exportedDefault.rows);
        expect(exportedExplicitFalse.columns).toBe(exportedDefault.columns);
        expect(exportedExplicitFalse.cells.length).toBe(
          exportedDefault.cells.length
        );
        expect(exportedExplicitFalse.cells[0]).toEqual(
          exportedDefault.cells[0]
        );
      });

      it('should ignore options when no selection is provided', () => {
        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(2, 3),
          row: 2,
          col: 3,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: { value: 42 },
        };

        store.addWidget(cell);

        // Export without selection but with options
        const exported = store.exportDashboard(undefined, undefined, {
          useMinimalBounds: true,
        });

        // Should export full dashboard (options ignored)
        expect(exported.rows).toBe(12);
        expect(exported.columns).toBe(16);
        expect(exported.cells.length).toBe(1);
        expect(exported.cells[0].row).toBe(2);
        expect(exported.cells[0].col).toBe(3);
      });
    });

    describe('Widget layout variations', () => {
      it('should handle scattered widgets with large gaps (useMinimalBounds: true)', () => {
        const widgets: CellData[] = [
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(2, 2),
            row: 2,
            col: 2,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { position: 'top-left' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(2, 10),
            row: 2,
            col: 10,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { position: 'top-right' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(10, 2),
            row: 10,
            col: 2,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { position: 'bottom-left' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(10, 10),
            row: 10,
            col: 10,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { position: 'bottom-right' },
          },
        ];

        widgets.forEach((w) => store.addWidget(w));

        const selection: GridSelection = {
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 12, col: 12 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // Should shrink significantly from 12x12 to 9x9 (widgets span row 2-10, col 2-10)
        expect(exported.rows).toBe(9); // 10 - 2 + 1
        expect(exported.columns).toBe(9); // 10 - 2 + 1
        expect(exported.cells.length).toBe(4);

        // Verify all widgets are in minimal coordinate space
        const topLeft = exported.cells.find(
          (c) => (c.widgetState as any).position === 'top-left'
        );
        const bottomRight = exported.cells.find(
          (c) => (c.widgetState as any).position === 'bottom-right'
        );

        expect(topLeft?.row).toBe(1); // 2 - (2 - 1)
        expect(topLeft?.col).toBe(1); // 2 - (2 - 1)
        expect(bottomRight?.row).toBe(9); // 10 - (2 - 1)
        expect(bottomRight?.col).toBe(9); // 10 - (2 - 1)
      });

      it('should handle tightly packed widgets (minimal bounds similar to selection)', () => {
        const widgets: CellData[] = [
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(3, 4),
            row: 3,
            col: 4,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: 'w1' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(3, 5),
            row: 3,
            col: 5,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: 'w2' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(4, 4),
            row: 4,
            col: 4,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: 'w3' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(4, 5),
            row: 4,
            col: 5,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: 'w4' },
          },
        ];

        widgets.forEach((w) => store.addWidget(w));

        // Selection closely matches widget bounds
        const selection: GridSelection = {
          topLeft: { row: 3, col: 4 },
          bottomRight: { row: 4, col: 5 },
        };

        const exportedFalse = store.exportDashboard(undefined, selection, {
          useMinimalBounds: false,
        });
        const exportedTrue = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // When tightly packed, both should produce identical results
        expect(exportedTrue.rows).toBe(exportedFalse.rows);
        expect(exportedTrue.columns).toBe(exportedFalse.columns);
        expect(exportedTrue.cells.length).toBe(4);
        expect(exportedFalse.cells.length).toBe(4);
      });

      it('should handle single widget centered in large selection', () => {
        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(6, 8),
          row: 6,
          col: 8,
          rowSpan: 2,
          colSpan: 3,
          widgetFactory: mockWidgetFactory,
          widgetState: { centered: true },
          flat: true,
        };

        store.addWidget(cell);

        const selection: GridSelection = {
          topLeft: { row: 2, col: 4 },
          bottomRight: { row: 10, col: 14 },
        };

        const exportedFalse = store.exportDashboard(undefined, selection, {
          useMinimalBounds: false,
        });
        const exportedTrue = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // With false: uses full selection (9x11)
        expect(exportedFalse.rows).toBe(9); // 10 - 2 + 1
        expect(exportedFalse.columns).toBe(11); // 14 - 4 + 1
        expect(exportedFalse.cells[0].row).toBe(5); // 6 - (2 - 1)
        expect(exportedFalse.cells[0].col).toBe(5); // 8 - (4 - 1)

        // With true: shrinks to widget size (2x3)
        expect(exportedTrue.rows).toBe(2); // Widget rowSpan
        expect(exportedTrue.columns).toBe(3); // Widget colSpan
        expect(exportedTrue.cells[0].row).toBe(1); // 6 - (6 - 1)
        expect(exportedTrue.cells[0].col).toBe(1); // 8 - (8 - 1)
        expect(exportedTrue.cells[0].rowSpan).toBe(2);
        expect(exportedTrue.cells[0].colSpan).toBe(3);
      });

      it('should handle widgets with spans across minimal bounds', () => {
        const widgets: CellData[] = [
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(3, 4),
            row: 3,
            col: 4,
            rowSpan: 3,
            colSpan: 2,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: 'wide' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(7, 8),
            row: 7,
            col: 8,
            rowSpan: 1,
            colSpan: 4,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: 'tall' },
          },
        ];

        widgets.forEach((w) => store.addWidget(w));

        const selection: GridSelection = {
          topLeft: { row: 2, col: 3 },
          bottomRight: { row: 10, col: 15 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // Widget1 spans to row 5, col 5
        // Widget2 spans to row 7, col 11
        // Minimal bounds: row 3-7, col 4-11
        expect(exported.rows).toBe(5); // 7 - 3 + 1
        expect(exported.columns).toBe(8); // 11 - 4 + 1
        expect(exported.cells.length).toBe(2);

        const wide = exported.cells.find(
          (c) => (c.widgetState as any).id === 'wide'
        );
        const tall = exported.cells.find(
          (c) => (c.widgetState as any).id === 'tall'
        );

        expect(wide?.row).toBe(1); // 3 - (3 - 1)
        expect(wide?.col).toBe(1); // 4 - (4 - 1)
        expect(wide?.rowSpan).toBe(3);
        expect(wide?.colSpan).toBe(2);

        expect(tall?.row).toBe(5); // 7 - (3 - 1)
        expect(tall?.col).toBe(5); // 8 - (4 - 1)
        expect(tall?.rowSpan).toBe(1);
        expect(tall?.colSpan).toBe(4);
      });
    });

    describe('Integration with other features', () => {
      it('should work with live widget states and useMinimalBounds: true', () => {
        const widgets: CellData[] = [
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(3, 5),
            row: 3,
            col: 5,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { stale: 'data1' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(7, 9),
            row: 7,
            col: 9,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { stale: 'data2' },
          },
        ];

        widgets.forEach((w) => store.addWidget(w));

        const liveStates = new Map<string, unknown>();
        liveStates.set('3-5', { fresh: 'live1', updated: true });
        liveStates.set('7-9', { fresh: 'live2', updated: true });

        const selection: GridSelection = {
          topLeft: { row: 2, col: 4 },
          bottomRight: { row: 10, col: 12 },
        };

        const exported = store.exportDashboard(() => liveStates, selection, {
          useMinimalBounds: true,
        });

        // Should shrink to minimal bounds and use live states
        expect(exported.rows).toBe(5); // 7 - 3 + 1
        expect(exported.columns).toBe(5); // 9 - 5 + 1
        expect(exported.cells.length).toBe(2);

        // Verify live states are used
        expect(exported.cells[0].widgetState).toEqual({
          fresh: 'live1',
          updated: true,
        });
        expect(exported.cells[1].widgetState).toEqual({
          fresh: 'live2',
          updated: true,
        });
      });

      it('should filter unknown widgets with useMinimalBounds: true', () => {
        const validCell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(3, 5),
          row: 3,
          col: 5,
          rowSpan: 2,
          colSpan: 2,
          widgetFactory: mockWidgetFactory,
          widgetState: { valid: true },
        };

        const unknownCell1: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(2, 4),
          row: 2,
          col: 4,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: unknownWidgetFactory,
          widgetState: { unknown: true },
        };

        const unknownCell2: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(8, 10),
          row: 8,
          col: 10,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: unknownWidgetFactory,
          widgetState: { unknown: true },
        };

        store.addWidget(validCell);
        store.addWidget(unknownCell1);
        store.addWidget(unknownCell2);

        const selection: GridSelection = {
          topLeft: { row: 1, col: 3 },
          bottomRight: { row: 10, col: 12 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // Minimal bounds calculated INCLUDING unknown widgets
        // Valid widget: (3,5) extends to (4,6)
        // Unknown1: (2,4)
        // Unknown2: (8,10)
        // Minimal bounds: row 2-8, col 4-10
        expect(exported.cells.length).toBe(1); // Unknown widgets filtered from export
        expect(exported.rows).toBe(7); // 8 - 2 + 1 (includes unknown widget bounds)
        expect(exported.columns).toBe(7); // 10 - 4 + 1 (includes unknown widget bounds)
        expect(exported.cells[0].widgetState).toEqual({ valid: true });
      });

      it('should filter unknown widgets with useMinimalBounds: false', () => {
        const validCell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(5, 6),
          row: 5,
          col: 6,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: { valid: true },
        };

        const unknownCell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(7, 8),
          row: 7,
          col: 8,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: unknownWidgetFactory,
          widgetState: { unknown: true },
        };

        store.addWidget(validCell);
        store.addWidget(unknownCell);

        const selection: GridSelection = {
          topLeft: { row: 4, col: 5 },
          bottomRight: { row: 9, col: 10 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: false,
        });

        // Should use full selection bounds and filter unknown widget
        expect(exported.cells.length).toBe(1);
        expect(exported.rows).toBe(6); // 9 - 4 + 1
        expect(exported.columns).toBe(6); // 10 - 5 + 1
        expect(exported.cells[0].widgetState).toEqual({ valid: true });
      });

      it('should combine live states, unknown widget filtering, and minimal bounds', () => {
        const validCell1: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(3, 4),
          row: 3,
          col: 4,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: { stale: 'data1' },
        };

        const validCell2: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(6, 9),
          row: 6,
          col: 9,
          rowSpan: 2,
          colSpan: 2,
          widgetFactory: mockWidgetFactory,
          widgetState: { stale: 'data2' },
        };

        const unknownCell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(10, 12),
          row: 10,
          col: 12,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: unknownWidgetFactory,
          widgetState: { unknown: true },
        };

        store.addWidget(validCell1);
        store.addWidget(validCell2);
        store.addWidget(unknownCell);

        const liveStates = new Map<string, unknown>();
        liveStates.set('3-4', { fresh: 'live1' });
        liveStates.set('6-9', { fresh: 'live2' });
        liveStates.set('10-12', { fresh: 'should-be-ignored' });

        const selection: GridSelection = {
          topLeft: { row: 2, col: 3 },
          bottomRight: { row: 12, col: 14 },
        };

        const exported = store.exportDashboard(() => liveStates, selection, {
          useMinimalBounds: true,
        });

        // Minimal bounds calculated INCLUDING unknown widget
        // Valid1: (3,4)
        // Valid2: (6,9) extends to (7,10)
        // Unknown: (10,12)
        // Minimal bounds: row 3-10, col 4-12
        expect(exported.cells.length).toBe(2); // Unknown filtered from export
        expect(exported.rows).toBe(8); // 10 - 3 + 1 (includes unknown)
        expect(exported.columns).toBe(9); // 12 - 4 + 1 (includes unknown)

        expect(exported.cells[0].widgetState).toEqual({ fresh: 'live1' });
        expect(exported.cells[1].widgetState).toEqual({ fresh: 'live2' });
      });
    });

    describe('Edge cases', () => {
      it('should handle empty selection (no widgets) with useMinimalBounds: true', () => {
        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(1, 1),
          row: 1,
          col: 1,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: { outside: true },
        };

        store.addWidget(cell);

        // Selection doesn't contain any widgets
        const selection: GridSelection = {
          topLeft: { row: 5, col: 7 },
          bottomRight: { row: 8, col: 10 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // Should fall back to selection bounds when no widgets
        expect(exported.cells.length).toBe(0);
        expect(exported.rows).toBe(4); // 8 - 5 + 1
        expect(exported.columns).toBe(4); // 10 - 7 + 1
      });

      it('should handle single cell selection with useMinimalBounds: true', () => {
        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(5, 7),
          row: 5,
          col: 7,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: { single: true },
        };

        store.addWidget(cell);

        const selection: GridSelection = {
          topLeft: { row: 5, col: 7 },
          bottomRight: { row: 5, col: 7 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // Single cell selection - minimal bounds same as selection
        expect(exported.rows).toBe(1);
        expect(exported.columns).toBe(1);
        expect(exported.cells.length).toBe(1);
        expect(exported.cells[0].row).toBe(1);
        expect(exported.cells[0].col).toBe(1);
      });

      it('should handle selection at grid origin with minimal bounds', () => {
        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(1, 1),
          row: 1,
          col: 1,
          rowSpan: 2,
          colSpan: 2,
          widgetFactory: mockWidgetFactory,
          widgetState: { origin: true },
        };

        store.addWidget(cell);

        const selection: GridSelection = {
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 5, col: 5 },
        };

        const exportedFalse = store.exportDashboard(undefined, selection, {
          useMinimalBounds: false,
        });
        const exportedTrue = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // False: uses selection (5x5)
        expect(exportedFalse.rows).toBe(5);
        expect(exportedFalse.columns).toBe(5);
        expect(exportedFalse.cells[0].row).toBe(1);
        expect(exportedFalse.cells[0].col).toBe(1);

        // True: shrinks to widget (2x2)
        expect(exportedTrue.rows).toBe(2);
        expect(exportedTrue.columns).toBe(2);
        expect(exportedTrue.cells[0].row).toBe(1);
        expect(exportedTrue.cells[0].col).toBe(1);
      });

      it('should handle large widget spanning entire minimal bounds', () => {
        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(4, 6),
          row: 4,
          col: 6,
          rowSpan: 5,
          colSpan: 7,
          widgetFactory: mockWidgetFactory,
          widgetState: { huge: true },
          flat: false,
        };

        store.addWidget(cell);

        const selection: GridSelection = {
          topLeft: { row: 2, col: 4 },
          bottomRight: { row: 10, col: 15 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // Widget spans from (4,6) to (8,12)
        expect(exported.rows).toBe(5); // Widget rowSpan
        expect(exported.columns).toBe(7); // Widget colSpan
        expect(exported.cells.length).toBe(1);
        expect(exported.cells[0].row).toBe(1);
        expect(exported.cells[0].col).toBe(1);
        expect(exported.cells[0].rowSpan).toBe(5);
        expect(exported.cells[0].colSpan).toBe(7);
      });

      it('should preserve gutterSize with minimal bounds', () => {
        store.setGridConfig({ rows: 12, columns: 16, gutterSize: '1.5rem' });

        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(5, 7),
          row: 5,
          col: 7,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: { test: true },
        };

        store.addWidget(cell);

        const selection: GridSelection = {
          topLeft: { row: 3, col: 5 },
          bottomRight: { row: 9, col: 11 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        expect(exported.gutterSize).toBe('1.5rem');
        expect(exported.rows).toBe(1);
        expect(exported.columns).toBe(1);
      });

      it('should handle only unknown widgets in selection with minimal bounds', () => {
        const unknownCell1: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(3, 5),
          row: 3,
          col: 5,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: unknownWidgetFactory,
          widgetState: { unknown: 'widget1' },
        };

        const unknownCell2: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(7, 9),
          row: 7,
          col: 9,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: unknownWidgetFactory,
          widgetState: { unknown: 'widget2' },
        };

        store.addWidget(unknownCell1);
        store.addWidget(unknownCell2);

        const selection: GridSelection = {
          topLeft: { row: 2, col: 4 },
          bottomRight: { row: 10, col: 12 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // Minimal bounds calculated on unknown widgets (before filtering)
        // Unknown1: (3,5)
        // Unknown2: (7,9)
        // Minimal bounds: row 3-7, col 5-9
        expect(exported.cells.length).toBe(0); // All widgets filtered from export
        expect(exported.rows).toBe(5); // 7 - 3 + 1 (based on unknown widget positions)
        expect(exported.columns).toBe(5); // 9 - 5 + 1 (based on unknown widget positions)
      });
    });

    describe('Coordinate transformation verification', () => {
      it('should transform coordinates correctly with scattered widgets and minimal bounds', () => {
        const widgets: CellData[] = [
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(4, 6),
            row: 4,
            col: 6,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: 'A' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(8, 12),
            row: 8,
            col: 12,
            rowSpan: 2,
            colSpan: 3,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: 'B' },
          },
        ];

        widgets.forEach((w) => store.addWidget(w));

        const selection: GridSelection = {
          topLeft: { row: 2, col: 4 },
          bottomRight: { row: 12, col: 16 },
        };

        const exportedFalse = store.exportDashboard(undefined, selection, {
          useMinimalBounds: false,
        });
        const exportedTrue = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // False: transforms relative to selection topLeft (2, 4)
        const falseA = exportedFalse.cells.find(
          (c) => (c.widgetState as any).id === 'A'
        );
        const falseB = exportedFalse.cells.find(
          (c) => (c.widgetState as any).id === 'B'
        );
        expect(falseA?.row).toBe(3); // 4 - (2 - 1)
        expect(falseA?.col).toBe(3); // 6 - (4 - 1)
        expect(falseB?.row).toBe(7); // 8 - (2 - 1)
        expect(falseB?.col).toBe(9); // 12 - (4 - 1)

        // True: transforms relative to minimal bounds topLeft (4, 6)
        const trueA = exportedTrue.cells.find(
          (c) => (c.widgetState as any).id === 'A'
        );
        const trueB = exportedTrue.cells.find(
          (c) => (c.widgetState as any).id === 'B'
        );
        expect(trueA?.row).toBe(1); // 4 - (4 - 1)
        expect(trueA?.col).toBe(1); // 6 - (6 - 1)
        expect(trueB?.row).toBe(5); // 8 - (4 - 1)
        expect(trueB?.col).toBe(7); // 12 - (6 - 1)

        // Verify dimensions
        expect(exportedFalse.rows).toBe(11); // Selection: 12 - 2 + 1
        expect(exportedTrue.rows).toBe(6); // Minimal: 9 - 4 + 1 = 6 (row 4-9)
        expect(exportedFalse.columns).toBe(13); // Selection: 16 - 4 + 1
        expect(exportedTrue.columns).toBe(9); // Minimal: 14 - 6 + 1 = 9 (col 6-14)
      });

      it('should maintain relative widget positions with minimal bounds', () => {
        const widgets: CellData[] = [
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(3, 5),
            row: 3,
            col: 5,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: '1' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(5, 5),
            row: 5,
            col: 5,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: '2' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(3, 8),
            row: 3,
            col: 8,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: '3' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(5, 8),
            row: 5,
            col: 8,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: '4' },
          },
        ];

        widgets.forEach((w) => store.addWidget(w));

        const selection: GridSelection = {
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 10, col: 12 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // Should maintain 2x2 grid pattern with 2-row and 3-col spacing
        const w1 = exported.cells.find(
          (c) => (c.widgetState as any).id === '1'
        );
        const w2 = exported.cells.find(
          (c) => (c.widgetState as any).id === '2'
        );
        const w3 = exported.cells.find(
          (c) => (c.widgetState as any).id === '3'
        );
        const w4 = exported.cells.find(
          (c) => (c.widgetState as any).id === '4'
        );

        // All should be transformed to minimal coordinate space starting at (1,1)
        expect(w1?.row).toBe(1); // 3 - (3 - 1)
        expect(w1?.col).toBe(1); // 5 - (5 - 1)
        expect(w2?.row).toBe(3); // 5 - (3 - 1)
        expect(w2?.col).toBe(1); // 5 - (5 - 1)
        expect(w3?.row).toBe(1); // 3 - (3 - 1)
        expect(w3?.col).toBe(4); // 8 - (5 - 1)
        expect(w4?.row).toBe(3); // 5 - (3 - 1)
        expect(w4?.col).toBe(4); // 8 - (5 - 1)

        // Verify relative spacing is maintained
        expect(w2!.row - w1!.row).toBe(2); // Row spacing preserved
        expect(w3!.col - w1!.col).toBe(3); // Column spacing preserved
      });
    });

    describe('Dimension calculations', () => {
      it('should calculate dimensions correctly with useMinimalBounds: false', () => {
        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(5, 8),
          row: 5,
          col: 8,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: {},
        };

        store.addWidget(cell);

        const selection: GridSelection = {
          topLeft: { row: 3, col: 6 },
          bottomRight: { row: 9, col: 12 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: false,
        });

        // Should use full selection dimensions
        expect(exported.rows).toBe(7); // 9 - 3 + 1
        expect(exported.columns).toBe(7); // 12 - 6 + 1
      });

      it('should calculate dimensions correctly with useMinimalBounds: true', () => {
        const cell: CellData = {
          widgetId: WidgetIdUtils.generate(),
          cellId: CellIdUtils.create(5, 8),
          row: 5,
          col: 8,
          rowSpan: 1,
          colSpan: 1,
          widgetFactory: mockWidgetFactory,
          widgetState: {},
        };

        store.addWidget(cell);

        const selection: GridSelection = {
          topLeft: { row: 3, col: 6 },
          bottomRight: { row: 9, col: 12 },
        };

        const exported = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // Should shrink to widget dimensions
        expect(exported.rows).toBe(1); // Widget is 1x1
        expect(exported.columns).toBe(1);
      });

      it('should show significant dimension reduction with scattered widgets', () => {
        const widgets: CellData[] = [
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(2, 3),
            row: 2,
            col: 3,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: '1' },
          },
          {
            widgetId: WidgetIdUtils.generate(),
            cellId: CellIdUtils.create(10, 14),
            row: 10,
            col: 14,
            rowSpan: 1,
            colSpan: 1,
            widgetFactory: mockWidgetFactory,
            widgetState: { id: '2' },
          },
        ];

        widgets.forEach((w) => store.addWidget(w));

        const selection: GridSelection = {
          topLeft: { row: 1, col: 1 },
          bottomRight: { row: 12, col: 16 },
        };

        const exportedFalse = store.exportDashboard(undefined, selection, {
          useMinimalBounds: false,
        });
        const exportedTrue = store.exportDashboard(undefined, selection, {
          useMinimalBounds: true,
        });

        // False: 12x16 = 192 cells
        expect(exportedFalse.rows).toBe(12);
        expect(exportedFalse.columns).toBe(16);

        // True: 9x12 = 108 cells (43% reduction)
        expect(exportedTrue.rows).toBe(9); // 10 - 2 + 1
        expect(exportedTrue.columns).toBe(12); // 14 - 3 + 1

        // Verify significant reduction
        const falseArea = exportedFalse.rows * exportedFalse.columns;
        const trueArea = exportedTrue.rows * exportedTrue.columns;
        expect(trueArea).toBeLessThan(falseArea * 0.6); // At least 40% reduction
      });
    });
  });
});
