import { TestBed } from '@angular/core/testing';
import { DashboardStore } from '../dashboard-store';
import { CellIdUtils, CellData, DragData, WidgetMetadata, WidgetFactory } from '../../models';
import { DashboardService } from '../../services/dashboard.service';

describe('DashboardStore - Computed Properties', () => {
  let store: InstanceType<typeof DashboardStore>;
  let mockWidgetFactory: WidgetFactory;
  let testWidgetMetadata: WidgetMetadata;
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
    store.setGridConfig({ rows: 16, columns: 16 });
    
    mockWidgetFactory = {
      widgetTypeid: 'test-widget',
      createComponent: jasmine.createSpy('createComponent')
    } as any;

    testWidgetMetadata = {
      widgetTypeid: 'test-widget',
      name: 'Test Widget',
      description: 'A test widget for unit tests',
      svgIcon: '<svg></svg>'
    };

    dashboardService.getFactory.and.returnValue(mockWidgetFactory);
  });

  describe('resizePreviewCells', () => {
    let cellId: ReturnType<typeof CellIdUtils.create>;

    beforeEach(() => {
      cellId = CellIdUtils.create(4, 4);
      const cell: CellData = {
        cellId,
        row: 4,
        col: 4,
        rowSpan: 2,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);
    });

    it('should return empty array when no resize is active', () => {
      expect(store.resizePreviewCells()).toEqual([]);
    });

    it('should return empty array when resize data exists but widget is removed', () => {
      store.startResize(cellId);
      store.removeWidget(cellId);

      expect(store.resizePreviewCells()).toEqual([]);
    });

    it('should calculate preview cells for original widget size', () => {
      store.startResize(cellId);

      const previewCells = store.resizePreviewCells();

      expect(previewCells.length).toBe(6); // 2x3 widget
      expect(previewCells).toContain(jasmine.objectContaining({ row: 4, col: 4 }));
      expect(previewCells).toContain(jasmine.objectContaining({ row: 4, col: 5 }));
      expect(previewCells).toContain(jasmine.objectContaining({ row: 4, col: 6 }));
      expect(previewCells).toContain(jasmine.objectContaining({ row: 5, col: 4 }));
      expect(previewCells).toContain(jasmine.objectContaining({ row: 5, col: 5 }));
      expect(previewCells).toContain(jasmine.objectContaining({ row: 5, col: 6 }));
    });

    it('should update preview cells when resize preview changes horizontally', () => {
      store.startResize(cellId);
      store.updateResizePreview('horizontal', 2); // colSpan becomes 5

      const previewCells = store.resizePreviewCells();

      expect(previewCells.length).toBe(10); // 2x5 widget
      expect(previewCells).toContain(jasmine.objectContaining({ row: 4, col: 4 }));
      expect(previewCells).toContain(jasmine.objectContaining({ row: 4, col: 8 })); // rightmost
      expect(previewCells).toContain(jasmine.objectContaining({ row: 5, col: 4 }));
      expect(previewCells).toContain(jasmine.objectContaining({ row: 5, col: 8 })); // bottom-right
    });

    it('should update preview cells when resize preview changes vertically', () => {
      store.startResize(cellId);
      store.updateResizePreview('vertical', 1); // rowSpan becomes 3

      const previewCells = store.resizePreviewCells();

      expect(previewCells.length).toBe(9); // 3x3 widget
      expect(previewCells).toContain(jasmine.objectContaining({ row: 4, col: 4 }));
      expect(previewCells).toContain(jasmine.objectContaining({ row: 6, col: 4 })); // bottommost
      expect(previewCells).toContain(jasmine.objectContaining({ row: 6, col: 6 })); // bottom-right
    });

    it('should handle single cell preview when resized to minimum', () => {
      store.startResize(cellId);
      store.updateResizePreview('horizontal', -5); // Reduce to minimum
      store.updateResizePreview('vertical', -5); // Reduce to minimum

      const previewCells = store.resizePreviewCells();

      expect(previewCells.length).toBe(1);
      expect(previewCells[0]).toEqual(jasmine.objectContaining({ row: 4, col: 4 }));
    });

    it('should handle large preview sizes', () => {
      store.startResize(cellId);
      store.updateResizePreview('horizontal', 8); // colSpan becomes 11
      store.updateResizePreview('vertical', 6); // rowSpan becomes 8

      const previewCells = store.resizePreviewCells();

      expect(previewCells.length).toBe(88); // 8x11 widget
      expect(previewCells).toContain(jasmine.objectContaining({ row: 4, col: 4 })); // top-left
      expect(previewCells).toContain(jasmine.objectContaining({ row: 11, col: 14 })); // bottom-right
    });

    it('should update reactively when resize preview changes multiple times', () => {
      store.startResize(cellId);

      // Initial state
      expect(store.resizePreviewCells().length).toBe(6);

      // First change
      store.updateResizePreview('horizontal', 1);
      expect(store.resizePreviewCells().length).toBe(8); // 2x4

      // Second change
      store.updateResizePreview('vertical', 1);
      expect(store.resizePreviewCells().length).toBe(12); // 3x4

      // Third change  
      store.updateResizePreview('horizontal', -2);
      const finalResizeData = store.resizeData();
      expect(finalResizeData?.previewRowSpan).toBe(3);
      expect(finalResizeData?.previewColSpan).toBe(1);
      expect(store.resizePreviewCells().length).toBe(3); // 3x1
    });
  });

  describe('resizePreviewMap', () => {
    let cellId: ReturnType<typeof CellIdUtils.create>;

    beforeEach(() => {
      cellId = CellIdUtils.create(8, 8);
      const cell: CellData = {
        cellId,
        row: 8,
        col: 8,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);
    });

    it('should return empty set when no resize is active', () => {
      expect(store.resizePreviewMap().size).toBe(0);
    });

    it('should create map from preview cells', () => {
      store.startResize(cellId);
      store.updateResizePreview('horizontal', 2);
      store.updateResizePreview('vertical', 1);

      const previewMap = store.resizePreviewMap();

      expect(previewMap.size).toBe(6); // 2x3 grid
      expect(previewMap.has(CellIdUtils.create(8, 8))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(8, 9))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(8, 10))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(9, 8))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(9, 9))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(9, 10))).toBe(true);
    });

    it('should not contain cells outside preview area', () => {
      store.startResize(cellId);
      store.updateResizePreview('horizontal', 1);

      const previewMap = store.resizePreviewMap();

      expect(previewMap.has(CellIdUtils.create(8, 8))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(8, 9))).toBe(true);
      expect(previewMap.has(CellIdUtils.create(8, 10))).toBe(false);
      expect(previewMap.has(CellIdUtils.create(9, 8))).toBe(false);
      expect(previewMap.has(CellIdUtils.create(7, 8))).toBe(false);
    });

    it('should update when preview changes', () => {
      store.startResize(cellId);

      let previewMap = store.resizePreviewMap();
      expect(previewMap.size).toBe(1);

      store.updateResizePreview('horizontal', 1);
      previewMap = store.resizePreviewMap();
      expect(previewMap.size).toBe(2);

      store.updateResizePreview('vertical', 2);
      previewMap = store.resizePreviewMap();
      expect(previewMap.size).toBe(6);
    });

    it('should handle single cell map efficiently', () => {
      store.startResize(cellId);

      const previewMap = store.resizePreviewMap();

      expect(previewMap.size).toBe(1);
      expect(previewMap.has(CellIdUtils.create(8, 8))).toBe(true);
    });

    it('should be empty when widget is removed during resize', () => {
      store.startResize(cellId);
      store.updateResizePreview('horizontal', 2);
      
      store.removeWidget(cellId);

      expect(store.resizePreviewMap().size).toBe(0);
    });
  });

  describe('highlightedZones', () => {
    it('should return empty array when no drag data', () => {
      expect(store.highlightedZones()).toEqual([]);
    });

    it('should return empty array when no hovered drop zone', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);

      expect(store.highlightedZones()).toEqual([]);
    });

    it('should return empty array when both drag data and hovered zone are null', () => {
      expect(store.highlightedZones()).toEqual([]);
    });

    it('should calculate highlighted zones for widget drag (single cell)', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 5, col: 8 });

      const zones = store.highlightedZones();

      expect(zones.length).toBe(1);
      expect(zones[0]).toEqual({ row: 5, col: 8 });
    });

    it('should calculate highlighted zones for cell drag (multi-cell)', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(3, 3),
          row: 3,
          col: 3,
          rowSpan: 2,
          colSpan: 3,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 6, col: 7 });

      const zones = store.highlightedZones();

      expect(zones.length).toBe(6); // 2x3 grid
      expect(zones).toContain(jasmine.objectContaining({ row: 6, col: 7 }));
      expect(zones).toContain(jasmine.objectContaining({ row: 6, col: 8 }));
      expect(zones).toContain(jasmine.objectContaining({ row: 6, col: 9 }));
      expect(zones).toContain(jasmine.objectContaining({ row: 7, col: 7 }));
      expect(zones).toContain(jasmine.objectContaining({ row: 7, col: 8 }));
      expect(zones).toContain(jasmine.objectContaining({ row: 7, col: 9 }));
    });

    it('should update when hovered drop zone changes', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(1, 1),
          row: 1,
          col: 1,
          rowSpan: 1,
          colSpan: 2,
        }
      };
      store.startDrag(dragData);

      store.setHoveredDropZone({ row: 3, col: 3 });
      let zones = store.highlightedZones();
      expect(zones).toEqual([
        { row: 3, col: 3 },
        { row: 3, col: 4 }
      ]);

      store.setHoveredDropZone({ row: 8, col: 10 });
      zones = store.highlightedZones();
      expect(zones).toEqual([
        { row: 8, col: 10 },
        { row: 8, col: 11 }
      ]);
    });

    it('should update when drag data changes', () => {
      store.setHoveredDropZone({ row: 5, col: 5 });

      const dragData1: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData1);
      let zones = store.highlightedZones();
      expect(zones.length).toBe(1);

      const dragData2: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(2, 2),
          row: 2,
          col: 2,
          rowSpan: 3,
          colSpan: 2,
        }
      };
      store.startDrag(dragData2);
      zones = store.highlightedZones();
      expect(zones.length).toBe(6); // 3x2 grid
    });

    it('should handle large cell drag spans', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(1, 1),
          row: 1,
          col: 1,
          rowSpan: 4,
          colSpan: 5,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 2, col: 3 });

      const zones = store.highlightedZones();

      expect(zones.length).toBe(20); // 4x5 grid
      expect(zones).toContain(jasmine.objectContaining({ row: 2, col: 3 })); // top-left
      expect(zones).toContain(jasmine.objectContaining({ row: 2, col: 7 })); // top-right
      expect(zones).toContain(jasmine.objectContaining({ row: 5, col: 3 })); // bottom-left
      expect(zones).toContain(jasmine.objectContaining({ row: 5, col: 7 })); // bottom-right
    });

    it('should clear when drag ends', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 5, col: 5 });

      expect(store.highlightedZones().length).toBe(1);

      store.endDrag();

      expect(store.highlightedZones()).toEqual([]);
    });
  });

  describe('highlightMap', () => {
    it('should return empty set when no highlighted zones', () => {
      expect(store.highlightMap().size).toBe(0);
    });

    it('should create map from highlighted zones for widget drag', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 7, col: 9 });

      const highlightMap = store.highlightMap();

      expect(highlightMap.size).toBe(1);
      expect(highlightMap.has(CellIdUtils.create(7, 9))).toBe(true);
    });

    it('should create map from highlighted zones for cell drag', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(4, 4),
          row: 4,
          col: 4,
          rowSpan: 2,
          colSpan: 2,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 8, col: 10 });

      const highlightMap = store.highlightMap();

      expect(highlightMap.size).toBe(4);
      expect(highlightMap.has(CellIdUtils.create(8, 10))).toBe(true);
      expect(highlightMap.has(CellIdUtils.create(8, 11))).toBe(true);
      expect(highlightMap.has(CellIdUtils.create(9, 10))).toBe(true);
      expect(highlightMap.has(CellIdUtils.create(9, 11))).toBe(true);
    });

    it('should not contain cells outside highlighted zones', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(1, 1),
          row: 1,
          col: 1,
          rowSpan: 1,
          colSpan: 2,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 5, col: 5 });

      const highlightMap = store.highlightMap();

      expect(highlightMap.has(CellIdUtils.create(5, 5))).toBe(true);
      expect(highlightMap.has(CellIdUtils.create(5, 6))).toBe(true);
      expect(highlightMap.has(CellIdUtils.create(5, 7))).toBe(false);
      expect(highlightMap.has(CellIdUtils.create(6, 5))).toBe(false);
      expect(highlightMap.has(CellIdUtils.create(4, 5))).toBe(false);
    });

    it('should update when highlighted zones change', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);

      store.setHoveredDropZone({ row: 3, col: 3 });
      let highlightMap = store.highlightMap();
      expect(highlightMap.size).toBe(1);
      expect(highlightMap.has(CellIdUtils.create(3, 3))).toBe(true);

      store.setHoveredDropZone({ row: 7, col: 12 });
      highlightMap = store.highlightMap();
      expect(highlightMap.size).toBe(1);
      expect(highlightMap.has(CellIdUtils.create(3, 3))).toBe(false);
      expect(highlightMap.has(CellIdUtils.create(7, 12))).toBe(true);
    });

    it('should handle large highlighted zones efficiently', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(1, 1),
          row: 1,
          col: 1,
          rowSpan: 5,
          colSpan: 4,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 2, col: 2 });

      const highlightMap = store.highlightMap();

      expect(highlightMap.size).toBe(20); // 5x4 grid
      expect(highlightMap.has(CellIdUtils.create(2, 2))).toBe(true);
      expect(highlightMap.has(CellIdUtils.create(6, 5))).toBe(true);
      expect(highlightMap.has(CellIdUtils.create(1, 1))).toBe(false);
      expect(highlightMap.has(CellIdUtils.create(7, 6))).toBe(false);
    });

    it('should be empty when drag ends', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 5, col: 5 });

      expect(store.highlightMap().size).toBe(1);

      store.endDrag();

      expect(store.highlightMap().size).toBe(0);
    });
  });

  describe('invalidHighlightMap', () => {
    beforeEach(() => {
      // Add some existing widgets to create collision scenarios
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
        cellId: CellIdUtils.create(8, 8),
        row: 8,
        col: 8,
        rowSpan: 1,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(widget1);
      store.addWidget(widget2);
    });

    it('should return empty set when no drag data', () => {
      expect(store.invalidHighlightMap().size).toBe(0);
    });

    it('should return empty set when no hovered drop zone', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);

      expect(store.invalidHighlightMap().size).toBe(0);
    });

    it('should return empty set for valid placement', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 1, col: 1 }); // Empty space

      expect(store.invalidHighlightMap().size).toBe(0);
    });

    it('should return invalid cells for collision with existing widget', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 3, col: 3 }); // Collides with widget1

      const invalidMap = store.invalidHighlightMap();

      expect(invalidMap.size).toBe(1);
      expect(invalidMap.has(CellIdUtils.create(3, 3))).toBe(true);
    });

    it('should return invalid cells for partial collision', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(1, 1),
          row: 1,
          col: 1,
          rowSpan: 2,
          colSpan: 2,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 2, col: 2 }); // Partially overlaps widget1

      const invalidMap = store.invalidHighlightMap();

      expect(invalidMap.size).toBe(4); // All cells in the 2x2 footprint
      expect(invalidMap.has(CellIdUtils.create(2, 2))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(2, 3))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(3, 2))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(3, 3))).toBe(true);
    });

    it('should return invalid cells for out of bounds placement', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 17, col: 5 }); // Row out of bounds

      const invalidMap = store.invalidHighlightMap();

      expect(invalidMap.size).toBe(1);
      expect(invalidMap.has(CellIdUtils.create(17, 5))).toBe(true);
    });

    it('should return invalid cells for multi-cell out of bounds', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(1, 1),
          row: 1,
          col: 1,
          rowSpan: 2,
          colSpan: 3,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 15, col: 15 }); // Spans out of bounds

      const invalidMap = store.invalidHighlightMap();

      expect(invalidMap.size).toBe(6); // All cells in the 2x3 footprint
      expect(invalidMap.has(CellIdUtils.create(15, 15))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(15, 16))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(15, 17))).toBe(true); // Out of bounds
      expect(invalidMap.has(CellIdUtils.create(16, 15))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(16, 16))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(16, 17))).toBe(true); // Out of bounds
    });

    it('should exclude self when moving existing cell', () => {
      const cellId = CellIdUtils.create(3, 3);
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId,
          row: 3,
          col: 3,
          rowSpan: 2,
          colSpan: 2,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 4, col: 4 }); // Partial self-overlap

      const invalidMap = store.invalidHighlightMap();

      expect(invalidMap.size).toBe(0); // Self-overlap should be allowed
    });

    it('should detect collision when moving cell to occupied space', () => {
      const cellId = CellIdUtils.create(3, 3);
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId,
          row: 3,
          col: 3,
          rowSpan: 2,
          colSpan: 2,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 8, col: 8 }); // Collides with widget2

      const invalidMap = store.invalidHighlightMap();

      expect(invalidMap.size).toBe(4); // All cells in the 2x2 footprint
      expect(invalidMap.has(CellIdUtils.create(8, 8))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(8, 9))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(9, 8))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(9, 9))).toBe(true);
    });

    it('should update when hovered zone changes from valid to invalid', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);

      // Valid placement
      store.setHoveredDropZone({ row: 1, col: 1 });
      expect(store.invalidHighlightMap().size).toBe(0);

      // Invalid placement
      store.setHoveredDropZone({ row: 3, col: 3 });
      expect(store.invalidHighlightMap().size).toBe(1);

      // Valid placement again
      store.setHoveredDropZone({ row: 6, col: 6 });
      expect(store.invalidHighlightMap().size).toBe(0);
    });

    it('should handle complex collision scenarios', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(1, 1),
          row: 1,
          col: 1,
          rowSpan: 3,
          colSpan: 4,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 2, col: 2 }); // Large widget overlapping both existing widgets

      const invalidMap = store.invalidHighlightMap();

      expect(invalidMap.size).toBe(12); // All cells in the 3x4 footprint are invalid
      expect(invalidMap.has(CellIdUtils.create(2, 2))).toBe(true);
      expect(invalidMap.has(CellIdUtils.create(4, 5))).toBe(true);
    });

    it('should be empty when drag ends', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 3, col: 3 }); // Invalid placement

      expect(store.invalidHighlightMap().size).toBe(1);

      store.endDrag();

      expect(store.invalidHighlightMap().size).toBe(0);
    });
  });

  describe('isValidPlacement', () => {
    beforeEach(() => {
      // Add existing widget for collision testing
      const widget: CellData = {
        cellId: CellIdUtils.create(5, 5),
        row: 5,
        col: 5,
        rowSpan: 2,
        colSpan: 2,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(widget);
    });

    it('should return true when no drag data', () => {
      expect(store.isValidPlacement()).toBe(true);
    });

    it('should return true when no hovered drop zone', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);

      expect(store.isValidPlacement()).toBe(true);
    });

    it('should return true for valid placement', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 1, col: 1 }); // Empty space

      expect(store.isValidPlacement()).toBe(true);
    });

    it('should return false for collision', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 5, col: 5 }); // Collides with existing widget

      expect(store.isValidPlacement()).toBe(false);
    });

    it('should return false for out of bounds', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 17, col: 5 }); // Row out of bounds

      expect(store.isValidPlacement()).toBe(false);
    });

    it('should return true for self-overlap when moving existing cell', () => {
      const cellId = CellIdUtils.create(5, 5);
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId,
          row: 5,
          col: 5,
          rowSpan: 2,
          colSpan: 2,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 6, col: 6 }); // Partial self-overlap

      expect(store.isValidPlacement()).toBe(true);
    });

    it('should return false for collision when moving cell to occupied space', () => {
      // Add another widget
      const widget2: CellData = {
        cellId: CellIdUtils.create(10, 10),
        row: 10,
        col: 10,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(widget2);

      const cellId = CellIdUtils.create(5, 5);
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId,
          row: 5,
          col: 5,
          rowSpan: 2,
          colSpan: 2,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 10, col: 10 }); // Collides with widget2

      expect(store.isValidPlacement()).toBe(false);
    });

    it('should update reactively when placement validity changes', () => {
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);

      store.setHoveredDropZone({ row: 1, col: 1 });
      expect(store.isValidPlacement()).toBe(true);

      store.setHoveredDropZone({ row: 5, col: 5 });
      expect(store.isValidPlacement()).toBe(false);

      store.setHoveredDropZone({ row: 8, col: 8 });
      expect(store.isValidPlacement()).toBe(true);
    });
  });

  describe('computed properties integration', () => {
    it('should maintain consistency between highlight maps and zones', () => {
      const dragData: DragData = {
        kind: 'cell',
        content: {
          cellId: CellIdUtils.create(1, 1),
          row: 1,
          col: 1,
          rowSpan: 2,
          colSpan: 3,
        }
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 3, col: 4 });

      const zones = store.highlightedZones();
      const highlightMap = store.highlightMap();

      expect(zones.length).toBe(highlightMap.size);
      
      zones.forEach(zone => {
        expect(highlightMap.has(CellIdUtils.create(zone.row, zone.col))).toBe(true);
      });
    });

    it('should maintain consistency between resize preview cells and map', () => {
      const cellId = CellIdUtils.create(4, 4);
      const cell: CellData = {
        cellId,
        row: 4,
        col: 4,
        rowSpan: 2,
        colSpan: 3,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);
      store.startResize(cellId);
      store.updateResizePreview('horizontal', 1);

      const previewCells = store.resizePreviewCells();
      const previewMap = store.resizePreviewMap();

      expect(previewCells.length).toBe(previewMap.size);
      
      previewCells.forEach(cell => {
        expect(previewMap.has(CellIdUtils.create(cell.row, cell.col))).toBe(true);
      });
    });

    it('should handle simultaneous drag and resize operations', () => {
      // Start resize
      const cellId = CellIdUtils.create(3, 3);
      const cell: CellData = {
        cellId,
        row: 3,
        col: 3,
        rowSpan: 1,
        colSpan: 1,
        widgetFactory: mockWidgetFactory,
        widgetState: {},
      };
      store.addWidget(cell);
      store.startResize(cellId);

      // Start drag
      const dragData: DragData = {
        kind: 'widget',
        content: testWidgetMetadata
      };
      store.startDrag(dragData);
      store.setHoveredDropZone({ row: 8, col: 8 });

      // Both should work independently
      expect(store.resizePreviewCells().length).toBe(1);
      expect(store.highlightedZones().length).toBe(1);
      expect(store.isValidPlacement()).toBe(true);
    });
  });
});