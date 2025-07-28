import { TestBed } from '@angular/core/testing';
import { DashboardStore } from '../dashboard-store';
import { CellIdUtils, CellData, DragData, WidgetMetadata, WidgetFactory } from '../../models';
import { DashboardService } from '../../services/dashboard.service';

describe('DashboardStore - Collision Detection', () => {
  let store: InstanceType<typeof DashboardStore>;
  let dashboardService: jasmine.SpyObj<DashboardService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('DashboardService', ['getFactory']);
    
    TestBed.configureTestingModule({
      providers: [
        DashboardStore,
        { provide: DashboardService, useValue: spy }
      ]
    });
    
    store = TestBed.inject(DashboardStore);
    dashboardService = TestBed.inject(DashboardService) as jasmine.SpyObj<DashboardService>;
  });

  describe('isValidPlacement', () => {
    let testWidgetMetadata: WidgetMetadata;
    let mockWidgetFactory: WidgetFactory;

    beforeEach(() => {
      // Set up a 16x16 grid for real-world testing
      store.setGridConfig({ rows: 16, columns: 16 });
      
      // Create test widget metadata
      testWidgetMetadata = {
        widgetTypeid: 'test-widget',
        name: 'Test Widget',
        description: 'A test widget for unit tests',
        svgIcon: '<svg></svg>'
      };

      // Create mock widget factory
      mockWidgetFactory = {
        widgetTypeid: 'test-widget',
        createComponent: jasmine.createSpy('createComponent')
      } as any;
    });

    it('should return true when no drag data is present', () => {
      expect(store.isValidPlacement()).toBe(true);
    });

    it('should return true when no hovered drop zone is present', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      expect(store.isValidPlacement()).toBe(true);
    });

    it('should return true for valid widget placement in empty grid', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 8, col: 8 });
      expect(store.isValidPlacement()).toBe(true);
    });

    it('should return false for out-of-bounds placement', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 17, col: 8 }); // Row 17 is out of bounds
      expect(store.isValidPlacement()).toBe(false);
    });

    it('should return false for collision with existing widget', () => {
      // Add an existing widget at position (5,5)
      const existingCell: CellData = {
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(existingCell);

      // Try to place a new widget at the same position
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 5, col: 5 });
      expect(store.isValidPlacement()).toBe(false);
    });

    it('should return true for self-overlap when moving 3x3 widget one step right', () => {
      // Add a 3x3 widget at position (5,5) - occupies (5,5) to (7,7)
      const existingCell: CellData = {
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 3,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(existingCell);

      // Try to move the same widget one position to the right (partial overlap)
      // New position would be (5,6) to (7,8) - overlaps with original (5,5) to (7,7)
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(5, 5),
          row: 5,
          col: 5,
          rowSpan: 3,
          colSpan: 3,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 5, col: 6 }); // Move one column right
      expect(store.isValidPlacement()).toBe(true);
    });

    it('should return true for self-overlap when moving 3x3 widget one step down', () => {
      // Add a 3x3 widget at position (5,5) - occupies (5,5) to (7,7)
      const existingCell: CellData = {
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 3,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(existingCell);

      // Try to move the same widget one position down (partial overlap)
      // New position would be (6,5) to (8,7) - overlaps with original (5,5) to (7,7)
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(5, 5),
          row: 5,
          col: 5,
          rowSpan: 3,
          colSpan: 3,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 6, col: 5 }); // Move one row down
      expect(store.isValidPlacement()).toBe(true);
    });

    it('should return false when moving widget would collide with other widget', () => {
      // Add two widgets with space between them
      const widget1: CellData = {
        cellId: CellIdUtils.create(3, 3),
        row: 3,
        col: 3,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      const widget2: CellData = {
        cellId: CellIdUtils.create(10, 10),
        row: 10,
        col: 10,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(widget1);
      store.addWidget(widget2);

      // Try to move widget-1 to overlap with widget-2
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(3, 3),
          row: 3,
          col: 3,
          rowSpan: 2,
          colSpan: 2,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 10, col: 10 }); // Same position as widget-2
      expect(store.isValidPlacement()).toBe(false);
    });

    it('should return false when large widget goes out of bounds', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(5, 5),
          row: 5,
          col: 5,
          rowSpan: 4,
          colSpan: 4,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 14, col: 14 }); // 4x4 widget at (14,14) would extend to (17,17), out of bounds
      expect(store.isValidPlacement()).toBe(false);
    });

    it('should return true when large widget is placed at valid boundary position', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(5, 5),
          row: 5,
          col: 5,
          rowSpan: 4,
          colSpan: 4,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 13, col: 13 }); // 4x4 widget at (13,13) extends to (16,16), which is valid
      expect(store.isValidPlacement()).toBe(true);
    });

    it('should handle complex self-overlap scenario with 2x5 widget', () => {
      // Add a 2x5 horizontal widget at position (8,6) - occupies (8,6) to (9,10)
      const existingCell: CellData = {
        cellId: CellIdUtils.create(8, 6),
        row: 8,
        col: 6,
        rowSpan: 2,
        colSpan: 5,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(existingCell);

      // Try to move it 2 columns to the right
      // New position would be (8,8) to (9,12) - partial overlap with original
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(8, 6),
          row: 8,
          col: 6,
          rowSpan: 2,
          colSpan: 5,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 8, col: 8 }); // Move 2 columns right
      expect(store.isValidPlacement()).toBe(true);
    });

    it('should prevent collision between different widgets even with complex shapes', () => {
      // Add an L-shaped arrangement using multiple widgets
      const widget1: CellData = {
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 1,
        colSpan: 3, // Horizontal bar: (5,5) to (5,7)
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      const widget2: CellData = {
        cellId: CellIdUtils.create(6, 5),
        row: 6,
        col: 5,
        rowSpan: 2,
        colSpan: 1, // Vertical bar: (6,5) to (7,5)
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(widget1);
      store.addWidget(widget2);

      // Try to place a 2x2 widget that would overlap with both
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 5, col: 6 }); // Would overlap with widget-1
      expect(store.isValidPlacement()).toBe(false);
    });
  });

  describe('handleDrop', () => {
    let testWidgetMetadata: WidgetMetadata;
    let mockWidgetFactory: WidgetFactory;

    beforeEach(() => {
      // Set up a 16x16 grid for real-world testing
      store.setGridConfig({ rows: 16, columns: 16 });
      
      // Create test widget metadata
      testWidgetMetadata = {
        widgetTypeid: 'test-widget',
        name: 'Test Widget',
        description: 'A test widget for unit tests',
        svgIcon: '<svg></svg>'
      };

      // Create mock widget factory
      mockWidgetFactory = {
        widgetTypeid: 'test-widget',
        createComponent: jasmine.createSpy('createComponent')
      } as any;

      // Mock the dashboard service getFactory method
      dashboardService.getFactory.and.returnValue(mockWidgetFactory);
    });

    it('should create widget when dropping widget drag data on empty space', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      
      const result = store.handleDrop(dragData, { row: 8, col: 8 });
      
      expect(result).toBe(true);
      expect(store.cells().length).toBe(1);
      expect(store.cells()[0].row).toBe(8);
      expect(store.cells()[0].col).toBe(8);
    });

    it('should move cell when dropping cell drag data on valid position', () => {
      // Add an existing widget at position (5,5)
      const existingCell: CellData = {
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 3,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(existingCell);

      // Drag data for moving the cell
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(5, 5),
          row: 5,
          col: 5,
          rowSpan: 3,
          colSpan: 3,
        }
      };
      
      const result = store.handleDrop(dragData, { row: 6, col: 6 });
      
      expect(result).toBe(true);
      expect(store.cells().length).toBe(1);
      expect(store.cells()[0].row).toBe(6);
      expect(store.cells()[0].col).toBe(6);
    });

    it('should return false for invalid placements due to collision', () => {
      // Add two widgets
      const widget1: CellData = {
        cellId: CellIdUtils.create(3, 3),
        row: 3,
        col: 3,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      const widget2: CellData = {
        cellId: CellIdUtils.create(10, 10),
        row: 10,
        col: 10,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(widget1);
      store.addWidget(widget2);

      // Try to move widget1 to overlap with widget2
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(3, 3),
          row: 3,
          col: 3,
          rowSpan: 2,
          colSpan: 2,
        }
      };
      
      const result = store.handleDrop(dragData, { row: 10, col: 10 });
      
      expect(result).toBe(false);
      // Verify original positions unchanged
      expect(store.cells()[0].row).toBe(3);
      expect(store.cells()[0].col).toBe(3);
      expect(store.cells()[1].row).toBe(10);
      expect(store.cells()[1].col).toBe(10);
    });

    it('should return false for out-of-bounds placement', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      
      const result = store.handleDrop(dragData, { row: 17, col: 8 }); // Row 17 is out of bounds
      
      expect(result).toBe(false);
      expect(store.cells().length).toBe(0);
    });

    it('should end drag state regardless of success or failure', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      
      // Start drag first
      store.startDrag(dragData);
      expect(store.dragData()).toBeTruthy();
      
      // Handle valid drop
      store.handleDrop(dragData, { row: 8, col: 8 });
      expect(store.dragData()).toBeNull();
      
      // Start drag again  
      store.startDrag(dragData);
      expect(store.dragData()).toBeTruthy();
      
      // Handle invalid drop (out of bounds)
      store.handleDrop(dragData, { row: 17, col: 8 });
      expect(store.dragData()).toBeNull();
    });

    it('should allow self-overlap when moving cell to partially overlapping position', () => {
      // Add a 3x3 widget at position (5,5)
      const existingCell: CellData = {
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 3,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(existingCell);

      // Try to move it one position right (self-overlap scenario)
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(5, 5),
          row: 5,
          col: 5,
          rowSpan: 3,
          colSpan: 3,
        }
      };
      
      const result = store.handleDrop(dragData, { row: 5, col: 6 });
      
      expect(result).toBe(true);
      expect(store.cells()[0].row).toBe(5);
      expect(store.cells()[0].col).toBe(6);
    });
  });

});